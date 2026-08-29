/**
 * tests/realtime.test.js — Pizarra viva multi-dispositivo (SSE bus).
 * Valida el bus de eventos sin sockets reales usando el hook de prueba
 * _conectarClientePrueba: los clientes falsos reciben los eventos que
 * emitiría un res SSE conectado al mismo canal de organización.
 */

const request = require('supertest');
const {
    app, resetDbs, createTestUser, getDataDb, serverInternals
} = require('./setup');

function nodo(overrides) {
    return {
        id: `rt_${Math.random().toString(36).slice(2, 8)}`,
        userId: 'x',
        orgId: 'y',
        textoOriginal: 'Nodo tiempo real',
        resumen: 'Nodo tiempo real',
        estado: 'pendiente',
        prioridad: 'media',
        x: 10, y: 10,
        fecha: new Date().toISOString(),
        ...overrides
    };
}

describe('🛰️ Tiempo real (pizarra viva)', () => {
    beforeEach(() => resetDbs());

    test('una escritura emite datos-actualizados al canal de la organización', async () => {
        const { user, token } = await createTestUser('ceo_rt', 'test123', 'ceo');
        getDataDb().push(nodo({ id: 'nodo_rt_1', userId: user.id, orgId: user.orgId }));
        const cliente = serverInternals._conectarClientePrueba(user.orgId);

        const res = await request(app)
            .patch('/api/ideas/nodo_rt_1/estado')
            .set('Authorization', `Bearer ${token}`)
            .send({ estado: 'en_progreso' });

        expect(res.status).toBe(200);
        const eventos = cliente.mensajes
            .map(m => JSON.parse(m.replace(/^data: /, '')))
            .filter(e => e.tipo === 'datos-actualizados');
        expect(eventos).toHaveLength(1);
        expect(eventos[0].usuario).toBe('ceo_rt');
        cliente.desconectar();
    });

    test('aislamiento entre organizaciones: la org B no recibe cambios de la org A', async () => {
        const a = await createTestUser('ceo_a', 'test123', 'ceo');
        const b = await createTestUser('ceo_b', 'test123', 'ceo');
        getDataDb().push(nodo({ id: 'nodo_a', userId: a.user.id, orgId: a.user.orgId }));

        const clienteA = serverInternals._conectarClientePrueba(a.user.orgId);
        const clienteB = serverInternals._conectarClientePrueba(b.user.orgId);

        await request(app)
            .patch('/api/ideas/nodo_a/estado')
            .set('Authorization', `Bearer ${a.token}`)
            .send({ estado: 'completado' });

        const eventosA = clienteA.mensajes.map(m => JSON.parse(m.replace(/^data: /, '')));
        const eventosB = clienteB.mensajes.map(m => JSON.parse(m.replace(/^data: /, '')));
        expect(eventosA.some(e => e.tipo === 'datos-actualizados')).toBe(true);
        expect(eventosB.some(e => e.tipo === 'datos-actualizados')).toBe(false);
        clienteA.desconectar();
        clienteB.desconectar();
    });

    test('presencia: al conectar un segundo dispositivo, el primero recibe el conteo', async () => {
        const { user } = await createTestUser('ceo_pres', 'test123', 'ceo');
        const cliente1 = serverInternals._conectarClientePrueba(user.orgId);
        cliente1.mensajes.length = 0; // descartar el evento de su propia conexión

        serverInternals._conectarClientePrueba(user.orgId);

        const eventos = cliente1.mensajes.map(m => JSON.parse(m.replace(/^data: /, '')));
        const presencia = eventos.find(e => e.tipo === 'presencia');
        expect(presencia).toBeDefined();
        expect(presencia.conectados).toBe(2);
    });

    test('GET /api/stream exige sesión (401 sin cookie/token)', async () => {
        const res = await request(app).get('/api/stream');
        expect(res.status).toBe(401);
    });

    test('escribir en users.json no dispara eventos del mapa (solo data.json)', async () => {
        const { user, token } = await createTestUser('ceo_quiet', 'test123', 'ceo');
        const cliente = serverInternals._conectarClientePrueba(user.orgId);
        cliente.mensajes.length = 0;

        // POST /api/logout no escribe; usamos registro de un segundo usuario para
        // escribir users.json SIN tocar data.json (registro llama guardarJSON(USERS_FILE)).
        await request(app).post('/api/registro').send({ username: 'otro_usuario_rt', password: 'clave-larga-123' });

        const eventos = cliente.mensajes.map(m => JSON.parse(m.replace(/^data: /, '')));
        expect(eventos.some(e => e.tipo === 'datos-actualizados')).toBe(false);
        cliente.desconectar();
    });
});
