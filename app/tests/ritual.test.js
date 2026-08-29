/**
 * tests/ritual.test.js — ✦ Ritual de Lumi: ceremonia de apertura.
 * Valida el guion determinista (saludo + nombre + stats), la memoria de
 * decisiones en el guion, el camino con IA (delimitado) y el fallback.
 */

// Aislar del entorno ambiental: los fallbacks deterministas exigen DEMO_MODE off.
delete process.env.DEMO_MODE;

const request = require('supertest');
const { app, resetDbs, createTestUser, getDataDb, mockGroqCreate, groqError } = require('./setup');

function nodo(overrides) {
    return {
        id: `r_${Math.random().toString(36).slice(2, 8)}`,
        userId: 'x', orgId: 'y',
        textoOriginal: 'Misión ritual', resumen: 'Misión ritual',
        estado: 'pendiente', prioridad: 'alta', x: 10, y: 10,
        fecha: new Date().toISOString(),
        ...overrides
    };
}

describe('✦ Ritual de Lumi (ceremonia de apertura)', () => {
    beforeEach(() => {
        resetDbs();
        mockGroqCreate.mockReset();
    });

    test('genera el guion determinista con saludo, nombre y stats reales', async () => {
        const { user, token } = await createTestUser('ceo_ritual', 'test123', 'ceo');
        getDataDb().push(
            nodo({ id: 'r1', userId: user.id, orgId: user.orgId, estado: 'bloqueado' }),
            nodo({ id: 'r2', userId: user.id, orgId: user.orgId, estado: 'pendiente' })
        );

        const res = await request(app).post('/api/ritual').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.frases.length).toBeGreaterThanOrEqual(3);
        expect(res.body.frases[0]).toContain('ceo_ritual');
        expect(res.body.stats).toMatchObject({ activos: 2, bloqueados: 1 });
    });

    test('incluye la memoria de decisiones en el guion', async () => {
        const { token } = await createTestUser('ceo_ritual2', 'test123', 'ceo');
        await request(app).post('/api/decisiones')
            .set('Authorization', `Bearer ${token}`)
            .send({ tema: 'Latam Q3' });

        const res = await request(app).post('/api/ritual').set('Authorization', `Bearer ${token}`);
        expect(res.body.stats.decisiones).toBe(1);
        expect(res.body.frases.some(f => f.includes('1 decisiones'))).toBe(true);
    });

    test('usa la IA cuando está disponible (datos delimitados)', async () => {
        const { token } = await createTestUser('ceo_ritual3', 'test123', 'ceo');
        mockGroqCreate.mockResolvedValue({
            choices: [{ message: { content: 'Las estrellas se alinean.\nTu constelación espera.\nDecide con calma.\nHoy es tu día.' } }]
        });

        const res = await request(app).post('/api/ritual').set('Authorization', `Bearer ${token}`);
        expect(res.body.provider).toBe('groq');
        expect(res.body.frases).toContain('Las estrellas se alinean.');
        const messages = mockGroqCreate.mock.calls[0][0].messages;
        expect(messages.find(m => m.role === 'user').content).toMatch(/^<datos>/);
    });

    test('sin IA mantiene el guion base (nunca 500)', async () => {
        const { token } = await createTestUser('ceo_ritual4', 'test123', 'ceo');
        mockGroqCreate.mockRejectedValue(groqError(503, 'Service Unavailable'));

        const res = await request(app).post('/api/ritual').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('determinista');
        expect(res.body.frases[0]).toContain('ceo_ritual4');
    });

    test('exige sesión', async () => {
        expect((await request(app).post('/api/ritual')).status).toBe(401);
    });
});
