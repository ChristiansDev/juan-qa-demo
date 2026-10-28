# Credenciales de los usuarios de prueba

Cada producto resuelve las contraseñas de prueba de forma distinta, así que este proyecto separa dos cosas:

- **Quién es cada usuario** (email, rol, permisos): siempre en el catálogo `data/users.ts`, sin contraseñas.
- **Cómo se obtiene su contraseña**: en `data/credentials.ts`, con la función `passwordOf(user)`. Los tests, los logins de `tests/auth/` y los sets de datos la usan siempre; cambiar de estrategia solo cambia ese archivo.

## Estrategia elegida

**Sin definir.** `/new-e2e-scenario` la pregunta la primera vez que un escenario necesita un usuario y la anota acá.

<!-- Reemplazar por la estrategia elegida, por ejemplo: "2. Un secreto con todas las contraseñas (E2E_USERS)". -->

## Opciones

| Estrategia | Cuándo conviene |
| --- | --- |
| 1. Contraseñas versionadas | Usuarios fijos y compartidos, exclusivos de un ambiente de pruebas, en un repo privado |
| 2. Secreto del CI | Usuarios fijos, pero la organización no quiere contraseñas en git |
| 3. Gestor de secretos | La organización ya usa uno (Azure Key Vault, HashiCorp Vault, AWS Secrets Manager) |
| 4. Usuarios creados por API | La app permite dar de alta usuarios con un rol: es la opción más robusta, sin contraseñas fijas |

### 1. Contraseñas versionadas

```ts
// data/credentials.ts
import type { UserKey } from './users';

const passwords: Record<UserKey, string> = {
  admin: 'Admin-Test-1',
  viewer: 'Viewer-Test-1',
};

export const passwordOf = (user: UserKey): string => passwords[user];
```

### 2. Secreto del CI

Un solo secreto, `E2E_USERS`, con un JSON `{ "admin": "...", "viewer": "..." }`. Se define en `.env` (no versionado), en los secretos del CI y en las `envVars` del Hub.

```ts
// data/credentials.ts
import type { UserKey } from './users';

const passwords = JSON.parse(process.env.E2E_USERS ?? '{}') as Partial<Record<UserKey, string>>;

export function passwordOf(user: UserKey): string {
  const password = passwords[user];
  if (!password) throw new Error(`Missing password for "${user}" in E2E_USERS`);
  return password;
}
```

Si el equipo prefiere una variable por usuario, leer `process.env[`E2E_PASSWORD_${user.toUpperCase()}`]` con el mismo control.

### 3. Gestor de secretos

Igual que la estrategia 2, pero `E2E_USERS` lo completa un paso previo que lee el gestor (por ejemplo `az keyvault secret show` en el pipeline, o un script del equipo que escribe `.env` en local). `data/credentials.ts` queda como en la estrategia 2; documentar acá el comando que trae el secreto.

### 4. Usuarios creados por API

El catálogo guarda los roles y permisos que se necesitan, y cada test o login de `tests/auth/` crea su usuario con una contraseña generada:

```ts
// factories/user.factory.ts
import type { APIRequestContext } from '@playwright/test';
import { users, type UserKey } from '../data/users';

export async function createUser(request: APIRequestContext, role: UserKey) {
  const user = {
    email: `${role}-${Date.now()}@qa.example.com`,
    password: `Pw-${crypto.randomUUID()}`,
    role: users[role].role,
  };
  await request.post('/api/users', { data: user });
  return user;
}
```

El token o la clave de API que autoriza el alta, si hace falta, es el único secreto: va en una variable de entorno.

## Reglas

- Ninguna estrategia guarda contraseñas en el catálogo, en un set de datos ni en un test: siempre `passwordOf()` o la factory.
- Las variables de entorno son solo para secretos, nunca para otros datos de prueba.
- Al cambiar de estrategia, actualizar esta página, `data/credentials.ts` y, si cambian variables, `.env.example` y los secretos del CI.
