# AGENTS.md

Proyecto de pruebas E2E con **Playwright + TypeScript**, arquitectura **Page Object Model (POM)**.

Este archivo es el punto de entrada para cualquier agente (Cursor en el IDE, Cursor SDK, Cloud Agents, Claude). Las reglas en `.cursor/rules/` lo complementan.

## Comandos

| Acción | Comando |
| --- | --- |
| Instalar | `pnpm install && pnpm exec playwright install chromium` |
| Correr todo | `pnpm test` |
| Correr un archivo | `pnpm test tests/<archivo>.spec.ts` |
| Correr por escenario | `pnpm test --grep @SC-001` |
| Guardar las sesiones para explorar | `pnpm auth` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Ver reporte y traces | `pnpm test:report` |

## Definir un escenario

Si el escenario no existe o le faltan datos y hay una persona disponible, usar `/new-e2e-scenario`: el agente entrevista a QA en rondas de preguntas técnicas, pide el set de datos de cada caso y escribe el escenario en `scenarios/` y su set de datos en `data/<id>.ts`. Para implementarlo, `/new-e2e-test` pide siempre elegir el escenario. En ejecuciones sin persona (Cloud Agents), anotar lo faltante en **Preguntas abiertas** del escenario y en el PR.

## Flujo para implementar un escenario

1. **Leer el escenario** en `scenarios/<ID>-<slug>.md` (formato en [scenarios/_template.md](scenarios/_template.md)) y su set de datos en `data_file`. Si el archivo de datos no existe, generarlo con las reglas de la ronda 7 de `/new-e2e-scenario` (**Dónde se guarda**). Si falta información imprescindible, dejarlo anotado en el PR en lugar de inventarla.
2. **Explorar la aplicación** en la `base_url` del escenario, que es también `APP_URL` en `playwright.config.ts`. No depender de `.env`. Abrir la pantalla `target_path`; si el escenario tiene `session`, explorar con la sesión del rol según **Explorar una pantalla que requiere sesión** de la skill `e2e-playwright`: el login lo hace `tests/auth/<rol>.setup.ts` con `pnpm auth`, y el agente nunca escribe contraseñas en el navegador. Usar el navegador disponible (Playwright MCP en el IDE, el navegador de la VM en Cloud Agents) para confirmar textos, roles y test ids reales antes de escribir locators.
3. **Implementar según la arquitectura** descrita en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): reutilizar lo existente antes de crear algo nuevo.
4. **Escribir el test** en `tests/`, importando los casos de `data_file`, etiquetado con el id del escenario (`@SC-001`) y con `@smoke` o `@regression`.
5. **Correr y corregir**: `pnpm typecheck`, `pnpm lint` y el test nuevo deben pasar. Ante un fallo, revisar el trace (`test-results/`) antes de cambiar el test.
6. **Dejar el PR listo**: describir el escenario cubierto, los archivos creados y cualquier supuesto.

## Skills

En `.claude/skills/`. Ante cualquier diferencia, este archivo, `.cursor/rules/` y `docs/ARCHITECTURE.md` prevalecen sobre las skills externas.

| Skill | Para qué |
| --- | --- |
| `e2e-playwright` | Cómo se trabaja en este proyecto (tiene prioridad) |
| `playwright-best-practices` | Patrones de Playwright por actividad: locators, esperas, auth, mocks, flaky tests, CI |
| `playwright-cli` | Explorar la app desde la terminal con `npx playwright cli`, sin MCP |
| `e2e-testing-patterns` | Criterios generales de E2E (qué automatizar, selectores estables, aislamiento) |
| `verification-before-completion` | No dar nada por terminado sin correr y leer typecheck, lint y tests |

Antes de declarar un escenario terminado, aplicar `verification-before-completion`: correr `pnpm typecheck`, `pnpm lint` y el test nuevo, y citar el resultado.

## Límites

- No commitear `.env`. Las contraseñas de los usuarios siguen la estrategia de [docs/CREDENTIALS.md](docs/CREDENTIALS.md) y se obtienen siempre con `passwordOf()`; tokens y claves de API, por variables de entorno (ver `.env.example`).
- No usar esperas fijas (`waitForTimeout`) ni `test.only`.
- En `playwright.config.ts`, solo cambiar `APP_URL` (lo escribe `/new-e2e-scenario`) o `testIdAttribute` si la app usa otro atributo, salvo que el escenario requiera más. Si cambia la versión de `@playwright/test`, actualizar también la imagen Docker del CI.
- Los tests deben ser independientes entre sí y poder correr en paralelo.
