---
name: e2e-playwright
description: Implementar, ejecutar y depurar tests E2E con Playwright en este proyecto. Usar al convertir un escenario en test, agregar abstracciones de la arquitectura (page objects, tareas, app actions), investigar un test que falla o explorar la app para obtener locators.
---

# Playwright E2E

## Implementar un escenario

1. Leer el escenario en `scenarios/`, su set de datos (`data_file`) y la arquitectura en `docs/ARCHITECTURE.md`.
2. Explorar la pantalla en `base_url` + `target_path` del escenario (con sesión si `session` no es `none`, ver abajo):
   - En el IDE, con Playwright MCP (`browser_navigate`, `browser_snapshot`) o el navegador de Cursor.
   - Desde la terminal: `pnpm exec playwright codegen <url>` genera locators sugeridos.
3. Reutilizar abstracciones existentes; crear solo las que falten.
4. Escribir el test con tags `@SC-xxx` y `@smoke`/`@regression`.
5. Verificar: `pnpm typecheck && pnpm lint && pnpm test --grep @SC-xxx`.

## Explorar una pantalla que requiere sesión

El agente nunca escribe contraseñas en el navegador ni las necesita: el login lo hace un script que obtiene la contraseña con `passwordOf()`, y el agente recibe la sesión ya iniciada.

1. Buscar `tests/auth/<rol>.setup.ts` para el rol del escenario (`session` en el frontmatter). Si no existe, crearlo. La pantalla de login es pública: explorarla con el servidor MCP `playwright`, sin sesión.

   ```ts
   // tests/auth/admin.setup.ts
   import { test as setup, expect } from '@playwright/test';
   import { users } from '../../data/users';
   import { passwordOf } from '../../data/credentials';
   import { sessionFile } from './session';

   setup('authenticate as admin', async ({ page }) => {
     await page.goto('/login');
     await page.getByLabel('Email').fill(users.admin.email);
     await page.getByLabel('Password').fill(passwordOf('admin'));
     await page.getByRole('button', { name: 'Sign in' }).click();
     await expect(page).toHaveURL(/dashboard/);
     await page.context().storageState({ path: sessionFile('admin') });
   });
   ```

2. Correr `pnpm auth`, que ejecuta solo los `*.setup.ts` y guarda `.auth/<rol>.json` (fuera de git). La contraseña sale de `passwordOf()` según `docs/CREDENTIALS.md`. Si falla porque falta un secreto, pedir a la persona que lo defina en `.env`, o al Hub que lo pase en `envVars`. El agente no lo escribe.
3. Copiar `.auth/<rol>.json` a `.auth/session.json` y explorar con el servidor MCP `playwright-session`, que abre el navegador con esa sesión. Desde la terminal: `npx playwright cli open`, `state-load .auth/<rol>.json` y navegar.
4. Abrir `base_url` + `target_path`. Si la pantalla solo se alcanza navegando, seguir **Acceso a la pantalla** del escenario.
5. Para cambiar de rol, cerrar el navegador (`browser_close`) y repetir el paso 3.

Si el login no se puede automatizar (MFA, SSO externo, captcha), pedir a la persona que corra `npx playwright codegen --save-storage .auth/<rol>.json <base_url>` y se loguee a mano. Sin persona (Cloud Agents), dejarlo en **Preguntas abiertas**. Las sesiones vencen: si la app redirige al login, volver a correr `pnpm auth`.

En los tests, `test.use({ storageState: sessionFile('<rol>') })` reutiliza la misma sesión; el proyecto `setup` corre antes de la suite. El login por formulario se verifica en un test propio.

## Depurar un fallo

| Situación | Herramienta |
| --- | --- |
| Ver qué pasó en CI o local | `pnpm exec playwright show-trace test-results/<carpeta>/trace.zip` |
| Paso a paso con UI | `pnpm test:ui` |
| Ver el navegador | `pnpm test:headed --grep @SC-xxx` |
| Pausar en un punto | `await page.pause()` temporal, nunca commiteado |

Antes de cambiar un locator, abrir el trace y confirmar qué había en pantalla. Si el fallo es de timing, la solución es una aserción web-first sobre el estado esperado, no una espera fija.

## Test ids

`page.getByTestId()` busca `data-testid`. Si la app usa otro atributo (`data-test`, `data-qa`), configurarlo una vez como `testIdAttribute` en `playwright.config.ts`. Preferir igualmente roles accesibles cuando existan.

## Skills complementarias

Esta skill describe cómo se trabaja en **este** proyecto. Ante cualquier diferencia con las demás, prevalecen `AGENTS.md`, `.cursor/rules/` y `docs/ARCHITECTURE.md`.

| Skill | Usarla para |
| --- | --- |
| `playwright-best-practices` | Patrones de Playwright por actividad: locators, esperas, auth, mocks, flaky tests, CI |
| `playwright-cli` | Explorar la app desde la terminal (`npx playwright cli open <url>`, `snapshot`, `generate-locator`), sin MCP |
| `e2e-testing-patterns` | Criterios generales de E2E: qué automatizar y qué no, selectores estables, aislamiento |
| `verification-before-completion` | Antes de dar por terminado: correr typecheck, lint y el test, y leer la salida |

## Referencias

- https://playwright.dev/docs/best-practices
- https://playwright.dev/docs/locators
- https://playwright.dev/docs/test-annotations#tag-tests
