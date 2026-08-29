module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary'],
  // Suelo anti-regresión: fija la cobertura actual para que nunca baje.
  // Hoja de ruta: subir progresivamente hasta { lines: 70, statements: 70,
  // branches: 60, functions: 65 } conforme crezcan los tests de seguridad.
  coverageThreshold: {
    global: {
      statements: 38,
      branches: 29,
      functions: 32,
      lines: 41
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    'main.js',
    'style.css',
    'index.html'
  ]
};
