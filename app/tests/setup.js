/**
 * tests/setup.js — Configuración del entorno de test para Lumina.
 *
 * Problema: server.js no exporta `app` → no podemos importarlo directamente.
 * Solución: Mockeamos Express para interceptar la instancia de `app` creada
 * por server.js, y la exponemos para que supertest pueda usarla.
 *
 * También mockeamos: Groq SDK, dotenv, multer, y el sistema de archivos
 * para aislar completamente los tests del disco y de APIs externas.
 */

const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'lumina-test-secret-2026-change-only-in-tests';
const JWT_SECRET = process.env.JWT_SECRET;

// Aseguramos que el cliente Groq se construya en tests (clave ficticia).
// Sin esto, server.js entraría en "modo solo-local" y los tests que verifican
// llamadas a Groq (mockGroqCreate) fallarían.
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test-groq-key';

// Determinismo: el fallback local debe estar habilitado en tests
// independientemente del entorno ambiental del shell que lance Jest.
process.env.LOCAL_FALLBACK_ENABLED = 'true';

// ===== ESTADO EN MEMORIA (reemplaza data.json / users.json / backup.json) =====
let mockDataDb = [];
let mockUsersDb = [];
let mockBackupDb = [];
let mockActivityDb = [];

// ===== MOCK: capa de almacenamiento SQLite (almacen.js) =====
// Los tests operan 100% en memoria: initDB no toca disco y leer/guardar
// redirigen a los arrays mock. server.js consume la misma API que antes.
jest.mock('../almacen', () => ({
    initDB: () => {},
    closeDB: () => {},
    exportarJSON: () => [],
    leerJSON: (archivo) => {
        const nombre = String(archivo).split('/').pop();
        if (nombre === 'data.json') return mockDataDb;
        if (nombre === 'users.json') return mockUsersDb;
        if (nombre === 'backup.json') return mockBackupDb;
        if (nombre === 'activity.json') return mockActivityDb;
        return [];
    },
    guardarJSON: (archivo, data) => {
        const nombre = String(archivo).split('/').pop();
        if (nombre === 'data.json') mockDataDb = data;
        else if (nombre === 'users.json') mockUsersDb = data;
        else if (nombre === 'backup.json') mockBackupDb = data;
        else if (nombre === 'activity.json') mockActivityDb = data;
    }
}));

// ===== MOCK: fs =====
// Interceptamos read/write de los JSON files para que operen en memoria.
const actualFs = require('fs');
const originalExistsSync = actualFs.existsSync;
const originalReadFileSync = actualFs.readFileSync;
const originalWriteFileSync = actualFs.writeFileSync;
const originalRenameSync = actualFs.renameSync;

const JSON_FILES = ['data.json', 'users.json', 'backup.json', 'activity.json'];
const isJsonFile = (p) => JSON_FILES.some(f => p.endsWith(f) || p.endsWith(f + '.tmp'));

actualFs.existsSync = function(filePath) {
  if (isJsonFile(filePath)) return true;
  return originalExistsSync.call(this, filePath);
};

actualFs.readFileSync = function(filePath, encoding) {
  const name = path.basename(filePath);
  if (name === 'data.json') return JSON.stringify(mockDataDb);
  if (name === 'users.json') return JSON.stringify(mockUsersDb);
  if (name === 'backup.json') return JSON.stringify(mockBackupDb);
  if (name === 'activity.json') return JSON.stringify(mockActivityDb);
  return originalReadFileSync.call(this, filePath, encoding);
};

actualFs.writeFileSync = function(filePath, data) {
  const name = path.basename(filePath);
  if (name === 'data.json' || name === 'data.json.tmp') { mockDataDb = JSON.parse(data); return; }
  if (name === 'users.json' || name === 'users.json.tmp') { mockUsersDb = JSON.parse(data); return; }
  if (name === 'backup.json' || name === 'backup.json.tmp') { mockBackupDb = JSON.parse(data); return; }
  if (name === 'activity.json' || name === 'activity.json.tmp') { mockActivityDb = JSON.parse(data); return; }
  return originalWriteFileSync.call(this, filePath, data);
};

actualFs.renameSync = function(oldPath, newPath) {
  if (isJsonFile(oldPath) || isJsonFile(newPath)) return; // Noop: dato ya en memoria
  return originalRenameSync.call(this, oldPath, newPath);
};

// ===== MOCK: Groq SDK =====
const mockGroqCreate = jest.fn().mockResolvedValue({
  choices: [{ message: { content: 'Resumen IA Mockeado' } }]
});
const mockGroqTranscribe = jest.fn().mockResolvedValue({
  text: 'Transcripción IA Mockeada'
});

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockGroqCreate
      }
    },
    audio: {
      transcriptions: {
        create: mockGroqTranscribe
      }
    }
  }));
});

// ===== MOCK: dotenv =====
jest.mock('dotenv', () => ({ config: jest.fn() }));

// ===== MOCK: multer =====
// Permite a los tests inyectar un req.file (respaldo de un archivo real) para
// probar rutas de upload como /api/voz sin depender del multipart real.
let mockUploadFile = null;
const setMockUploadFile = (file) => { mockUploadFile = file; };

jest.mock('multer', () => {
  const m = jest.fn(() => ({
    single: () => (req, res, next) => {
      if (mockUploadFile) req.file = mockUploadFile;
      next();
    }
  }));
  m.diskStorage = jest.fn();
  return m;
});

// ===== CAPTURAR app de Express =====
// Interceptamos http.Server.prototype.listen para:
// 1. Evitar que el servidor arranque de verdad
// 2. Capturar la instancia del servidor (y por ende la app)
const http = require('http');
let capturedApp = null;
const originalListen = http.Server.prototype.listen;
http.Server.prototype.listen = function(..._args) {
  // `this` es el http.Server. Express lo crea internamente
  // con http.createServer(app). Podemos obtener la app
  // porque Express hace: var server = http.createServer(this);
  // donde `this` ES la app function. 
  // En Express, server.listeners === the app itself.
  // Actually, this._events.request ES la app function.
  capturedApp = this._events?.request || this;
  return this; // No arrancar el servidor
};

// ===== CARGAR server.js (los mocks ya están configurados) =====
const serverInternals = require(path.join(__dirname, '..', 'server.js'));

// Restaurar listen para no afectar otras operaciones
http.Server.prototype.listen = originalListen;

// ===== EXPORTAR HERRAMIENTAS DE TEST =====
module.exports = {
  /** Instancia Express app capturada de server.js */
  app: capturedApp,

  /** Mock de Groq para verificar llamadas */
  mockGroqCreate,

  /** Mock de la transcripción de Groq (audio.transcriptions.create) */
  mockGroqTranscribe,

  /** Inyecta un req.file falso (respaldado por un archivo real) en rutas de upload */
  setMockUploadFile,

  /** Internals de server.js para tests (p. ej. resetear el circuit breaker) */
  serverInternals,

  /** Crea un error con forma de Groq APIError (con status) para tests de fallback */
  groqError: (status, message = 'Groq error') => {
    const err = new Error(`${status ? `${status} ` : ''}${message}`.trim());
    if (status) err.status = status;
    const names = { 401: 'AuthenticationError', 429: 'RateLimitError', 400: 'BadRequestError', 404: 'NotFoundError', 409: 'ConflictError', 422: 'UnprocessableEntityError' };
    err.name = names[status] || 'APIError';
    return err;
  },

  /** Acceso a las bases de datos en memoria */
  getDataDb: () => mockDataDb,
  getUsersDb: () => mockUsersDb,
  getActivityDb: () => mockActivityDb,

  /** Resetear toda la memoria entre tests */
  resetDbs: () => {
    mockDataDb = [];
    mockUsersDb = [];
    mockBackupDb = [];
    mockActivityDb = [];
    mockUploadFile = null;
  },

  /** Generar un JWT válido de test */
  generateToken: (overrides = {}) => {
    return jwt.sign({
      userId: 'test-user-id',
      username: 'testCEO',
      role: 'ceo',
      orgId: 'org_testCEO',
      ...overrides
    }, JWT_SECRET, { expiresIn: '1h' });
  },

  /** Crear un usuario completo en la DB mock y devolver su token */
  createTestUser: async (username = 'testCEO', password = 'test123', role = 'ceo') => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: `usr_${Date.now()}`,
      username,
      password: hashedPassword,
      role,
      orgId: `org_${username}`
    };
    mockUsersDb.push(user);
    return {
      user,
      token: jwt.sign(
        { userId: user.id, username, role, orgId: user.orgId },
        JWT_SECRET,
        { expiresIn: '1h' }
      )
    };
  }
};
