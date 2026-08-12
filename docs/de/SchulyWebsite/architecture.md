# Architektur

## Stack

- **Angular 20**, Standalone-Komponenten (keine NgModules).
- **Signals** für State.
- **SCSS** fürs Styling - **kein Tailwind**.
- **FontAwesome** über `@fortawesome/angular-fontawesome`.
- **`@ngx-translate`** für i18n.
- Gebaut mit dem `@angular/build:application`-Builder; **Bun** als Paketmanager.

## Aufbau

Der Anwendungscode liegt unter [`src/app/`](../src/app):

- `app.ts`, `app.config.ts`, `app.routes.ts` - Root-Komponente, Provider, Routing.
- `app.config.server.ts`, `app.routes.server.ts` - Konfiguration für Server-Side Rendering.
- `components/` - wiederverwendbare UI-Bausteine (`hero`, `features`, `faq`, `screenshots`,
  `download`, `navigation`, `footer`, `legal`, `language-switcher`, `theme-toggle`).
- `pages/` - geroutete Views (`home`, `not-found`).
- `services/` - Singleton-Services (`language`, `theme`).

## Angular-20-Coding-Konventionen

Diese Konventionen gelten verbindlich für alle Beiträge.

### Komponenten

- Nur Standalone-Komponenten. **Setze nicht** `standalone: true` in Decorators - das
  ist der Default.
- Verwende die Funktionen `input()` / `output()` statt der Decorators `@Input()` / `@Output()`.
- Setze `changeDetection: ChangeDetectionStrategy.OnPush`.
- Halte Komponenten klein und mit einer einzigen Verantwortung; bevorzuge bei kleinen
  Komponenten Inline-Templates.
- Bevorzuge **Reactive Forms** gegenüber Template-Driven Forms.
- Platziere Host-Bindings im `host`-Objekt des Decorators - **verwende nicht**
  `@HostBinding` / `@HostListener`.
- Verwende `class`- und `style`-Bindings - **nicht** `ngClass` / `ngStyle`.
- Verwende `NgOptimizedImage` für statische Bilder (Hinweis: funktioniert nicht bei
  eingebetteten Base64-Bildern).
- Implementiere Lazy Loading für Feature-Routes.

### State

- Verwende **Signals** für lokalen Komponenten-State und `computed()` für abgeleiteten
  State.
- Verwende bei Signals **nicht** `mutate` - nutze `update` oder `set`.
- Halte State-Transformationen pur und vorhersehbar.

### Templates

- Verwende die nativen Control-Flow-Syntaxen (`@if`, `@for`, `@switch`) - nicht
  `*ngIf` / `*ngFor` / `*ngSwitch`.
- Verwende die `async`-Pipe für Observables. Halte Templates frei von komplexer Logik.

### Services

- Single Responsibility; `providedIn: 'root'` für Singletons.
- Verwende die Funktion `inject()` statt Constructor Injection.

### TypeScript

- Strikte Typüberprüfung. Bevorzuge Typinferenz, wenn sie eindeutig ist.
- Vermeide `any`; verwende `unknown`, wenn der Typ unklar ist.

## Siehe auch

- [Entwicklungsumgebung](setup/development.md)
- [Contributing](contributing.md)
