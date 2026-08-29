/**
 * almacen.js — Capa de persistencia SQLite (modo WAL) para Lumina.
 *
 * Migración "día 1" desde archivos JSON: mantiene EXACTAMENTE la misma API
 * (leerJSON/guardarJSON) para que los ~24 call sites de server.js no cambien.
 *
 * - Base: node:sqlite (integrado, requiere Node >= 22.13; sin dependencias nativas).
 * - WAL: lecturas y escrituras concurrentes sin bloqueos globales.
 * - Escrituras atómicas por sentencia (una fila por "archivo" lógico).
 * - Migración automática: al primer arranque importa data.json/users.json/
 *   activity.json/backup.json y renombra los originales a *.migrado como respaldo.
 *
 * Rollback: los archivos *.migrado contienen el estado previo; restaurar es
 * renombrarlos a su nombre original y borrar lumina.db*.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ARCHIVOS_LOGICOS = ['data.json', 'users.json', 'activity.json', 'backup.json'];

let db = null;

function initDB(dataDir) {
    if (db) return db;
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbFile = path.join(dataDir, 'lumina.db');
    db = new DatabaseSync(dbFile);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA synchronous = NORMAL;');
    db.exec(`
        CREATE TABLE IF NOT EXISTS datos (
            clave TEXT PRIMARY KEY,
            valor TEXT NOT NULL
        )
    `);
    migrarDesdeJSON(dataDir);
    return db;
}

function closeDB() {
    if (db) { try { db.close(); } catch { /* ignore */ } db = null; }
}

function migrarDesdeJSON(dataDir) {
    for (const nombre of ARCHIVOS_LOGICOS) {
        const archivo = path.join(dataDir, nombre);
        const yaExiste = db.prepare('SELECT 1 FROM datos WHERE clave = ?').get(nombre);
        if (yaExiste) continue;
        if (!fs.existsSync(archivo)) continue;
        try {
            const valor = JSON.parse(fs.readFileSync(archivo, 'utf-8'));
            db.prepare('INSERT INTO datos (clave, valor) VALUES (?, ?)')
                .run(nombre, JSON.stringify(valor));
            // Respaldo explícito: el original pasa a *.migrado (no se borra).
            fs.renameSync(archivo, archivo + '.migrado');
            const conteo = Array.isArray(valor) ? valor.length : 1;
            console.log(`[Almacén] Migrado ${nombre} → SQLite (${conteo} registros). Respaldo: ${nombre}.migrado`);
        } catch (e) {
            console.warn(`[Almacén] No se pudo migrar ${nombre}:`, e.message);
        }
    }
}

function claveDe(archivo) {
    return path.basename(String(archivo));
}

function leerJSON(archivo) {
    const clave = claveDe(archivo);
    const fila = db.prepare('SELECT valor FROM datos WHERE clave = ?').get(clave);
    if (!fila) {
        guardarJSON(archivo, []);
        return [];
    }
    try {
        return JSON.parse(fila.valor);
    } catch (e) {
        console.error(`[Almacén] Error parseando ${clave}:`, e.message);
        return [];
    }
}

function guardarJSON(archivo, data) {
    const clave = claveDe(archivo);
    db.prepare(`
        INSERT INTO datos (clave, valor) VALUES (?, ?)
        ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
    `).run(clave, JSON.stringify(data, null, 2));
}

/** Utilidad de soporte: exportar la DB a los JSON originales (rollback manual). */
function exportarJSON(dataDir) {
    for (const nombre of ARCHIVOS_LOGICOS) {
        const fila = db.prepare('SELECT valor FROM datos WHERE clave = ?').get(nombre);
        if (!fila) continue;
        fs.writeFileSync(path.join(dataDir, nombre), fila.valor);
    }
    return ARCHIVOS_LOGICOS;
}

module.exports = { initDB, closeDB, leerJSON, guardarJSON, exportarJSON };
