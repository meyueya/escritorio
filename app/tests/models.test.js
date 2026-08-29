// Aislar del entorno ambiental: este test exige DEMO_MODE desactivado.
delete process.env.DEMO_MODE;

const request = require('supertest');
const { app, resetDbs, generateToken, mockGroqCreate } = require('./setup');

describe('Enrutamiento especializado de modelos', () => {
  const token = generateToken();

  beforeEach(() => {
    resetDbs();
    mockGroqCreate.mockReset().mockResolvedValue({ choices: [{ message: { content: 'Respuesta' } }] });
  });

  test('expone la configuración sin revelar credenciales', async () => {
    const res = await request(app).get('/api/ia/modelos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.models.clasificacion).toBe('openai/gpt-oss-20b');
    expect(res.body.models.conversacion).toBe('qwen/qwen3.6-27b');
    expect(JSON.stringify(res.body)).not.toMatch(/api.?key/i);
  });

  test('usa Qwen para conversación', async () => {
    await request(app).post('/api/chat-global').set('Authorization', `Bearer ${token}`).send({ mensaje: 'Hola', historial: [] });
    expect(mockGroqCreate.mock.calls[0][0].model).toBe('qwen/qwen3.6-27b');
  });

  test('usa GPT-OSS 20B para clasificación', async () => {
    mockGroqCreate.mockResolvedValueOnce({ choices: [{ message: { content: '{"intent":"PREGUNTA"}' } }] });
    await request(app).post('/api/clasificar').set('Authorization', `Bearer ${token}`).send({ texto: '¿Cómo funciona?' });
    expect(mockGroqCreate.mock.calls[0][0].model).toBe('openai/gpt-oss-20b');
  });

  test('el modo demo está desactivado sin DEMO_MODE y lo reporta', async () => {
    const login = await request(app).post('/api/demo/login');
    expect(login.status).toBe(404);

    const res = await request(app).get('/api/ia/modelos').set('Authorization', `Bearer ${token}`);
    expect(res.body.demo.activo).toBe(false);
  });
});
