# Proyecto: Escritorio (colección de proyectos)

Este repositorio contiene varios proyectos y utilidades en subcarpetas. Objetivo: centralizar documentación mínima, CI y buenas prácticas.

<!-- Badges -->

- [![CI](https://github.com/meyueya/escritorio/actions/workflows/ci.yml/badge.svg)](https://github.com/meyueya/escritorio/actions)
- [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
- [![Dependabot Status](https://img.shields.io/badge/dependabot-enabled-blue)](https://github.com/meyueya/escritorio/security/dependabot)

<!-- Additional badges -->

- [![CodeQL](https://github.com/meyueya/escritorio/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/meyueya/escritorio/actions)
- [![Coverage](https://codecov.io/gh/meyueya/escritorio/branch/main/graph/badge.svg)](https://codecov.io/gh/meyueya/escritorio)


## Contenido
- `Agentes multiples/` — colección de agentes y demos
- `Camara seguridad/` — scripts de cámara y diagnóstico
- `EmpleoApp/`, `empleo/`, `app/` — aplicaciones y demos
- `simulador tipo 2/` — proyecto de ejemplo

## Uso
Cada subcarpeta es un proyecto independiente. Para trabajar en uno, entra en la carpeta correspondiente y sigue sus instrucciones (si existen). Ejemplo:

```bash
cd "Agentes multiples"
# instalar dependencias (según stack: npm, yarn, pip...)
```

## Quality & CI
Se incluye un flujo de CI básico en `.github/workflows/ci.yml` que ejecuta instalación, lint y tests cuando existan.

## Contribuir
Consulta [CONTRIBUTING.md](CONTRIBUTING.md#L1) para normas de contribución.


