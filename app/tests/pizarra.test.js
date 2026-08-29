/**
 * tests/pizarra.test.js — Pizarra interactiva: notas adhesivas ("cuadros").
 * Valida el endpoint POST /api/nodo-manual y su integración con el bus SSE.
 */

const request = require('supertest');
const { app, resetDbs, createTestUser, serverInternals } = require('./setup');

describe('🗒️ Pizarra interactiva (notas)', () => {
    beforeEach(() => resetDbs());

    test('crea una nota con doble clic (posición y texto) y emite evento SSE', async () => {
        const { user, token } = await createTestUser('ceo_piz', 'test123', 'ceo');
        const cliente = serverInternals._conectarClientePrueba(user.orgId);

        const res = await request(app)
            .post('/api/nodo-manual')
            .set('Authorization', `Bearer ${token}`)
            .send({ x: 320, y: 480, texto: 'Recordar Q3', color: 'amarillo' });

        expect(res.status).toBe(201);
        expect(res.body.nodo.tipo).toBe('nota');
        expect(res.body.nodo.textoOriginal).toBe('Recordar Q3');
        expect(res.body.nodo.x).toBe(320);

        const eventos = cliente.mensajes
            .map(m => JSON.parse(m.replace(/^data: /, '')))
            .filter(e => e.tipo === 'datos-actualizados');
        expect(eventos).toHaveLength(1);
        cliente.desconectar();
    });

    test('rechaza notas vacías o con posición inválida', async () => {
        const { token } = await createTestUser('ceo_piz2', 'test123', 'ceo');

        const vacia = await request(app).post('/api/nodo-manual')
            .set('Authorization', `Bearer ${token}`).send({ x: 10, y: 10, texto: '   ' });
        expect(vacia.status).toBe(400);

        const mala = await request(app).post('/api/nodo-manual')
            .set('Authorization', `Bearer ${token}`).send({ x: 'abc', y: 10, texto: 'Hola' });
        expect(mala.status).toBe(400);
    });

    test('limita el color a la allowlist', async () => {
        const { token } = await createTestUser('ceo_piz3', 'test123', 'ceo');
        const res = await request(app).post('/api/nodo-manual')
            .set('Authorization', `Bearer ${token}`)
            .send({ x: 1, y: 2, texto: 'Color raro', color: 'javascript:alert(1)' });
        expect(res.status).toBe(201);
        expect(res.body.nodo.color).toBe('amarillo');
    });

    test('exige sesión', async () => {
        const res = await request(app).post('/api/nodo-manual').send({ x: 1, y: 2, texto: 'Sin sesión' });
        expect(res.status).toBe(401);
    });

    test('las notas no contaminan el panorama del briefing (no son misiones)', async () => {
        const { user, token } = await createTestUser('ceo_piz4', 'test123', 'ceo');
        await request(app).post('/api/nodo-manual')
            .set('Authorization', `Bearer ${token}`)
            .send({ x: 1, y: 2, texto: 'Nota suelta' });

        const res = await request(app).post('/api/briefing').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.panorama.activos).toBe(0);
    });
});
