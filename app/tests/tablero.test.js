/**
 * tests/tablero.test.js — Pizarra de Lumi: tablero de diagramas.
 * Valida generación con IA (JSON), generación directa desde nodos,
 * fallback determinista, sanitización, persistencia y evento SSE.
 */

// Aislar del entorno ambiental: los fallbacks deterministas exigen DEMO_MODE off.
delete process.env.DEMO_MODE;

const request = require('supertest');
const {
    app, resetDbs, createTestUser, getDataDb,
    mockGroqCreate, groqError, serverInternals
} = require('./setup');

function nodo(overrides) {
    return {
        id: `n_${Math.random().toString(36).slice(2, 8)}`,
        userId: 'x', orgId: 'y',
        textoOriginal: 'Nodo tablero', resumen: 'Nodo tablero',
        estado: 'pendiente', prioridad: 'media', x: 10, y: 10,
        fecha: new Date().toISOString(),
        ...overrides
    };
}

describe('✦ Pizarra de Lumi (tablero de diagramas)', () => {
    beforeEach(() => {
        resetDbs();
        mockGroqCreate.mockReset();
    });

    test('generar con nodos concretos → diagrama directo sin IA', async () => {
        const { user, token } = await createTestUser('ceo_tab', 'test123', 'ceo');
        getDataDb().push(
            nodo({ id: 'n1', userId: user.id, orgId: user.orgId, resumen: 'Expandir Latam' }),
            nodo({ id: 'n2', userId: user.id, orgId: user.orgId, resumen: 'Contratar equipo' })
        );
        const res = await request(app).post('/api/pizarra/generar')
            .set('Authorization', `Bearer ${token}`)
            .send({ instruccion: 'Mi plan', nodos: ['n1', 'n2'] });

        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('directo');
        expect(res.body.tablero.titulo).toBe('Mi plan');
        expect(res.body.tablero.elementos).toHaveLength(2);
        expect(res.body.tablero.elementos.map(e => e.texto)).toEqual(
            expect.arrayContaining(['Expandir Latam', 'Contratar equipo'])
        );
        expect(mockGroqCreate).not.toHaveBeenCalled();
    });

    test('generar con instrucción usa la IA y parsea su JSON', async () => {
        const { user, token } = await createTestUser('ceo_tab2', 'test123', 'ceo');
        getDataDb().push(nodo({ id: 'n1', userId: user.id, orgId: user.orgId, resumen: 'Marketing Q3' }));
        mockGroqCreate.mockResolvedValue({
            choices: [{ message: { content: '{"titulo":"Plan Q3","elementos":[{"id":"el1","texto":"Campaña","tipo":"proyecto","color":"rosa","x":30,"y":40,"conectaCon":[]}]}' } }]
        });

        const res = await request(app).post('/api/pizarra/generar')
            .set('Authorization', `Bearer ${token}`)
            .send({ instruccion: 'Mapa del Q3' });

        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('groq');
        expect(res.body.tablero.titulo).toBe('Plan Q3');
        expect(res.body.tablero.elementos[0]).toMatchObject({ texto: 'Campaña', tipo: 'proyecto', x: 30 });
        const messages = mockGroqCreate.mock.calls[0][0].messages;
        expect(messages.find(m => m.role === 'user').content).toMatch(/^<datos>/);
    });

    test('sin IA disponible cae al layout determinista (nunca 500)', async () => {
        const { user, token } = await createTestUser('ceo_tab3', 'test123', 'ceo');
        getDataDb().push(nodo({ id: 'n1', userId: user.id, orgId: user.orgId, resumen: 'Idea A' }));
        mockGroqCreate.mockRejectedValue(groqError(503, 'Service Unavailable'));

        const res = await request(app).post('/api/pizarra/generar')
            .set('Authorization', `Bearer ${token}`)
            .send({ instruccion: 'Lo que sea' });

        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('determinista');
        expect(res.body.tablero.elementos.length).toBeGreaterThanOrEqual(1);
    });

    test('PUT/GET: persistencia por usuario y sanitización de campos', async () => {
        const { user, token } = await createTestUser('ceo_tab4', 'test123', 'ceo');
        const put = await request(app).put('/api/pizarra')
            .set('Authorization', `Bearer ${token}`)
            .send({ tablero: { titulo: 'Tablero', elementos: [{ id: 'a', texto: 'Nota', tipo: 'hack', color: 'javascript:1', x: 999, y: -5 }] } });

        expect(put.status).toBe(200);
        expect(put.body.tablero.elementos[0]).toMatchObject({ tipo: 'nota', color: 'amarillo', x: 95, y: 3 });

        const get = await request(app).get('/api/pizarra').set('Authorization', `Bearer ${token}`);
        expect(get.status).toBe(200);
        expect(get.body.tablero.titulo).toBe('Tablero');
        expect(get.body.tablero.elementos[0].texto).toBe('Nota');
    });

    test('PUT emite evento pizarra-actualizada al canal de la org', async () => {
        const { user, token } = await createTestUser('ceo_tab5', 'test123', 'ceo');
        const cliente = serverInternals._conectarClientePrueba(user.orgId);
        cliente.mensajes.length = 0;

        await request(app).put('/api/pizarra')
            .set('Authorization', `Bearer ${token}`)
            .send({ tablero: { titulo: 'T', elementos: [] } });

        const eventos = cliente.mensajes.map(m => JSON.parse(m.replace(/^data: /, '')));
        expect(eventos.some(e => e.tipo === 'pizarra-actualizada')).toBe(true);
        cliente.desconectar();
    });

    test('exige sesión en GET y PUT', async () => {
        expect((await request(app).get('/api/pizarra')).status).toBe(401);
        expect((await request(app).put('/api/pizarra').send({ tablero: {} })).status).toBe(401);
    });
});
