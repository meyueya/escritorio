/**
 * tests/briefing.test.js — Bucle Estratégico Autónomo v1.
 * Cubre: panorama operativo, briefing con IA (delimitado <datos>),
 * fallback determinista sin IA, y vigilancia autónoma por organización.
 */

// Aislar del entorno ambiental: estos tests no dependen del modo demo.
delete process.env.DEMO_MODE;

const request = require('supertest');
const {
    app, resetDbs, generateToken, createTestUser,
    mockGroqCreate, groqError, getDataDb, getActivityDb, serverInternals
} = require('./setup');

function nodo(overrides) {
    return {
        id: `nodo_${Math.random().toString(36).slice(2, 8)}`,
        userId: 'usr_ceo',
        orgId: 'org_ceo',
        textoOriginal: 'Iniciativa de prueba',
        resumen: 'Iniciativa de prueba',
        estado: 'pendiente',
        prioridad: 'media',
        x: 10, y: 10,
        fecha: new Date().toISOString(),
        ...overrides
    };
}

const ayer = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const manana = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

describe('🦋 Bucle Estratégico Autónomo v1', () => {
    beforeEach(() => {
        resetDbs();
        mockGroqCreate.mockReset().mockResolvedValue({ choices: [{ message: { content: 'Briefing de prueba: atiende los bloqueos primero.' } }] });
    });

    test('POST /api/briefing genera briefing con IA y datos delimitados', async () => {
        const { user, token } = await createTestUser('ceo_briefing', 'test123', 'ceo');
        getDataDb().push(
            nodo({ userId: user.id, orgId: user.orgId, estado: 'bloqueado', prioridad: 'alta' }),
            nodo({ userId: user.id, orgId: user.orgId, dueDate: ayer() }),
            nodo({ userId: user.id, orgId: user.orgId, dueDate: manana() })
        );

        const res = await request(app).post('/api/briefing').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.briefing).toContain('Briefing de prueba');
        expect(res.body.provider).toBe('groq');
        expect(res.body.panorama).toMatchObject({ activos: 3, vencidos: 1, bloqueados: 1, proximos7: 1 });

        const messages = mockGroqCreate.mock.calls[0][0].messages;
        const userMsg = messages.find(m => m.role === 'user').content;
        expect(userMsg).toMatch(/^<datos>/);
        expect(userMsg).toContain('Vencidos: 1');
    });

    test('sin IA disponible responde briefing determinista (nunca 500)', async () => {
        const { user, token } = await createTestUser('ceo_off', 'test123', 'ceo');
        getDataDb().push(nodo({ userId: user.id, orgId: user.orgId, estado: 'bloqueado' }));
        mockGroqCreate.mockRejectedValue(groqError(503, 'Service Unavailable'));

        const res = await request(app).post('/api/briefing').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('determinista');
        expect(res.body.briefing).toContain('1 bloqueadas');
    });

    test('la vigilancia detecta misiones que requieren decisión y registra actividad', async () => {
        const { user } = await createTestUser('ceo_vig', 'test123', 'ceo');
        getDataDb().push(
            nodo({ userId: user.id, orgId: user.orgId, estado: 'bloqueado' }),
            nodo({ userId: user.id, orgId: user.orgId, dueDate: ayer() })
        );

        serverInternals.ejecutarVigilancia();

        const activity = getActivityDb();
        const alerta = activity.find(a => a.origen === 'vigilancia' && a.userId === user.id);
        expect(alerta).toBeDefined();
        expect(alerta.contenido).toContain('1 vencida');
        expect(alerta.contenido).toContain('1 bloqueada');
    });

    test('la vigilancia no molesta cuando no hay vencidos ni bloqueados', async () => {
        const { user } = await createTestUser('ceo_calm', 'test123', 'ceo');
        getDataDb().push(nodo({ userId: user.id, orgId: user.orgId, estado: 'en_progreso', dueDate: manana() }));

        serverInternals.ejecutarVigilancia();

        const alerta = getActivityDb().find(a => a.origen === 'vigilancia');
        expect(alerta).toBeUndefined();
    });

    test('el briefing solo considera nodos visibles de la organización (sin IDOR)', async () => {
        const { user, token } = await createTestUser('ceo_priv', 'test123', 'ceo');
        getDataDb().push(
            nodo({ userId: user.id, orgId: user.orgId, estado: 'bloqueado' }),
            nodo({ userId: 'otro_usuario', orgId: 'org_ajena', estado: 'bloqueado', resumen: 'Secreto ajeno' })
        );

        const res = await request(app).post('/api/briefing').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.panorama.bloqueados).toBe(1);
        const userMsg = mockGroqCreate.mock.calls[0][0].messages.find(m => m.role === 'user').content;
        expect(userMsg).not.toContain('Secreto ajeno');
    });
});
