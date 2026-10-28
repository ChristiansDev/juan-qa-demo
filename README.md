# Pruebas E2E — Playwright + TypeScript (Page Object Model)

Esqueleto de automatización E2E generado con `create-huenei-template`, listo para trabajar con agentes de IA (Cursor, Claude) a partir de escenarios.

## Requisitos

- Node.js 22+
- pnpm

## Inicio rápido

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test
```

El esqueleto no trae tests: `pnpm test` termina bien hasta que agregues el primero. La URL de la app vive en `APP_URL` de `playwright.config.ts` (la escribe `/new-e2e-scenario`); `BASE_URL` la reemplaza para otro ambiente. Los secretos que usen los sets de datos se listan en `.env.example`: copialo a `.env` para definir sus valores.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm test` | Corre toda la suite en Chromium |
| `pnpm test:smoke` | Solo los tests `@smoke` |
| `pnpm test --grep @SC-001` | Los tests de un escenario |
| `pnpm test:ui` | Modo UI interactivo |
| `pnpm test:headed` | Con el navegador visible |
| `pnpm test:report` | Abre el último reporte HTML |
| `pnpm auth` | Corre los logins de `tests/auth/` y guarda las sesiones en `.auth/` para que el agente explore pantallas protegidas |
| `pnpm typecheck` | Verifica tipos sin abrir el navegador |
| `pnpm lint` | ESLint con reglas de Playwright (sin esperas fijas ni `.only`) |

## Estructura

```text
pages/                 Page objects: locators y acciones por página
tests/                 Specs y aserciones
data/                  Set de datos de cada escenario (data/<id>.ts) y catálogo de usuarios (users.ts)
scenarios/             Escenarios en lenguaje natural (contrato con el Hub)
docs/ARCHITECTURE.md   El patrón POM y cuándo agregar capas
docs/CREDENTIALS.md    Estrategia de contraseñas de los usuarios de prueba
docs/HUB-INTEGRATION.md  Cómo el Hub lanza agentes sobre este repo
AGENTS.md              Instrucciones para agentes de IA
.cursor/               Reglas, skills, comandos, hook y MCP del agente
```

## Trabajar con agentes

- En Cursor, ejecutá `/new-e2e-scenario` para que el agente te entreviste (incluye preguntas de buenas prácticas del framework y el set de datos de cada caso) y escriba el escenario en `scenarios/` y su set de datos en `data/`.
- Después, `/new-e2e-test`: te pide elegir un escenario de `scenarios/` y escribe el test aplicando las skills del framework y el set de datos del escenario.
- El agente explora la app con Playwright MCP (configurado en `.cursor/mcp.json`) y sigue [AGENTS.md](AGENTS.md).
- Al terminar, un hook corre `typecheck` y `lint` y le devuelve los errores al agente si los hay.
- Para Cloud Agents y el SDK, ver [docs/HUB-INTEGRATION.md](docs/HUB-INTEGRATION.md).

## Skills incluidas

| Skill | Origen | Para qué |
| --- | --- | --- |
| `e2e-playwright` | propia del template | Cómo se trabaja en este proyecto (tiene prioridad) |
| `playwright-best-practices` | currents-dev/playwright-best-practices-skill | Patrones de Playwright por actividad: locators, esperas, auth, mocks, flaky tests, CI |
| `playwright-cli` | microsoft/playwright-cli | Explorar la app desde la terminal con `npx playwright cli`, sin MCP |
| `e2e-testing-patterns` | wshobson/agents | Criterios generales de E2E (qué automatizar, selectores estables, aislamiento) |
| `verification-before-completion` | obra/superpowers | No dar nada por terminado sin correr y leer typecheck, lint y tests |

Las skills externas están copiadas en `.claude/skills/` y el CLI las actualizó a su última versión al generar el proyecto. Para actualizar una después, descargá la versión nueva (`npx skills add <origen> --skill <nombre> --copy`) y reemplazá su carpeta.

## CI

Si elegiste un proveedor de CI al generar el proyecto, la configuración y cómo usarla están en `docs/CI.md`.

## Principios

- Tests legibles, enfocados en comportamiento e independientes entre sí.
- Locators accesibles y auto-waiting de Playwright; nunca esperas fijas.
- Contraseñas según la estrategia de `docs/CREDENTIALS.md` (versionadas, secreto del CI, gestor de secretos o usuarios creados por API); el resto de los datos, en el set de datos de cada escenario.
- Agregar capas (fixtures, componentes, helpers de API) cuando el dolor aparezca, no antes. Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
