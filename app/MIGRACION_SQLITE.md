# 🗄️ MIGRACION_SQLITE.md — Cimiento 2: de JSON a SQLite (WAL)

**Rama:** `foundations/sqlite` · **Requisito:** Node >= 22.13 (usa `node:sqlite`, cero dependencias nuevas)

## Qué cambió

- Nueva capa [`almacen.js`](almacen.js) con **la misma API** (`leerJSON`/`guardarJSON`) que antes: los ~24 call sites de `server.js` no cambiaron su lógica.
- `server.js` reemplaza las funciones JSON por `require('./almacen')` + `initDB(RUNTIME_DATA_DIR)`.
- Un archivo lógico (data/users/activity/backup) = una fila `clave/valor` en `lumina.db`.
- `PRAGMA journal_mode=WAL` + escrituras atómicas por sentencia → sin corrupción por crash y lecturas concurrentes sin bloqueo.
- El mutex `conLock` (parche P1) se mantiene como defensa adicional para los bloques leer→IA→escribir.

## Migración automática (ya ejecutada en tu máquina)

Al primer arranque, `initDB` importó los JSON existentes y los renombró como respaldo:

| Archivo original | Registros migrados | Respaldo |
|---|---|---|
| data.json | 61 | `data.json.migrado` |
| users.json | 13 | `users.json.migrado` |
| activity.json | 43 | `activity.json.migrado` |
| backup.json | 24 | `backup.json.migrado` |

## Rollback (si hiciera falta)

```bash
# 1. Detén el servidor.
# 2. Exporta la DB a JSON y borra la DB, o simplemente restaura los respaldos:
mv data.json.migrado data.json
mv users.json.migrado users.json
mv activity.json.migrado activity.json
mv backup.json.migrado backup.json
rm -f lumina.db lumina.db-wal lumina.db-shm
# 3. Vuelve al commit anterior (git checkout audit/foundations -- server.js) y arranca.
```

También existe `exportarJSON(dataDir)` en `almacen.js` para volcar la DB a JSON por script.

## Cambios asociados

- `package.json`: `engines.node >= 22.13.0` (requisito de `node:sqlite`).
- `ci.yml`: matriz de tests `[22, 24]` (18/20 ya no soportan la capa de datos).
- `.gitignore`: `*.db`, `*.db-wal`, `*.db-shm`, `*.migrado`.
- `tests/setup.js`: mock en memoria de `almacen.js` (los tests siguen herméticos).
- `tests/almacen.test.js`: 4 tests del módulo real (roundtrip, migración, respaldo, idempotencia).

## Validación

- Suite completa: **85/85 tests** (81 existentes + 4 nuevos) en el working tree.
- Smoke test de arranque: migración correcta y `GET /` → 200.
- ⚠️ Si había un servidor Lumina corriendo con el código viejo, **reinícialo**: escribe en JSON y sus escrituras posteriores no se reflejarán en SQLite (`kill <pid>` y `npm start`).

## Siguiente paso en la hoja de ruta

✅ **Completado (rama `feature/realtime`)**: capa de tiempo real SSE (`GET /api/stream`) — cada escritura en `data.json` emite `datos-actualizados` al canal de la organización y los clientes re-sincronizan; incluye presencia (nº de dispositivos conectados).

⏭️ **Pendiente**: **Bucle Estratégico Autónomo** (✅ v1 completado en `feature/bucle-autonomo`: briefing IA + vigilancia) y **Meeting→Action** sobre Google Calendar.
