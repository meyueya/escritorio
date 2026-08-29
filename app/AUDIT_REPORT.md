# 🛡️ AUDIT_REPORT — Lumina (SAST + OWASP Top 10)

**Proyecto:** `/Users/meyueya/Escritorio/app` (repo público: `github.com/meyueya/escritorio`, rama `main`)
**Stack:** Node.js 22 / Express 5 (CommonJS) · persistencia en JSON · IA Groq/Ollama · SendGrid/Slack/Google/ElevenLabs
**Alcance:** proyecto completo (backend, frontend, configs, CI/CD, tests, datos) — excluidos `node_modules/` y `tmp/`
**Estándar:** OWASP Top 10 (2021) + OWASP LLM Top 10 · Fecha: 2026 (auditoría sobre working tree en commit `5a5126f` + cambios no commiteados)
**Método:** lectura integral de 13.363 LOC + grep de patrones + verificación manual de cada hallazgo + `npm audit` + suite Jest

---

## 1. Resumen ejecutivo

| Métrica | Valor |
|---|---|
| **Hallazgos totales** | **44** (0 P0 · 8 P1 · 16 P2 · 20 P3) |
| Explotables remotamente con pérdida de datos masiva o RCE | **0** |
| Vulnerabilidades de dependencias (`npm audit`) | **0** (info=0 low=0 moderate=0 high=0 critical=0) |
| Cobertura de tests | Baseline 38.05% stmts / 40.95% lines · **parcheado: 38.17% / 41.08%** |
| Suite Jest | Baseline **79/81** (2 fallos por acoplamiento al entorno) → **con parches aplicados: 81/81 ✅ (regresión cero)** |
| Tiempo estimado de reparación | **~5 días-hombre** (P1: <1 día incl. aplicar parche; P2 restantes: 1–2 días; P3 deuda: 2–3 días) |

**Conclusión ejecutiva:** el backend tiene una higiene de seguridad **notablemente superior a la media** (CORS por allowlist, cookie HttpOnly/SameSite/Secure, bcrypt, CSP, autorización por organización, sin secretos hardcodeados válidos, sin RCE). No hay P0. El riesgo real se concentra en **8 P1** (5 de backend + 3 de infraestructura) y en una **deuda técnica estructural** (cobertura del 38%, ~700 líneas de código muerto en frontend, I/O síncrono). El parche `fixes-P1.diff` elimina la totalidad de los P1 detectados.

> ✅ **Estado de aplicación (actualizado):** los cimientos fueron aprobados por el usuario y aplicados en la rama **`audit/foundations`** (commit `f6114da`, empujada a origin; suite re-validada en el working tree real: **81/81 ✅**). `main` permanece intacto. PR sugerido por GitHub: https://github.com/meyueya/escritorio/pull/new/audit/foundations — el merge a `main` requiere tu revisión explícita. Los ítems «Recomendación» siguen pendientes de decisión.

---

## 2. Tabla de riesgos

Estado: **Corregido** = aplicado en rama `audit/foundations` (commit `f6114da`), pendiente de merge a `main` · **Recomendación** = incluido en informe, requiere decisión de diseño.

| # | Sev | Archivo | Línea(s) | Hallazgo (OWASP) | Estado | Parche |
|---|---|---|---|---|---|---|
| 1 | **P1** | server.js | 222, 953 | IDOR entre organizaciones vía filtro `area` (A01) | Corregido | P1 |
| 2 | **P1** | server.js | 2895, 2909-2945, 3101, 3113-3163 | Callbacks OAuth sin sesión + `state` predecible = secuestro de integración (A01/A07) | Corregido | P1 |
| 3 | **P1** | server.js | 1646-1662, 2150-2175, 1254-1258 | Prompt injection: input de usuario sin delimitar en prompts con contexto cross-usuario (LLM01) | Corregido | P1 |
| 4 | **P1** | server.js | 1129/1165, 1233/1275, 1291/1335, 1391/1440, 1807/1906 | Race condition lost-update en 5 rutas IA (pérdida de datos) | Corregido | P1 |
| 5 | **P1** | server.js | 848, 857, 903, 1190, 1247, 1306, 1403, 1709, 1765, 2059, 2188, 2930, 3149, 3185, 3226, 3272 | Datos sensibles del usuario en logs (transcripciones de voz, emails, contenido) (A09) | Corregido | P1 |
| 6 | **P1** | Dockerfile | 9, 21 | Imagen base `node:22-alpine` sin digest (A06 supply-chain) | Corregido | P1 |
| 7 | **P1** | .github/workflows/*.yml | — | GitHub Actions fijadas por tag mutable (`@v4`) (A06) | Corregido | P1 |
| 8 | **P1** | ci.yml | 113-119, 167-172 | Job `security` no-op: `continue-on-error` + gate que no evalúa `needs.security.result` | Corregido | P1 |
| 9 | P2 | server.js | 851-853 | Extensión de upload derivada de `originalname` (DoS/antipatrón; recalibrado desde P1, ver §7) | Corregido | P2P3 |
| 10 | P2 | server.js | 109-112, 3414 | MIME validado solo por cabecera del cliente (spoofeable); falta magic-bytes (A04) | Recomendación | — |
| 11 | P2 | server.js | 3244-3263 | Email a destinatario arbitrario con clave SendGrid + HTML sin escapar (A03) | Corregido | P2P3 |
| 12 | P2 | server.js | 2487, 3372, 3238, 1619, 2121, 1757 | Sin rate-limit en endpoints de coste externo (IA/TTS/SendGrid) (A04) | Corregido | P2P3 |
| 13 | P2 | server.js | 130, 485, 248 | Secreto JWT de test + credencial demo fijas; `DEMO_MODE` activable en producción (A02/A07) | Corregido | P2P3 |
| 14 | P2 | server.js | 2920-2928, 3139-3147, 1011 | Tokens OAuth en claro en `users.json` + `ultimoError` interno expuesto en `/api/ia/modelos` (A02/A09) | Recomendación | — |
| 15 | P2 | server.js | (final del archivo) | Sin error-handler global → stack traces de Express en entornos no-prod (A05/A09) | Corregido | P2P3 |
| 16 | P2 | tests/models.test.js, tests/fallback.test.js | 1-3 | Tests acoplados al entorno ambiental (`DEMO_MODE` heredado) — suite no determinista | Corregido | P2P3 |
| 17 | P2 | ci.yml | 46, 76, 111, 141 | `npm ci` sin `--ignore-scripts` en PRs (postinstall de terceros) (A06) | Recomendación | — |
| 18 | P2 | jest.config.js | 6 | `forceExit` enmascara fugas de handles | Recomendación | — |
| 19 | P2 | tests/security.test.js | — | Sin tests de rate-limit, HSTS ni IDOR multi-organización | Recomendación | — |
| 20 | P2 | cd.yml | 131-135, 164-168 | Health-check/deploy `echo`-only: CD declara éxito sin desplegar | Recomendación | — |
| 21 | P2 | .gitignore | 3 | `package-lock.json` ignorado pero trackeado (contradicción que rompe `npm ci`) | Recomendación | — |
| 22 | P2 | .dockerignore | — | `backup.json`/`activity.json` (datos reales) entran al build context | Corregido | P2P3 |
| 23 | P2 | .env, users.json, data.json, activity.json, backup.json | — | Permisos `644` world-readable con secretos/hashes bcrypt/PII (hardening local) | Recomendación | — |
| 24 | P2 | refs/codex/turn-diffs/… | — | `activity.json` con mensajes personales alcanzable desde checkpoints locales de Codex CLI (no en origin; limpiar) | Recomendación | — |
| 25-44 | P3 | varios | ver §5 | Deuda técnica: I/O síncrono, JWT alg sin pin, sin HSTS, limiter sin purga, token duplicado en body, validación x/y/color, redirect_uri localhost, funciones de 400 líneas, ~700 LOC código muerto, `authToken` vestigial, doble submit, loop 50 ms, CDN sin SRI, eslint sin plugin de seguridad, higiene de workspace | Parcialmente parcheados (HSTS, alg pin, purga, SRI, limiter, codeql push → P2P3) | P2P3 |

---

## 3. Diagnóstico pedagógico (Regla de Oro) — Hallazgos P1

### 3.1 📍 Ubicación: `server.js:222` y `server.js:953`
- ❌ **Problema:** IDOR entre organizaciones (A01:2021). En `nodosVisiblesPara()` y en `GET /api/ideas`, el filtro de visibilidad por área para roles no-CEO (`cfo/coo/cmo`) es `idea.area && myAreas.includes(idea.area.toLowerCase())` **sin exigir `idea.orgId === req.orgId`**. Los nodos de otra organización cuyo `area` coincida con el área del rol del atacante quedan expuestos.
- 💥 **Impacto:** fuga de información estratégica entre tenants: un CFO de la empresa A lee las iniciativas de `finanzas` de la empresa B. Ruptura del modelo multi-tenant sobre `data.json`.
- 🧠 **Estrategia:** *deny by default* (fail-closed): toda regla de visibilidad debe primero verificar pertenencia al tenant y luego aplicar el filtro de negocio. Es el patrón de la OWASP Authorization Cheat Sheet: "verifica identidad **y** tenant en cada consulta".
- 🔧 **Parche:** `fixes-P1.diff` — añade `idea.orgId === req.orgId &&` a ambas reglas de área.

### 3.2 📍 Ubicación: `server.js:2909-2945` (Google) y `3113-3163` (Slack)
- ❌ **Problema:** los callbacks OAuth **no tienen `requireAuth`** y usan `state` como `userId` plano (`state: req.userId` en el connect; `const { code, state: userId } = req.query` en el callback). Un atacante que conozca un `userId` ajeno puede completar su propio flujo OAuth pasando `state=<víctima>` y sobrescribir la integración de la víctima (account-linking / login CSRF, A01/A07).
- 💥 **Impacto:** secuestro de integraciones de Google Calendar/Slack: las reuniones de la víctima acaban en la cuenta del atacante (exfiltración/poisoning). Los `userId` son descubribles (JWT propio, `/api/equipo`, actividad).
- 🧠 **Estrategia:** `state` debe ser un **nonce impredecible** ligado a la sesión autenticada, validado en el callback contra `req.userId` (OWASP OAuth 2.0 Cheat Sheet: "bind state to the user's session"). La cookie de sesión `SameSite=Lax` sí viaja en la redirección top-level, por lo que `requireAuth` es compatible con el flujo de ventana emergente.
- 🔧 **Parche:** `fixes-P1.diff` — introduce `nuevoOAuthState()`/`consumirOAuthState()` (nonce `crypto.randomBytes(24)`, TTL 10 min), añade `requireAuth` a ambos callbacks y valida el nonce contra la sesión.

### 3.3 📍 Ubicación: `server.js:1646-1662` (chat-global), `2150-2175` (lumi-responde), `1254-1258` (smart-edit)
- ❌ **Problema:** Prompt injection (LLM01). El contenido del usuario se concatena **sin delimitar** dentro de los mensajes al modelo; en `chat-global` el system prompt incluye la constelación completa de la organización (contexto cross-usuario). Un miembro malicioso puede ordenar al modelo que revele contenido de otros miembros (extracción indirecta de datos vía prompt).
- 💥 **Impacto:** exfiltración indirecta de información confidencial entre miembros de una misma org, y manipulación del comportamiento del asistente (el input se interpreta como instrucción).
- 🧠 **Estrategia:** *input delimiting* (OWASP LLM Top 10, LLM01): encerrar todo dato no fiable entre marcadores `<datos>…</datos>` y advertir explícitamente en el system prompt que ese bloque **nunca** debe tratarse como instrucción. El output encoding ya está cubierto en el frontend (`escapeHtml`/`safeMultiline`).
- 🔧 **Parche:** `fixes-P1.diff` — aplica delimitadores y la advertencia en los 3 puntos.

### 3.4 📍 Ubicación: `server.js:1129→1165`, `1233→1275`, `1291→1335`, `1391→1440`, `1807→1906`
- ❌ **Problema:** Race condition con pérdida de datos. Patrón `leerJSON(DATA_FILE)` → `await` llamada IA (segundos) → `guardarJSON(DATA_FILE)`. Dos peticiones concurrentes (dos pestañas del mismo usuario bastan) leen la misma snapshot; la última escritura pisa a la anterior. Verificado ruta por ruta: afecta a `edicion`, `smart-edit`, `expandir`, `subideas-ai` y `orquestar`. (`/api/voz` y `/api/texto` son atómicos: leen después del await.)
- 💥 **Impacto:** pérdida silenciosa de ediciones/nodos en uso normal; corrupción lógica de datos compartidos.
- 🧠 **Estrategia:** *mutex por recurso*: serializar los bloques leer→mutar→escribir por archivo y **re-leer dentro de la sección crítica** fusionando solo los campos afectados (no sobrescribir la snapshot completa). Es el patrón de control de concurrencia optimista/mutex de Node.js; a medio plazo, migrar a SQLite/WAL.
- 🔧 **Parche:** `fixes-P1.diff` — añade `conLock(archivo, fn)` (cola de promesas por archivo) y envuelve las 5 rutas con re-lectura + fusión.

### 3.5 📍 Ubicación: `server.js:857` (y 15 líneas más: 848, 903, 1190, 1247, 1306, 1403, 1709, 1765, 2059, 2188, 2930, 3149, 3185, 3226, 3272)
- ❌ **Problema:** logging de datos sensibles (A09 + matriz de severidad del cliente: "expone datos sensibles en logs" = P1). Se registran transcripciones de voz completas (`CEO dijo: "..."`), textos de nodos, preguntas/respuestas de IA, emails y destinatarios.
- 💥 **Impacto:** el contenido estratégico confidencial queda en stdout/agregadores de logs; fuga ante cualquier acceso al sistema de logs y posible incumplimiento de privacidad.
- 🧠 **Estrategia:** OWASP Logging Cheat Sheet — *never log sensitive data*: registrar metadatos (IDs, longitudes, contadores), nunca contenido.
- 🔧 **Parche:** `fixes-P1.diff` — redacta las 16 líneas (longitud/ID en lugar de contenido).

### 3.6-3.8 📍 Ubicación: `Dockerfile:9,21` · `.github/workflows/*.yml` · `ci.yml:113-119,167-172`
- ❌ **Problema:** cadena de suministro (A06): imagen base por tag flotante; actions fijadas por tag mutable (`@v4` — un commit malicioso en una tag reutilizada se ejecuta en CI); y el job `security` es un no-op (`continue-on-error: true` + el gate `ci-passed` no comprueba `needs.security.result`), de modo que CVEs high/critical en `npm audit` **no bloquean ningún merge**.
- 💥 **Impacto:** compromiso del pipeline (los workflows publican imagen en GHCR con `packages: write`); falsa sensación de seguridad — la auditoría de dependencias nunca frena un despliegue.
- 🧠 **Estrategia:** *pinning* por digest/SHA (CIS GitHub Hardening: "Pin actions to a full length commit SHA") y *fail-closed* en gates (un check de seguridad que no puede fallar no es un check).
- 🔧 **Parche:** `fixes-P1.diff` — imagen base con digest `sha256:c610fcdf…` (índice multi-arch, válido amd64+arm64), 11 actions fijadas a su commit SHA real (verificado vía API de GitHub), `continue-on-error` eliminado y `needs.security.result` añadido al gate.

---

## 4. Enlaces directos a líneas problemáticas

Repo público: `https://github.com/meyueya/escritorio` · rama `main` · ruta `app/`

| Hallazgo | Enlace |
|---|---|
| IDOR área (nodosVisiblesPara) | https://github.com/meyueya/escritorio/blob/main/app/server.js#L222 |
| IDOR área (GET /api/ideas) | https://github.com/meyueya/escritorio/blob/main/app/server.js#L953 |
| OAuth state = userId (Google connect) | https://github.com/meyueya/escritorio/blob/main/app/server.js#L2895 |
| Callback Google sin auth | https://github.com/meyueya/escritorio/blob/main/app/server.js#L2909 |
| Callback Slack sin auth | https://github.com/meyueya/escritorio/blob/main/app/server.js#L3113 |
| Prompt chat-global sin delimitar | https://github.com/meyueya/escritorio/blob/main/app/server.js#L1646 |
| Race: edicion (read→await→write) | https://github.com/meyueya/escritorio/blob/main/app/server.js#L1129 |
| Race: smart-edit | https://github.com/meyueya/escritorio/blob/main/app/server.js#L1233 |
| Race: subideas-ai | https://github.com/meyueya/escritorio/blob/main/app/server.js#L1391 |
| Race: orquestar | https://github.com/meyueya/escritorio/blob/main/app/server.js#L1807 |
| Log de transcripción de voz | https://github.com/meyueya/escritorio/blob/main/app/server.js#L857 |
| Upload: extensión desde originalname | https://github.com/meyueya/escritorio/blob/main/app/server.js#L851 |
| Email a destinatario arbitrario | https://github.com/meyueya/escritorio/blob/main/app/server.js#L3246 |
| Secreto JWT de test hardcodeado | https://github.com/meyueya/escritorio/blob/main/app/server.js#L130 |
| ultimoError expuesto | https://github.com/meyueya/escritorio/blob/main/app/server.js#L1011 |
| Imagen base sin digest | https://github.com/meyueya/escritorio/blob/main/app/Dockerfile#L9 |
| Job security no-op | https://github.com/meyueya/escritorio/blob/main/app/.github/workflows/ci.yml#L113 |
| Gate sin security.result | https://github.com/meyueya/escritorio/blob/main/app/.github/workflows/ci.yml#L167 |
| CDN sin SRI / chart.js sin pin | https://github.com/meyueya/escritorio/blob/main/app/index.html#L15 |
| authToken vestigial | https://github.com/meyueya/escritorio/blob/main/app/main.js#L1221 |

> Nota: los números de línea corresponden al working tree auditado (commit base `5a5126f` + cambios locales no commiteados). Si los cambios locales no se commitean antes, algunos enlaces pueden desalinearse ±pocas líneas.

---

## 5. Métrica de Deuda Técnica

**Base auditada:** 13.363 LOC (server.js 3.681 · main.js 4.905 · statsPanel.js 433 · index.html 575 · style.css 3.468 · configs/tests ~301).

| Indicador | Antes del parche | Tras aplicar `fixes-P1.diff` + `fixes-P2-P3.diff` |
|---|---|---|
| Líneas afectadas por P1 (críticas) | 40 LOC (0,30%) | **0 LOC (0,00%)** |
| Líneas afectadas por P2 | ~120 LOC (0,90%) | ~55 LOC (0,41%) |
| **Código "saludable"** (sin hallazgos P1/P2) | **98,8%** | **99,6%** |
| Hallazgos por KLOC (P1+P2) | 1,80 | 0,67 |
| Cobertura de tests (lines) | 40,95% | 40,95% (el parche no añade tests) |

**Deuda residual priorizada (P3, 20 ítems):**
1. **Cobertura de tests 38–41%** — el mayor riesgo sistémico. Los P1 de IDOR/race existían pese a 12 suites. Recomendación: `coverageThreshold` en jest (p.ej. 70% líneas en `server.js`) + tests de rate-limit, HSTS e IDOR multi-org.
2. **I/O síncrono** (`leerJSON`/`guardarJSON` re-parsean todo `data.json` por petición, 24 call sites) — migrar a SQLite/WAL o `fs.promises`.
3. **~700 LOC de código muerto en frontend** (`_VoiceCloner`, `_IntegrationsManager` sin `init()`, features sin cablear) + funciones de 240–400 líneas (`handleComando` 1919-2323, `createNewIdeaNode` 2861-3102, `LuminaEar` 1411-1792).
4. **Auth vestigial**: `authToken` nunca asignado → ~30 requests envían `Bearer null` (funciona por cookie, pero confunde y es frágil).
5. Validación de entrada (`x`/`y`/`color`/`subIdeas`), `redirect_uri` hardcodeado a localhost, token JWT duplicado en body JSON, `alert()`/`console.*` masivos, higiene de workspace (imágenes/vídeos sueltos).

---

## 6. Remediación Inteligente (sin tocar `main`)

### Parches generados (sugerencia — no aplicados)
| Archivo | Contenido | Tamaño |
|---|---|---|
| `audit-patches/fixes-P1.diff` | Los 8 P1: IDOR, OAuth nonce+sesión, prompt delimiters, race-conditions (5 rutas), redacción de logs, digest de imagen, SHA de actions, gate de seguridad | 651 líneas |
| `audit-patches/fixes-P2-P3.diff` | P2/P3 seguros: upload ext allowlist, guard DEMO_MODE en prod, email fail-closed + escape, error-handler global, pin algoritmo JWT HS256, HSTS, purga del limiter, `aiLimiter` en 6 rutas, SRI+pin chart.js@4.5.1, .dockerignore, determinismo de tests | 233 líneas |

**Aplicación (cuando lo apruebes):**
```bash
cd /Users/meyueya/Escritorio/app
git checkout -b audit/fixes-p0-p1   # NUNCA en main
git apply audit-patches/fixes-P1.diff
git apply audit-patches/fixes-P2-P3.diff
npm test                             # validación de no-regresión
```

### Resumen de validación (regresiones)
- **Baseline (código actual):** 79/81 tests pasan. Los 2 fallos (`models.test.js`, `fallback.test.js`) **no son bugs de lógica**: la sesión que lanzó Jest hereda `DEMO_MODE=true` del entorno; el modo demo activo hace que `/api/demo/login` responda 200 y que el fallback use el cerebro guionado. En un CI limpio el conjunto de fallos cambia de archivo — la suite es **no determinista frente al ambiente**, y eso es justamente uno de los P2 parcheados.
- **Copia validada (parches aplicados en `tmp/audit-validation/`, copia aislada del working tree con `node_modules` enlazado):**
  - `git apply` de ambos parches: **limpio** (orden correcto: `fixes-P1.diff` → `fixes-P2-P3.diff`).
  - `node --check server.js`: sin errores de sintaxis.
  - `diff` contra la versión combinada esperada: **idéntico**.
  - **Suite completa: 11/11 suites, 81/81 tests en verde** (`PASS` en activity, voice, nodes, auth, demo, security, transcription, circuit, today, fallback, models). El parche corrige además el no-determinismo ambiental: `delete process.env.DEMO_MODE` en `models`/`fallback` y `LOCAL_FALLBACK_ENABLED='true'` forzado en `setup.js`.
  - Un test se actualizó dentro del propio parche P1 (`tests/activity.test.js`): ahora verifica que el mensaje viaja **una sola vez** y delimitado con `<datos>…</datos>` (consecuencia intencional de la mitigación anti prompt-injection).

### Hallazgos que requieren decisión de negocio (no parcheados a propósito)
1. **Restricción de destinatario de email** (parcheada): si el negocio exige enviar resúmenes a terceros (p.ej. inversores), esta corrección entra en conflicto con esa lógica — dime si debo relajarla a una allowlist explícita en lugar de "solo el propio correo".
2. **Cifrado de tokens OAuth en `users.json`**: requiere gestionar una clave maestra (KMS) — decisión de arquitectura, no un parche puntual.
3. **Token JWT en el body de login**: quitarlo rompe el contrato que `tests/auth.test.js` y `tests/demo.test.js` verifican; requiere coordinar con el frontend. Dejado como recomendación.

---

## 7. Gestión de Falsos Positivos

No existen marcadores `# audit-ignore` ni `// NOSONAR` en el código (verificado con grep). Recalibraciones aplicadas tras verificación manual:

| Reporte original | Recalibración | Motivo verificado |
|---|---|---|
| "Ausencia de CSP" (frontend) | **Descartado** — la CSP existe, vía header en `server.js:47-59` | El hallazgo real es SRI/pin de CDNs, ya parcheado |
| "Premium solo en cliente" (main.js:658) | **Degradado a P3** | El servidor sí valida `isPremium` en `/api/voice/clone` (server.js:3379-3384) |
| "JWT en localStorage" | **Descartado** | `lumina_token` solo se lee y nunca se escribe; la auth real es cookie HttpOnly (main.js:1220 lo documenta) |
| "Path traversal P1 en upload" | **Degradado a P2** | `renameSync` exige directorios intermedios existentes; el hash de multer no es predecible → la explotación real es DoS/antipatrón, no escritura arbitraria. Se parchea igualmente por allowlist |
| "Credenciales hardcodeadas en CI" | **Degradado a P3** | Valores ficticios de demo (no secretos reales); sigue siendo mala práctica documentada |
| "Race en /api/voz y /api/texto" | **Descartado** | La lectura ocurre después del `await` → bloque síncrono atómico. La race real está en las 5 rutas de edición IA |

---

## 8. Verificaciones positivas (no son hallazgos)

CORS por allowlist con `credentials` · cookie `HttpOnly; SameSite=Lax; Secure` en prod · bcrypt con cost 10 · CSP, `X-Frame-Options: DENY`, `nosniff`, COOP, Permissions-Policy · `x-powered-by` desactivado · `express.json` limitado a 256 kb · JWT con `expiresIn: 7d` y throw en prod si `JWT_SECRET` < 32 chars · allowlist de archivos estáticos · multer con límite 12 MB y 1 archivo · usuario no-root + dumb-init + HEALTHCHECK en Docker · `.env`/`users.json`/`data.json`/`backup.json`/`activity.json` correctamente ignorados por git y **no trackeados** · `npm audit` limpio · `spawn('say')` sin shell (texto vía archivo temporal) → sin inyección de comandos · checks de propiedad/org en mutaciones de nodos.

---

*Generado por el agente auditor (SAST) — ninguna línea del código de producción ha sido modificada. Pendiente de aprobación humana.*
