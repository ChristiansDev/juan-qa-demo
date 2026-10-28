# Arquitectura: Page Object Model (POM)

Cada página de la aplicación se modela como una clase que expone **locators** y **acciones de usuario**. Los tests orquestan esas acciones y hacen las **aserciones**.

## Estructura

```text
pages/        Una clase por página: locators + acciones (sin aserciones)
tests/        Escenarios ejecutables y aserciones
data/         Set de datos de cada escenario (data/<id>.ts)
factories/    Generadores de datos únicos por ejecución (se crean cuando hacen falta)
scenarios/    Escenarios en lenguaje natural (contrato con el Hub)
```

## Reglas

- Un page object solo conoce su página. Si una acción termina en otra página, el test crea el page object siguiente.
- Los locators se declaran en el constructor y priorizan `getByRole`, `getByLabel`, `getByPlaceholder` y `getByTestId`.
- Las aserciones (`expect`) viven en los tests, no en los page objects.
- Los métodos de acción son `async`, describen intención (`login`, `addToCart`) y no devuelven valores intermedios innecesarios.

## Ejemplo

El esqueleto no trae page objects: se crean con cada escenario. Uno típico y el test que lo usa:

```ts
// pages/LoginPage.ts
import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Sign in' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login({ email, password }: { email: string; password: string }) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
```

```ts
// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginCases } from '../data/sc-003';
import { users } from '../data/users';
import { passwordOf } from '../data/credentials';

for (const loginCase of loginCases) {
  test(`user logs in: ${loginCase.name}`, { tag: ['@SC-003', '@smoke'] }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login({
      email: users[loginCase.user].email,
      password: loginCase.password ?? passwordOf(loginCase.user),
    });
    await expect(page).toHaveURL(/dashboard/);
  });
}
```

## Cuándo crecer

Agregar capas solo cuando duela su ausencia:

- **Fixtures** (`test.extend`) cuando instanciar page objects en cada test se vuelva repetitivo.
- **`storageState`** cuando el login por UI encarezca la suite; reservar un test que cubra el login real.
- **Componentes** (`components/`) cuando un widget (tabla, modal) se repita en varias páginas.
- **Helpers de API** para crear y limpiar datos sin pasar por la UI.

Si los page objects crecen demasiado o se cruzan muchos flujos entre páginas, considerar el patrón Screenplay.
