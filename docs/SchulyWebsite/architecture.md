# Architecture

## Stack

- **Angular 20**, standalone components (no NgModules).
- **Signals** for state.
- **SCSS** for styling — **no Tailwind**.
- **FontAwesome** via `@fortawesome/angular-fontawesome`.
- **`@ngx-translate`** for i18n.
- Built with the `@angular/build:application` builder; **Bun** as package manager.

## Layout

Application source lives under [`src/app/`](../src/app):

- `app.ts`, `app.config.ts`, `app.routes.ts` — root component, providers, routing.
- `app.config.server.ts`, `app.routes.server.ts` — server-side rendering config.
- `components/` — reusable UI pieces (`hero`, `features`, `faq`, `screenshots`,
  `download`, `navigation`, `footer`, `legal`, `language-switcher`, `theme-toggle`).
- `pages/` — routed views (`home`, `not-found`).
- `services/` — singleton services (`language`, `theme`).

## Angular 20 coding conventions

These conventions are enforced for all contributions.

### Components

- Standalone components only. **Do not** set `standalone: true` in decorators — it
  is the default.
- Use `input()` / `output()` functions instead of `@Input()` / `@Output()` decorators.
- Set `changeDetection: ChangeDetectionStrategy.OnPush`.
- Keep components small and single-responsibility; prefer inline templates for small ones.
- Prefer **Reactive forms** over template-driven forms.
- Put host bindings in the `host` object of the decorator — **do not** use
  `@HostBinding` / `@HostListener`.
- Use `class` and `style` bindings — **not** `ngClass` / `ngStyle`.
- Use `NgOptimizedImage` for static images (note: it does not work for inline
  base64 images).
- Implement lazy loading for feature routes.

### State

- Use **signals** for local component state and `computed()` for derived state.
- Do **not** use `mutate` on signals — use `update` or `set`.
- Keep state transformations pure and predictable.

### Templates

- Use native control flow (`@if`, `@for`, `@switch`) — not `*ngIf` / `*ngFor` / `*ngSwitch`.
- Use the `async` pipe for observables. Keep templates free of complex logic.

### Services

- Single responsibility; `providedIn: 'root'` for singletons.
- Use the `inject()` function instead of constructor injection.

### TypeScript

- Strict type checking. Prefer type inference when obvious.
- Avoid `any`; use `unknown` when the type is uncertain.

## Related

- [Development setup](setup/development.md)
- [Contributing](contributing.md)
