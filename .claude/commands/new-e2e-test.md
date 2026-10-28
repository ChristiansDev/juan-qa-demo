# /new-e2e-test

Implementa el test E2E de un escenario de `scenarios/`, aplicando las skills de Playwright del proyecto.

**Entrada opcional**: la ruta o el id de un escenario (por ejemplo `scenarios/SC-001-login.md` o `SC-001`). Aunque se indique, el paso 1 se hace siempre.

## 1. Elegir el escenario (siempre)

1. Listar los archivos de `scenarios/` excepto `_template.md`. Para cada uno mostrar: id, título, tag y estado (**implementado** si algún test en `tests/` ya tiene el tag `@<id>`; si no, **pendiente**).
2. Pedir a la persona que elija uno. Si se pasó un escenario como entrada, mostrarlo como opción recomendada, pero esperar la confirmación igual.
3. No avanzar sin una elección. Si no hay escenarios, proponer `/new-e2e-scenario` y terminar.
4. Si el escenario elegido ya está implementado, preguntar si se extiende el test existente o se reemplaza.
5. Si al escenario le falta información para implementarlo (sin `base_url`, pasos sin elemento, entradas sin **Set de datos**, **Preguntas abiertas** que bloquean), listar lo que falta y proponer completarlo con `/new-e2e-scenario` antes de seguir.
6. Si el escenario tiene **Set de datos** pero no existe el archivo de `data_file`, proponer generarlo con `/new-e2e-scenario`. Solo si la persona prefiere seguir, crearlo con las reglas de la ronda 7 de ese comando (**Dónde se guarda**).

## 2. Leer el contexto

- El escenario elegido, [AGENTS.md](../../AGENTS.md) y [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
- Las skills, en este orden de prioridad (rutas relativas a `.claude/skills/`):

| Skill | Cómo usarla al generar el script |
| --- | --- |
| `e2e-playwright/SKILL.md` | Convenciones del proyecto; prevalece sobre las demás |
| `playwright-best-practices/SKILL.md` | Leer las referencias que correspondan (tabla de abajo) antes de escribir código |
| `playwright-cli/SKILL.md` | Explorar la app y generar locators desde la terminal (`npx playwright cli open`, `snapshot`, `generate-locator`) si no hay Playwright MCP |
| `e2e-testing-patterns/SKILL.md` | Independencia de tests, selectores estables, qué no cubrir en E2E |
| `verification-before-completion/SKILL.md` | Paso 6: no declarar terminado sin evidencia |

Referencias de `playwright-best-practices` según el caso:

| Situación | Leer |
| --- | --- |
| Siempre | `core/locators.md`, `core/assertions-waiting.md`, `core/test-tags.md` |
| Arquitectura POM | `core/page-object-model.md` |
| Arquitectura Screenplay o App Actions (fixtures propios) | `architecture/pom-vs-fixtures.md`, `core/fixtures-hooks.md` |
| El escenario tiene **Set de datos** con varias filas | `core/test-data.md` |
| Sesión, roles o MFA | `advanced/authentication.md` |
| Mocks o servicios externos | `architecture/when-to-mock.md`, `advanced/network-advanced.md`, `advanced/third-party.md` |
| Fecha u hora, archivos, pestañas, iframes, mobile o accesibilidad | La referencia que indica la ronda 8 de `/new-e2e-scenario` |

## 3. Explorar la aplicación

Abrir `base_url` + `target_path` del escenario. Si `session` no es `none`, explorar con la sesión del rol según **Explorar una pantalla que requiere sesión** de `e2e-playwright/SKILL.md`. La URL base es (la misma que `APP_URL` en `playwright.config.ts`) y recorrer los pasos para confirmar textos, roles y test ids reales. Usar Playwright MCP, el navegador de Cursor o `npx playwright cli`. Nunca escribir un locator sin haberlo visto en la app.

## 4. Usar el set de datos

- Importar los casos del archivo de `data_file` (lo generó `/new-e2e-scenario`). No repetir valores del set de datos dentro del test.
- Los usuarios llegan por la clave del caso: email, rol y permisos de `data/users.ts`, y la contraseña de `passwordOf(<clave>)` (`data/credentials.ts`, según `docs/CREDENTIALS.md`), salvo que el caso traiga una contraseña inválida a propósito. No copiar emails ni contraseñas en el test. Si el test necesita un usuario que no está en el catálogo, agregarlo ahí (con la confirmación de la persona) y no en el test.
- Si hay varios casos para el mismo flujo, parametrizar: un `test()` por caso dentro de un `for`, con el nombre del caso en el título y los mismos tags.
- Datos **generados**: usar la factory de `factories/`. Datos **creados por API**: crearlos en un fixture o en `beforeEach` con lo que define el caso, y limpiarlos si el escenario lo pide.
- Si al implementar hace falta un dato que el archivo no tiene, agregarlo al archivo y a la tabla del escenario a la vez. No inventar valores marcados "(propuesto)" sin confirmar: preguntar antes de usarlos.

## 5. Implementar el test

1. Crear o extender las abstracciones que pide la arquitectura (ver `docs/ARCHITECTURE.md`), reutilizando las existentes.
2. Escribir el test en `tests/`, etiquetado `tag: ['@<id>', '@smoke' | '@regression']`, con aserciones web-first sobre el **Resultado esperado** exacto.
3. Un test por caso negativo que el escenario indique como separado.
4. Si el escenario tiene `session`, reutilizar la sesión con `test.use({ storageState: sessionFile('<rol>') })` (de `tests/auth/session.ts`) en lugar de loguearse por formulario.

## 6. Verificar (verification-before-completion)

Ejecutar y leer la salida completa de cada comando; no afirmar que algo pasa sin haberlo corrido:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test --grep @<id>`
4. `pnpm test --grep @<id> --repeat-each=3`, para detectar inestabilidad

`pnpm test` usa `--pass-with-no-tests`, así que un `--grep` sin coincidencias también termina bien: confirmar en la salida que corrió la cantidad de tests esperada.

Ante un fallo, revisar el trace en `test-results/` antes de cambiar el test (ver `debugging/flaky-tests.md` si es intermitente).

## 7. Resumir

Escenario cubierto, casos implementados, archivos creados o modificados, resultado de cada comando del paso 6 y supuestos tomados.
