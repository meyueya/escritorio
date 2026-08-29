/**
 * tests/almacen.test.js — Tests de la capa SQLite (WAL) real (sin mocks).
 * Nota: NO importa setup.js a propósito: aquí se prueba el módulo real.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { initDB, closeDB, leerJSON, guardarJSON } = require('../almacen');

describe('Almacén SQLite (WAL)', () => {
    let dir;

    beforeEach(() => {
        closeDB();
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumina-db-'));
    });

    afterEach(() => {
        closeDB();
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    test('roundtrip guardarJSON/leerJSON y crea lumina.db', () => {
        initDB(dir);
        guardarJSON(path.join(dir, 'data.json'), [{ id: 1, texto: 'hola' }]);
        expect(leerJSON(path.join(dir, 'data.json'))).toEqual([{ id: 1, texto: 'hola' }]);
        expect(fs.existsSync(path.join(dir, 'lumina.db'))).toBe(true);
    });

    test('migra los JSON existentes al primer arranque y respalda con .migrado', () => {
        fs.writeFileSync(path.join(dir, 'users.json'), JSON.stringify([{ username: 'pedro' }]));
        initDB(dir);
        expect(leerJSON(path.join(dir, 'users.json'))).toEqual([{ username: 'pedro' }]);
        expect(fs.existsSync(path.join(dir, 'users.json.migrado'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'users.json'))).toBe(false);
    });

    test('clave inexistente devuelve [] sin romper', () => {
        initDB(dir);
        expect(leerJSON(path.join(dir, 'backup.json'))).toEqual([]);
    });

    test('la migración no pisa datos posteriores al reabrir la DB', () => {
        fs.writeFileSync(path.join(dir, 'data.json'), JSON.stringify([{ id: 'a' }]));
        initDB(dir);
        guardarJSON(path.join(dir, 'data.json'), [{ id: 'b' }]);
        closeDB();
        initDB(dir);
        expect(leerJSON(path.join(dir, 'data.json'))).toEqual([{ id: 'b' }]);
    });
});
