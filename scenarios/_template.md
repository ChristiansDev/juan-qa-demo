---
id: SC-000
title: Título corto del escenario
base_url: https://app.example.com
target_path: /ruta-de-la-pantalla
session: admin
data_file: data/sc-000.ts
tags: [regression]
priority: media
source: Historia, ticket o caso del Hub de origen (opcional)
---

## Objetivo

Qué comportamiento valida el test y por qué importa (criterio de aceptación).

## Entorno

- URL de la app: la de `base_url`, escrita completa. Es la misma que `APP_URL` en `playwright.config.ts`.
- Otros ambientes donde debe correr (staging, dev) y su URL completa, si aplica.
- Navegador y viewport, si no es el escritorio por defecto.
- Requisitos de red (VPN, red interna), idioma o zona horaria, si aplican.

## Acceso a la pantalla

- Pantalla a automatizar: `target_path`.
- Sesión: rol del catálogo de usuarios en `session` (o `none` si la pantalla es pública).
- Cómo se llega: por URL directa con la sesión ya iniciada, o navegando desde otra pantalla. Si es navegando, listar los pasos acá: solo llevan a la pantalla y no se verifican.

## Precondiciones y datos

- Usuario: su clave en el catálogo `data/users.ts` (rol y permisos), y cómo obtiene la sesión (formulario, API, cookie o token).
- Datos que deben existir antes, y cómo se crean (API, seed, ya existentes).
- Feature flags o configuración necesaria.
- Limpieza al terminar, si el test deja datos.

## Pasos

| # | Acción | Elemento (texto visible, label, rol o test id) | Dato |
| --- | --- | --- | --- |
| 1 | Abrir | Pantalla a automatizar | `target_path` |
| 2 | Escribir | Campo "Email" | email del caso |

## Resultado esperado

- Verificaciones concretas: URL, textos exactos, valores, cantidad de elementos, estado persistido.

## Casos negativos y bordes

- Variantes a cubrir en tests separados (datos inválidos, permisos, vacíos, límites).

## Set de datos

Una fila por caso que se va a automatizar. Si el mismo flujo se repite con distintas entradas, el test se parametriza con estos casos.

| Caso | Entradas | Resultado esperado | Origen de los datos |
| --- | --- | --- | --- |
| válido | usuario: `admin` (catálogo) | Se muestra el panel principal | Catálogo de usuarios |
| contraseña incorrecta | usuario: `admin` (catálogo), contraseña: `wrong-password` (propuesto) | Mensaje "Invalid credentials" | Fijo |

Origen posible: **fijo** (versionado en el repo), **generado** en el test (único por ejecución), **creado por API** antes del test, **existente** en el ambiente, o **secreto** (tokens o claves de API: se anota el nombre de la variable de entorno, nunca el valor). Las contraseñas de los usuarios no van en esta tabla: las resuelve `passwordOf()` según `docs/CREDENTIALS.md`. El resto de los datos, incluidos emails y nombres de usuario, va en el archivo de datos; nunca en variables de entorno. Los valores propuestos por el agente y no confirmados se marcan con "(propuesto)".

Archivo de datos: el indicado en `data_file`. Lo genera `/new-e2e-scenario` a partir de esta tabla, y el test lo importa en lugar de repetir los valores.

## Dependencias técnicas

- Llamadas de red a esperar o interceptar, servicios externos a simular (pagos, email).
- Comportamientos asíncronos, iframes, pestañas nuevas, descargas o subida de archivos.

## Restricciones

- Lo que el test no debe hacer (ej.: no ejecutar pagos reales) y bloqueos conocidos (captcha, 2FA).

## Preguntas abiertas

- Lo que falta confirmar antes o durante la implementación.
