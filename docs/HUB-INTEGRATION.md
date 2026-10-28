# Integración con el Hub

Cómo el Hub puede pedirle a un agente de Cursor que implemente un escenario en este repo. El código del Hub y del worker vive fuera de este repositorio; acá está el contrato del lado del repo de pruebas.

## Contrato

1. El Hub exporta el escenario a `scenarios/<ID>-<slug>.md` siguiendo [scenarios/_template.md](../scenarios/_template.md) (commit en la rama de trabajo, o incluido en el prompt). El escenario lleva la URL completa de la app en `base_url` y la tabla **Set de datos**: el agente no puede leer `.env`, así que no debe depender de él para saber a dónde apuntar.
2. El agente sigue [AGENTS.md](../AGENTS.md): lee el escenario, genera su set de datos si el Hub no lo incluyó, explora la app en `base_url`, implementa según [ARCHITECTURE.md](ARCHITECTURE.md), corre los tests y deja el PR.
3. Cada test generado queda etiquetado con el id del escenario (`@SC-123`), lo que permite al Hub correrlo con `--grep @SC-123` y vincular resultados.

## Opción A: Cloud Agents API (worker del Hub)

Para apps accesibles desde internet. El agente corre en una VM de Cursor con navegador propio y abre un PR.

```http
POST https://api.cursor.com/v1/agents
Authorization: Bearer <CURSOR_API_KEY>
Content-Type: application/json
```

```json
{
  "prompt": {
    "text": "Implementá el escenario scenarios/SC-123-checkout.md siguiendo AGENTS.md. Corré typecheck, lint y el test nuevo antes de terminar."
  },
  "repos": [
    { "url": "https://github.com/acme/e2e-tests", "startingRef": "main" }
  ],
  "autoCreatePR": true,
  "envVars": { "E2E_USERS": "<JSON tomado del gestor de secretos del worker>" },
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest", "--headless"] },
    "playwright-session": { "command": "npx", "args": ["-y", "@playwright/mcp@latest", "--headless", "--isolated", "--storage-state", ".auth/session.json"] }
  }
}
```

- La respuesta incluye `agent.id` y `agent.url` (`https://cursor.com/agents/bc-…`). El Hub los guarda vinculados al escenario para que la persona abra el agente después.
- Los Cloud Agents leen `AGENTS.md` y `.cursor/rules/`, y preparan el entorno con `.cursor/environment.json`. **No leen `.cursor/mcp.json`**: por eso el MCP se pasa en `mcpServers` (o se configura a nivel equipo en cursor.com/agents).
- `envVars` lleva solo los secretos del proyecto (los nombres están en `.env.example`; el ejemplo usa la estrategia 2 de [CREDENTIALS.md](CREDENTIALS.md)). Si las contraseñas están versionadas o los usuarios se crean por API, puede no hacer falta ninguno. Con ellos el agente corre `pnpm auth` en la VM y explora las pantallas protegidas con `playwright-session` sin ver las contraseñas; verificar que la ruta relativa `.auth/session.json` se resuelva desde la raíz del repo. Agregar `BASE_URL` únicamente para apuntar a un ambiente distinto del de `base_url`.
- Revisar en la documentación vigente de la API los nombres exactos de `envVars` y `mcpServers` antes de implementar el worker; la API v1 está en beta pública.
- La API key vive solo en el worker, nunca en el navegador del Hub.

## Opción B: SDK local (app en red interna)

Si la app solo es accesible desde la red de Huenei, la VM de Cursor no la ve (salvo con Tailscale, Cloudflare Tunnel o Self-Hosted Machines). En ese caso el worker usa `@cursor/sdk` sobre un checkout local:

```ts
import { Agent } from '@cursor/sdk';

const agent = await Agent.create({
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: '<modelo>' },
  local: { cwd: '/ruta/al/checkout/e2e-tests' },
});
```

En modo local las herramientas se aprueban automáticamente por defecto: correrlo en una máquina o contenedor dedicado.

## Opción C: handoff a una persona en el IDE

Para que quien prueba vea la app en el navegador de Cursor mientras el agente escribe el script:

1. Abrir el checkout local en Cursor (`cursor <ruta>`; verificar este comando en las máquinas de QA, no está en la documentación oficial).
2. Abrir un deeplink con un prompt **corto** que apunte al escenario, no el escenario entero (límite de 10.000 caracteres):

   ```text
   cursor://anysphere.cursor-deeplink/prompt?text=Implementá%20scenarios%2FSC-123-checkout.md%20siguiendo%20AGENTS.md.%20Abrí%20la%20base_url%20del%20escenario%20en%20el%20navegador%20y%20usala%20como%20referencia.
   ```

3. La persona revisa y envía el chat (el deeplink nunca se ejecuta solo y no elige el repo: cae en la ventana abierta). El agente abre la app con el navegador de Cursor y escribe el test.
