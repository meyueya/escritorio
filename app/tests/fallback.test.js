/**
 * tests/fallback.test.js — Tests del fallback local (Ollama), la clasificación
 * de errores de Groq, la exposición de `provider` y la visibilidad del doble fallo.
 *
 * Cubre:
 * - Groq OK → provider 'groq'.
 * - Groq 401 (API Key inválida) → NO debe enmascararse con el fallback local.
 * - Groq caído (transitorio) + Ollama OK  → responde con el modelo local.
 * - Groq caído + Ollama caído              → devuelve error y registra ambas causas.
 * - Respuesta vacía del modelo → 500 con mensaje claro (P8).
 */

// Aislar del entorno ambiental: los tests de fallback exigen DEMO_MODE desactivado.
delete process.env.DEMO_MODE;

const request = require('supertest');
const { app, resetDbs, generateToken, mockGroqCreate, groqError } = require('./setup');

describe('🦋 Fallback local y clasificación de errores de Groq', () => {
  const token = generateToken();
  const realFetch = global.fetch;
  let fetchMock;

  beforeEach(() => {
    resetDbs();
    mockGroqCreate.mockReset();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  test('usa Groq cuando está disponible y expone provider groq', async () => {
    mockGroqCreate.mockResolvedValue({ choices: [{ message: { content: 'Respuesta de Groq' } }] });

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    expect(res.status).toBe(200);
    expect(res.body.respuesta).toBe('Respuesta de Groq');
    expect(res.body.provider).toBe('groq');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('Groq 401 (API Key inválida) NO usa el fallback local y devuelve error', async () => {
    mockGroqCreate.mockRejectedValue(groqError(401, 'Invalid API Key'));

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('Groq caído (transitorio) + Ollama OK → responde con el modelo local', async () => {
    mockGroqCreate.mockRejectedValue(groqError(503, 'Service Unavailable'));
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { role: 'assistant', content: 'Respuesta local de Ollama' } })
    });

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    expect(res.status).toBe(200);
    expect(res.body.respuesta).toBe('Respuesta local de Ollama');
    expect(res.body.provider).toBe('ollama');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/chat');
    expect(JSON.parse(init.body).model).toBeDefined();
  });

  test('Groq caído + Ollama caído → devuelve error (500) y registra ambas causas', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGroqCreate.mockRejectedValue(groqError(503, 'Service Unavailable'));
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    expect(res.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const logs = errorSpy.mock.calls.map(c => c.join(' '));
    expect(logs.some(m => m.includes('Groq no disponible') && m.includes('503'))).toBe(true);
    expect(logs.some(m => m.includes('Fallback local falló') && m.includes('ECONNREFUSED'))).toBe(true);
    errorSpy.mockRestore();

    // El estado queda expuesto en /api/ia/modelos
    const estadoRes = await request(app).get('/api/ia/modelos').set('Authorization', `Bearer ${token}`);
    expect(estadoRes.status).toBe(200);
    expect(estadoRes.body.estado.ultimoError).toMatchObject({ proveedor: 'ambos' });
    expect(estadoRes.body.estado.groqFallos).toBeGreaterThanOrEqual(1);
  });

  test('respuesta vacía del modelo → 500 con mensaje claro (P8)', async () => {
    mockGroqCreate.mockResolvedValue({ choices: [] });

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/respuesta vacía/i);
  });

  test('elimina bloques <think> del contenido de Groq antes de responder', async () => {
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: '<think>razono internamente...</think>Respuesta útil <think>más razonamiento</think>mundo' } }]
    });

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    expect(res.status).toBe(200);
    expect(res.body.respuesta).toBe('Respuesta útil mundo');
    expect(res.body.provider).toBe('groq');
  });

  test('ignora campos reasoning/thinking del mensaje de Groq', async () => {
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: 'Respuesta limpia', reasoning: 'interno', reasoning_content: 'interno2', thinking: 'interno3' } }]
    });

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    expect(res.status).toBe(200);
    expect(res.body.respuesta).toBe('Respuesta limpia');

    // Los campos de razonamiento se eliminan del mensaje del modelo
    // (results[i].value es una Promise: mockResolvedValue devuelve Promise.resolve(objeto))
    const value = await mockGroqCreate.mock.results[0].value;
    const msg = value.choices[0].message;
    expect(msg.reasoning).toBeUndefined();
    expect(msg.reasoning_content).toBeUndefined();
    expect(msg.thinking).toBeUndefined();
  });

  test('elimina bloques <think> e ignora campos thinking del fallback local', async () => {
    mockGroqCreate.mockRejectedValue(groqError(503, 'Service Unavailable'));
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { role: 'assistant', content: '<think>pienso en local...</think>Respuesta local', thinking: 'razonamiento interno' }
      })
    });

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    expect(res.status).toBe(200);
    expect(res.body.respuesta).toBe('Respuesta local');
    expect(res.body.provider).toBe('ollama');
    expect(JSON.stringify(res.body)).not.toContain('razonamiento interno');
    expect(JSON.stringify(res.body)).not.toContain('pienso');
  });

  test('descarta el resto si un <think> queda sin cerrar', async () => {
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: '<think>razono sin cerrar' } }]
    });

    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Hola', historial: [] });

    // Contenido limpio vacío → extraerTextoIA devuelve error claro (P8)
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/vacía/i);
  });
});
