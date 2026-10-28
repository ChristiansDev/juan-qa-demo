---
paths:
  - "tests/**/*.ts"
  - "pages/**/*.ts"
  - "app-actions/**/*.ts"
  - "src/**/*.ts"
---

# Estándares de tests E2E (Playwright)

## Locators

Orden de preferencia: `getByRole` > `getByLabel` > `getByPlaceholder` > `getByText` > `getByTestId` (Playwright usa `data-testid`; si la app usa otro atributo, configurar `testIdAttribute` en `playwright.config.ts`). Evitar CSS y XPath ligados a la estructura del DOM. Confirmar cada locator contra la app real antes de usarlo.

## Esperas

- Nunca `page.waitForTimeout`. Usar aserciones web-first (`await expect(locator).toBeVisible()`), que reintentan solas.
- No envolver acciones en `try/catch` para "reintentar"; si es inestable, entender por qué con el trace.

## Independencia

- Cada test prepara su propio estado y puede correr solo y en paralelo.
- Sin `test.only`; `test.skip` solo con un comentario que diga por qué.

## Datos y secretos

- La URL de la app está en `APP_URL` de `playwright.config.ts`; los tests navegan con rutas relativas (`page.goto('/ruta')`). `BASE_URL` solo la reemplaza por ambiente.
- Los datos de cada escenario están en su `data_file` (`data/<id>.ts`) y los tests los importan; los generados salen de `factories/`.
- Contraseñas de usuarios: siempre con `passwordOf()` de `data/credentials.ts`, según la estrategia de `docs/CREDENTIALS.md`. Nunca en el catálogo, en un set de datos ni en un test.
- Tokens y claves de API solo como `process.env.<VARIABLE>` (`.env` local, secretos en CI).
- Los usuarios de prueba salen del catálogo compartido `data/users.ts`, elegidos por rol; nunca se duplican en un set de datos ni en el test.
- Ningún otro dato de prueba en variables de entorno: va en el archivo de datos del escenario.

## Trazabilidad

- Cada test lleva `tag: ['@SC-xxx', '@smoke' | '@regression']`. El id coincide con el archivo en `scenarios/`.
- Nombre del test en inglés, describiendo el comportamiento: `'locked out user sees an error'`.

## Versiones

- La versión de `@playwright/test` está fijada y debe coincidir con la imagen Docker del CI (`mcr.microsoft.com/playwright:v<versión>-noble`). Si se actualiza una, actualizar la otra.
