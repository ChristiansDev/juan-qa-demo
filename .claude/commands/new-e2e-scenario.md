# /new-e2e-scenario

Entrevista a la persona de QA y produce un escenario E2E completo en `scenarios/`, con el detalle técnico y el set de datos que un agente necesita para escribir el script sin adivinar.

**Entrada opcional**: la URL de la pantalla a automatizar, junto con una historia de usuario, un ticket, un caso de prueba manual o una descripción libre.

**Salida**:

- `scenarios/<ID>-<slug>.md` con el formato de [scenarios/_template.md](../../scenarios/_template.md).
- El set de datos en `data/<id>.ts` y, si hay datos generados, su factory en `factories/` (ver ronda 7).
- Los usuarios nuevos en el catálogo compartido `data/users.ts` (se crea con el primero) y, si la pantalla requiere sesión, el login del rol en `tests/auth/<rol>.setup.ts`.
- `APP_URL` en `playwright.config.ts` y los nombres de las variables secretas en `.env.example`, si cambian.

Este comando no escribe tests: eso lo hace `/new-e2e-test` a partir de estos archivos.

## Skills que guían las preguntas

Leer antes de empezar y consultar durante la entrevista. Las rutas son relativas a `.claude/skills/`.

| Skill | Para qué |
| --- | --- |
| `e2e-testing-patterns/SKILL.md` | Decidir si el comportamiento corresponde a E2E o a un test de menor nivel |
| `playwright-best-practices/SKILL.md` | Preguntas técnicas según lo que hace el escenario (ronda 8) |
| `e2e-playwright/SKILL.md` | Convenciones de este proyecto, que tienen prioridad sobre las demás skills |

## Cómo conducir la entrevista

- Preguntar en **rondas**: en cada mensaje, todas las preguntas cuyas dependencias ya están resueltas, y ninguna más. Si una pregunta depende de otra que sigue abierta en la misma ronda (por ejemplo, cómo se crean los datos antes de saber qué rol se usa), va a la ronda siguiente. Las rondas de abajo son un orden orientativo, no un guion fijo.
- Numerar las preguntas (Q1, Q2...) y dar una respuesta recomendada para cada una. Redactarlas de modo que responder "sí" acepte la recomendación; así la persona solo escribe cuando quiere corregir.
- Después de cada respuesta, recalcular qué preguntas quedaron habilitadas y cuáles ya no hacen falta.
- **No preguntar lo que se puede averiguar.** Una vez conocida la URL de la app (ronda 2), antes de preguntar por textos, roles, rutas o test ids, abrirla en el navegador (Playwright MCP, el navegador de Cursor o `npx playwright cli`, ver la skill `playwright-cli`) y recorrer la pantalla. Si la pantalla requiere sesión, explorarla según **Explorar una pantalla que requiere sesión** de `e2e-playwright/SKILL.md`. Proponer lo encontrado y pedir confirmación.
- Si la entrada ya responde una pregunta, no repetirla: mostrar lo que se entendió y seguir.
- Detenerse cuando el escenario no tenga huecos que obliguen al agente a inventar. Lo que siga sin respuesta va a **Preguntas abiertas**.

## Rondas

### 1. Objetivo y alcance

- Qué flujo o comportamiento se valida y cuál es el criterio de aceptación.
- Si conviene probarlo en E2E. Según `e2e-testing-patterns`, E2E es para caminos críticos y flujos completos; la lógica aislada o los casos borde masivos van mejor en tests unitarios o de API. Si no corresponde, decirlo y proponer el alcance E2E mínimo.
- Id del escenario (del Hub, Jira u otra herramienta) o el siguiente `SC-xxx` libre en `scenarios/`.
- Prioridad y tag: `@smoke` (camino crítico, corre en cada PR) o `@regression`.
- Si es un solo escenario o conviene dividirlo (un test por comportamiento).

### 2. Entorno

- URL completa de la app bajo prueba (por ejemplo `https://staging.example.com`). No depender de `BASE_URL` ni de `.env`: la mayoría de los agentes no puede leer ese archivo, así que la URL queda escrita en el escenario (`base_url`) y en `APP_URL` de `playwright.config.ts`.
  - Si `APP_URL` ya tiene valor, proponerlo como respuesta recomendada.
  - Si la URL dada es distinta, preguntar si es otro ambiente de la misma app (se anota en **Entorno**; en CI se elige con `BASE_URL`) o una app distinta (avisar que este proyecto apunta a una sola app y acordar cómo seguir).
- Pantalla a automatizar (`target_path`). Si la entrada trae la URL completa de la pantalla, separarla en `base_url` y `target_path` y confirmarlo.
- Si la app solo es accesible por VPN o red interna (condiciona si puede correr en Cloud Agents).
- Navegador, viewport o dispositivo, idioma y zona horaria, solo si difieren del default.

### 3. Usuario y estado previo

- Usuario necesario y cómo obtiene la sesión: formulario, API, cookie o token.
  - Leer el catálogo de usuarios (`data/users.ts`) y proponer el que tenga el rol y los permisos que pide el escenario.
  - Si no hay ninguno, pedir email, rol y permisos del usuario nuevo. La contraseña no se pide: la resuelve `passwordOf()` según la estrategia de `docs/CREDENTIALS.md`.
  - Si esa estrategia figura **Sin definir**, preguntarla con una recomendación según las respuestas: **4. Usuarios creados por API** si la app permite dar de alta usuarios con un rol; si no, **3. Gestor de secretos** si la organización ya usa uno, **1. Contraseñas versionadas** si son cuentas exclusivas de un ambiente de pruebas en un repo privado, o **2. Secreto del CI** en el resto de los casos. Anotarla en `docs/CREDENTIALS.md` y crear `data/credentials.ts` (o la factory, si es la 4) con el ejemplo de esa estrategia.
  - Si la pantalla requiere sesión: el rol (`session` del escenario) y si el login se puede automatizar o tiene MFA, SSO externo o captcha. Confirmado el usuario, preparar la sesión para explorar según `e2e-playwright/SKILL.md` antes de la ronda 4: si no existe `tests/auth/<rol>.setup.ts`, escribirlo y correr `pnpm auth`.
- Entidades que deben existir antes de empezar (pedidos, productos, configuraciones) y feature flags.
- Si el test modifica datos, cómo se limpian o cómo se aísla para correr en paralelo.

### 4. Pasos

- Recorrer el flujo acción por acción: qué hace el usuario, sobre qué elemento y con qué dato.
- Para cada elemento, el identificador más estable disponible: rol + nombre accesible, label, texto visible o test id. Confirmarlo en la app real.
- Separar la navegación hasta la pantalla, que va a **Acceso a la pantalla** y no se verifica, de los pasos del escenario.
- Marcar cada paso que recibe una entrada: alimenta el set de datos de la ronda 7.

### 5. Resultado esperado

- Qué se verifica y con qué valor exacto: URL, textos, mensajes, cantidades, estado de botones, datos persistidos al recargar.
- Qué no debe pasar (errores en consola, requests fallidos), si importa.

### 6. Casos negativos y bordes

- Datos inválidos, campos vacíos, permisos insuficientes, límites, sesión expirada.
- Cuáles se automatizan ahora (cada uno como fila del set de datos o como test separado) y cuáles quedan fuera.

### 7. Set de datos

**Cuándo pedirlo.** Recién cuando estén definidos los pasos con sus entradas (ronda 4) y los casos a cubrir (ronda 6). Antes no se sabe qué campos llevan datos ni cuántas filas hacen falta. Volver a esta ronda cada vez que aparezca en la conversación:

- un campo de entrada nuevo en un paso;
- una entidad que debe existir como precondición;
- un usuario o rol adicional;
- un archivo para subir o descargar;
- una fecha u hora que influye en el resultado;
- el mismo flujo con varias combinaciones de entradas (test parametrizado).

**Qué pedir**, por cada caso:

- valores de cada entrada (válidos, inválidos y límites, según el caso);
- resultado esperado exacto;
- origen del dato: **fijo** (versionado en el repo), **generado** en el test (único por ejecución, por ejemplo un email con sufijo), **creado por API** antes del test, **existente** en el ambiente o **secreto** (contraseña, token o clave de API: solo el nombre de la variable de entorno).

**Cómo pedirlo.** Proponer una tabla con valores de ejemplo marcados "(propuesto)", derivados de lo observado en la app, y pedir que la confirme o la reemplace. La persona puede pegar una tabla, un CSV o un JSON; normalizarlo a la tabla del escenario.

**Reglas.**

- No inventar datos de negocio: lo no confirmado queda "(propuesto)" o va a Preguntas abiertas.
- Variables de entorno solo para secretos: tokens, claves de API y, si la estrategia de `docs/CREDENTIALS.md` lo define, contraseñas. Nunca para datos del set (emails, nombres de usuario, textos, montos, resultados esperados): esos van en el archivo de datos. Para datos personales, usar valores ficticios o generados.
- Si un caso depende de datos que crea otro test, señalar el acoplamiento y proponer crearlos por API o generarlos en el propio test.
- Si los datos existentes en el ambiente pueden cambiar o agotarse (stock, cupos), preguntar cómo se reponen.

**Dónde se guarda.** Al cerrar, el set de datos se escribe como código para que los tests lo importen, siguiendo `playwright-best-practices/core/test-data.md`:

| Origen | Dónde y cómo |
| --- | --- |
| Usuario | `data/users.ts`, catálogo compartido por todos los escenarios: una entrada por usuario con clave por rol, email, rol y permisos, sin contraseña. El caso guarda solo la clave (`user: 'admin'`) |
| Fijo | `data/<id>.ts` (id en minúsculas, por ejemplo `data/sc-003.ts`): una interfaz del caso y un array tipado, una entrada por fila de la tabla |
| Contraseña de un usuario | `passwordOf('<clave>')` de `data/credentials.ts`, según `docs/CREDENTIALS.md`. Nunca en el catálogo ni en el caso |
| Otro secreto (token, clave de API) | En el mismo archivo, `process.env.<VARIABLE> ?? ''`, y la línea `<VARIABLE>=` sin valor en `.env.example` |
| Generado | Una factory en `factories/<entidad>.factory.ts` (por ejemplo `createUser()` con un sufijo único por ejecución); el caso guarda solo lo que no varía |
| Creado por API | En el caso, el payload o los campos con los que se crea; la creación y la limpieza las implementa `/new-e2e-test` en un fixture |
| Existente | Una constante con el identificador (email, código) y un comentario con el ambiente donde existe |

Ejemplo del catálogo `data/users.ts`:

```ts
// Test users shared by every scenario
export interface TestUser {
  email: string;
  role: string;
  permissions: string[];
}

export const users = {
  admin: { email: 'admin@qa.example.com', role: 'admin', permissions: ['users:write', 'billing:read'] },
  viewer: { email: 'viewer@qa.example.com', role: 'viewer', permissions: ['users:read'] },
} satisfies Record<string, TestUser>;

export type UserKey = keyof typeof users;
```

Ejemplo de `data/sc-003.ts`:

```ts
// Data set for scenarios/SC-003-login.md
import type { UserKey } from './users';

export interface LoginCase {
  name: string;
  user: UserKey;
  // Only for negative cases; otherwise the test uses passwordOf(user).
  password?: string;
  expectedError?: string;
}

export const loginCases: LoginCase[] = [
  { name: 'admin signs in', user: 'admin' },
  { name: 'wrong password', user: 'admin', password: 'wrong-password', expectedError: 'Invalid credentials' },
];
```

Nombres de casos y propiedades en inglés; los textos que se verifican en la app, tal cual aparecen. Un archivo por escenario: no reutilizar ni modificar el set de datos de otro escenario. La excepción es el catálogo de usuarios (`data/users.ts`), que comparten todos: agregar los usuarios que falten y no cambiar ni borrar uno existente sin confirmarlo, porque otros escenarios lo usan (buscar sus referencias antes).

### 8. Decisiones técnicas según buenas prácticas

Según lo que hace el escenario, leer la referencia de `playwright-best-practices` indicada y hacer las preguntas que correspondan. Saltear las filas que no apliquen.

| Si el escenario... | Leer (en `playwright-best-practices/`) | Preguntar |
| --- | --- | --- |
| Siempre | `core/locators.md`, `core/test-tags.md` | Elementos sin rol, label ni test id: ¿desarrollo puede agregar uno? ¿Qué atributo usa la app (`data-testid`, `data-test`, `data-qa`)? Si no es `data-testid`, configurar `testIdAttribute` en `playwright.config.ts`. Tags adicionales (`@smoke`, por módulo) |
| Necesita sesión iniciada | `advanced/authentication.md`, `advanced/authentication-flows.md` | ¿Se reutiliza la sesión con `storageState`? ¿Hay MFA o SSO? ¿Un usuario por worker en paralelo? |
| Crea o modifica datos | `core/test-data.md`, `core/fixtures-hooks.md` | ¿Hay API para crear y limpiar? ¿Cómo se evita que tests en paralelo compartan datos? |
| Depende de servicios externos (pagos, email, OAuth) | `architecture/when-to-mock.md`, `advanced/third-party.md` | ¿Sandbox real o respuesta simulada? ¿Qué se valida del servicio? |
| Espera cargas, requests o datos asíncronos | `core/assertions-waiting.md`, `advanced/network-advanced.md` | ¿Qué request o elemento indica que la pantalla terminó? ¿Se simula alguna respuesta? |
| Depende de fecha u hora | `advanced/clock-mocking.md` | ¿Fecha y zona horaria fijas para el test? |
| Sube o descarga archivos | `testing-patterns/file-upload-download.md` | ¿Qué archivo de prueba? ¿Se valida el contenido descargado? |
| Abre pestañas, popups o iframes | `advanced/multi-context.md`, `browser-apis/iframes.md` | ¿Qué se valida en la ventana o frame nuevo? |
| Involucra varios usuarios a la vez | `advanced/multi-user.md` | ¿Qué usuarios y en qué orden actúan? |
| Tiene formularios con validaciones | `testing-patterns/forms-validation.md` | Mensaje exacto de cada regla de validación |
| Debe verse en mobile o en varios tamaños | `advanced/mobile-testing.md` | ¿Qué dispositivos o viewports? |
| Tiene requisitos de accesibilidad | `testing-patterns/accessibility.md` | ¿Se agrega chequeo con axe? (suma una dependencia) |
| Tiene comportamiento visual crítico | `testing-patterns/visual-regression.md` | ¿Hace falta comparación de capturas? |

Registrar las decisiones en **Dependencias técnicas** del escenario. Si aparece un bloqueo para automatizar (captcha, 2FA sin bypass, SSO externo), acordar cómo evitarlo en el ambiente de pruebas o dejarlo como pregunta abierta.

### 9. Restricciones

- Lo que el test no debe hacer (pagos reales, envíos a clientes, borrar datos compartidos).
- Datos sensibles que no deben aparecer en logs, capturas ni reportes.

## Cierre

1. Mostrar un resumen del escenario, con el set de datos completo y la lista de archivos que se van a escribir, y pedir confirmación explícita de que refleja lo acordado. No escribir nada hasta recibirla.
2. Escribir `scenarios/<ID>-<slug>.md` completando todas las secciones de la plantilla, con `base_url`, `target_path`, `session` y `data_file`.
3. Escribir el set de datos y agregar al catálogo los usuarios nuevos, según **Dónde se guarda** (ronda 7).
4. Si `APP_URL` en `playwright.config.ts` está vacío, escribir ahí la URL confirmada.
5. Agregar a `.env.example` el nombre de cada variable secreta nueva, sin valor.
6. Correr `pnpm typecheck` y `pnpm lint` para validar los archivos de datos, y corregir lo que falle.
7. Indicar el siguiente paso: `/new-e2e-test` (el comando pide elegir el escenario).
