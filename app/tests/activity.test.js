const request = require('supertest');
const { app, resetDbs, generateToken, getActivityDb, mockGroqCreate } = require('./setup');

describe('Historial persistente de actividad', () => {
  const token = generateToken();

  beforeEach(() => {
    resetDbs();
    mockGroqCreate.mockReset().mockResolvedValue({
      choices: [{ message: { content: 'Respuesta segura de Lumina' } }]
    });
  });

  test('guarda el mensaje y la respuesta del chat con fecha y relación', async () => {
    const res = await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: '¿Qué debo priorizar?', historial: [{ role: 'user', content: '¿Qué debo priorizar?' }] });

    expect(res.status).toBe(200);
    const activity = getActivityDb();
    expect(activity).toHaveLength(2);
    expect(activity[0]).toMatchObject({ tipo: 'mensaje_recibido', origen: 'chat', contenido: '¿Qué debo priorizar?' });
    expect(activity[1]).toMatchObject({ tipo: 'respuesta_lumina', relacionadoCon: activity[0].id });
    expect(new Date(activity[0].fecha).toString()).not.toBe('Invalid Date');
  });

  test('no duplica el mensaje actual en el contexto enviado al modelo', async () => {
    await request(app)
      .post('/api/chat-global')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mensaje: 'Mensaje actual',
        historial: [
          { role: 'user', content: 'Anterior' },
          { role: 'assistant', content: 'Respuesta anterior' },
          { role: 'user', content: 'Mensaje actual' }
        ]
      });

    const messages = mockGroqCreate.mock.calls[0][0].messages;
    // El mensaje actual viaja delimitado (<datos>) por la mitigación anti prompt-injection, y una sola vez.
    expect(messages.filter(m => m.content === '<datos>Mensaje actual</datos>')).toHaveLength(1);
    expect(messages.filter(m => m.content === 'Mensaje actual')).toHaveLength(0);
  });

  test('solo devuelve la actividad del usuario autenticado y permite filtros', async () => {
    const otherToken = generateToken({ userId: 'otro-usuario', username: 'otra' });
    await request(app).post('/api/chat-global').set('Authorization', `Bearer ${token}`).send({ mensaje: 'Mío', historial: [] });
    await request(app).post('/api/chat-global').set('Authorization', `Bearer ${otherToken}`).send({ mensaje: 'Ajeno', historial: [] });

    const res = await request(app)
      .get('/api/actividad?tipo=mensaje_recibido')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.actividad[0].contenido).toBe('Mío');
  });
});
