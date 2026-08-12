# Architettura

## Stack

- **Angular 20**, componenti standalone (niente NgModules).
- **Signals** per lo state.
- **SCSS** per lo styling - **niente Tailwind**.
- **FontAwesome** tramite `@fortawesome/angular-fontawesome`.
- **`@ngx-translate`** per l'i18n.
- Costruito con il builder `@angular/build:application`; **Bun** come gestore di
  pacchetti.

## Struttura

Il codice sorgente dell'applicazione si trova in [`src/app/`](../src/app):

- `app.ts`, `app.config.ts`, `app.routes.ts` - componente root, provider, routing.
- `app.config.server.ts`, `app.routes.server.ts` - configurazione per il server-side
  rendering.
- `components/` - elementi UI riutilizzabili (`hero`, `features`, `faq`, `screenshots`,
  `download`, `navigation`, `footer`, `legal`, `language-switcher`, `theme-toggle`).
- `pages/` - view instradate (`home`, `not-found`).
- `services/` - servizi singleton (`language`, `theme`).

## Convenzioni di codice Angular 20

Queste convenzioni sono obbligatorie per tutti i contributi.

### Componenti

- Solo componenti standalone. **Non impostare** `standalone: true` nei decoratori -
  è il valore predefinito.
- Usa le funzioni `input()` / `output()` invece dei decoratori `@Input()` / `@Output()`.
- Imposta `changeDetection: ChangeDetectionStrategy.OnPush`.
- Mantieni i componenti piccoli e con una singola responsabilità; per i componenti
  piccoli preferisci i template inline.
- Preferisci i **Reactive Forms** ai form template-driven.
- Metti gli host binding nell'oggetto `host` del decoratore - **non usare**
  `@HostBinding` / `@HostListener`.
- Usa i binding `class` e `style` - **non** `ngClass` / `ngStyle`.
- Usa `NgOptimizedImage` per le immagini statiche (nota: non funziona con le
  immagini base64 inline).
- Implementa il lazy loading per le route delle feature.

### State

- Usa i **signals** per lo state locale dei componenti e `computed()` per lo state
  derivato.
- **Non** usare `mutate` sui signals - usa `update` o `set`.
- Mantieni le trasformazioni dello state pure e prevedibili.

### Template

- Usa il control flow nativo (`@if`, `@for`, `@switch`) - non `*ngIf` / `*ngFor` /
  `*ngSwitch`.
- Usa la pipe `async` per gli observable. Mantieni i template privi di logica
  complessa.

### Servizi

- Singola responsabilità; `providedIn: 'root'` per i singleton.
- Usa la funzione `inject()` invece della dependency injection nel costruttore.

### TypeScript

- Controllo dei tipi rigoroso. Preferisci l'inferenza dei tipi quando è evidente.
- Evita `any`; usa `unknown` quando il tipo non è certo.

## Vedi anche

- [Ambiente di sviluppo](setup/development.md)
- [Contributing](contributing.md)
