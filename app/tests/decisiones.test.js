/**
 * tests/decisiones.test.js — Decision Ledger + RAG: memoria de decisiones.
 * Valida captura automática al completar, registro manual, aislamiento
 * por usuario y consulta con IA (datos delimitados) + fallback determinista.
 */

// Aislar del entorno ambiental: los fallbacks deterministas exigen DEMO_MODE off.
delete process.env.DEMO_MODE;

const request = require('supertest');
const { app, resetDbs, createTestUser, getDataDb, mockGroqCreate, groqError } = require('./setup');

function nodo(overrides) {
    return {
        id: `d_${Math.random().toString(36).slice(2, 8)}`,
        userId: 'x', orgId: 'y',
        textoOriginal: 'Misión de prueba', resumen: 'Misión de prueba',
        estado: 'pendiente', prioridad: 'media', x: 10, y: 10,
        fecha: new Date().toISOString(),
        ...overrides
    };
}

describe('🧠 Decision Ledger (memoria de decisiones)', () => {
    beforeEach(() => {
        resetDbs();
        mockGroqCreate.mockReset();
    });

    test('completar una misión registra la decisión automáticamente', async () => {
        const { user, token } = await createTestUser('ceo_dec', 'test123', 'ceo');
        getDataDb().push(nodo({ id: 'n1', userId: user.id, orgId: user.orgId, resumen: 'Expandir Latam' }));

        await request(app).patch('/api/ideas/n1/estado')
            .set('Authorization', `Bearer ${token}`)
            .send({ estado: 'completado' });

        const lista = await request(app).get('/api/decisiones').set('Authorization', `Bearer ${token}`);
        expect(lista.status).toBe(200);
        expect(lista.body.decisiones).toHaveLength(1);
        expect(lista.body.decisiones[0]).toMatchObject({ tema: 'Expandir Latam', resultado: 'completado' });
    });

    test('registro manual con validación', async () => {
        const { token } = await createTestUser('ceo_dec2', 'test123', 'ceo');

        const vacia = await request(app).post('/api/decisiones')
            .set('Authorization', `Bearer ${token}`).send({ tema: '  ' });
        expect(vacia.status).toBe(400);

        const ok = await request(app).post('/api/decisiones')
            .set('Authorization', `Bearer ${token}`)
            .send({ tema: 'Apostar por Latam en Q3', contexto: 'Validar México y Colombia', resultado: 'decidido' });
        expect(ok.status).toBe(201);
        expect(ok.body.decision.tema).toBe('Apostar por Latam en Q3');
    });

    test('aislamiento: cada usuario solo ve sus decisiones', async () => {
        const a = await createTestUser('ceo_a', 'test123', 'ceo');
        const b = await createTestUser('ceo_b', 'test123', 'ceo');
        await request(app).post('/api/decisiones')
            .set('Authorization', `Bearer ${a.token}`).send({ tema: 'Secreta de A' });

        const listaB = await request(app).get('/api/decisiones').set('Authorization', `Bearer ${b.token}`);
        expect(listaB.body.decisiones).toHaveLength(0);
    });

    test('consultar usa la IA con los datos delimitados y cuenta las decisiones', async () => {
        const { token } = await createTestUser('ceo_dec3', 'test123', 'ceo');
        await request(app).post('/api/decisiones')
            .set('Authorization', `Bearer ${token}`)
            .send({ tema: 'Latam Q3', resultado: 'completado' });
        mockGroqCreate.mockResolvedValue({
            choices: [{ message: { content: 'En marzo decidiste apostar por Latam Q3.' } }]
        });

        const res = await request(app).post('/api/decisiones/consultar')
            .set('Authorization', `Bearer ${token}`)
            .send({ pregunta: '¿Qué decidimos sobre Latam?' });

        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('groq');
        expect(res.body.decisionesUsadas).toBe(1);
        expect(res.body.respuesta).toContain('Latam');
        const messages = mockGroqCreate.mock.calls[0][0].messages;
        const userMsg = messages.find(m => m.role === 'user').content;
        expect(userMsg).toMatch(/^<datos>/);
        expect(userMsg).toContain('Latam Q3');
    });

    test('sin IA responde con el fallback determinista (nunca 500)', async () => {
        const { token } = await createTestUser('ceo_dec4', 'test123', 'ceo');
        await request(app).post('/api/decisiones')
            .set('Authorization', `Bearer ${token}`).send({ tema: 'Recorte de presupuesto' });
        mockGroqCreate.mockRejectedValue(groqError(503, 'Service Unavailable'));

        const res = await request(app).post('/api/decisiones/consultar')
            .set('Authorization', `Bearer ${token}`)
            .send({ pregunta: '¿Qué recortamos?' });

        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('determinista');
        expect(res.body.respuesta).toContain('Recorte de presupuesto');
    });

    test('sin decisiones aún responde con guía (no 500)', async () => {
        const { token } = await createTestUser('ceo_dec5', 'test123', 'ceo');
        const res = await request(app).post('/api/decisiones/consultar')
            .set('Authorization', `Bearer ${token}`)
            .send({ pregunta: '¿Qué decidimos?' });

        expect(res.status).toBe(200);
        expect(res.body.decisionesUsadas).toBe(0);
        expect(res.body.respuesta).toContain('Todavía no hay decisiones');
    });
});
