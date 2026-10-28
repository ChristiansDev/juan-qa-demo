# Arquitectura: Page Object Model (POM)

Detalle y ejemplos en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Flujo de trabajo en [AGENTS.md](AGENTS.md).

| Carpeta | Contiene | No contiene |
| --- | --- | --- |
| `pages/` | Una clase por página: locators en el constructor y acciones `async` | Aserciones, datos de prueba |
| `tests/` | Specs con `expect`, etiquetados `@SC-xxx` y `@smoke`/`@regression` | Locators sueltos (`page.locator(...)`) |
| `tests/auth/` | `<rol>.setup.ts`: login por rol que guarda `.auth/<rol>.json`; `session.ts` con la ruta | Aserciones del escenario |
| `data/` | Set de datos de cada escenario (`data/<id>.ts`) y catálogo de usuarios compartido (`data/users.ts`), secretos vía `process.env` | Credenciales reales |
| `scenarios/` | Escenarios exportados por el Hub | Código |

- Antes de crear un page object, buscar si la página ya existe en `pages/` y extenderla.
- Nombre de archivo y clase: `<Nombre>Page.ts` / `class <Nombre>Page`.
- Un page object no instancia otros page objects; el test los coordina.
