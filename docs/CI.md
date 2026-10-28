# CI — Azure Pipelines

Pipeline en [azure-pipelines.yml](../azure-pipelines.yml). Para activarlo: **Pipelines > New pipeline**, elegir el repo y "Existing Azure Pipelines YAML file".

## Qué hace

1. Instala dependencias con pnpm vía Corepack (`--frozen-lockfile` si existe `pnpm-lock.yaml`; commitealo después de la primera instalación para builds reproducibles).
2. Corre `typecheck`, `lint` y los tests.
3. Publica los resultados JUnit en la pestaña **Tests** y, si algo falla, sube `playwright-report/` como artefacto.

Se dispara en push a `main` y en pull requests. En Azure Repos, el disparo por PR se configura con una **Build validation** en la política de la rama; el bloque `pr:` aplica a repos de GitHub o Bitbucket.

## Variables

En **Edit > Variables** del pipeline:

| Nombre | Tipo | Si no se define |
| --- | --- | --- |
| `BASE_URL` | Variable | Se usa `APP_URL` de `playwright.config.ts`, la URL de los escenarios |
| Cada secreto listado en `.env.example` (por ejemplo `E2E_USERS`) | Secreto (marcar "Keep this value secret") | Fallan los tests que lo usan |

Las variables secretas no llegan solas al proceso: descomentá el bloque `env:` del paso **Run tests** después de crearla.

## Imagen

Usa `mcr.microsoft.com/playwright:v1.64.1-noble`, que trae los navegadores. El tag debe coincidir con la versión de `@playwright/test` en `package.json`: si actualizás una, actualizá la otra.
