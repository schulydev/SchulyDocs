# Architektur

Auf dieser Seite findest du dich im Code der Site zurecht und siehst ihre Coding-Konventionen.

## Stack

- Angular 20 mit Standalone Components, ohne NgModules
- Signals für den Zustand
- SCSS fürs Styling, kein Tailwind
- FontAwesome über `@fortawesome/angular-fontawesome`
- `@ngx-translate` für Übersetzungen
- Der Builder `@angular/build:application`, mit Bun als Package Manager

## Aufbau

Der Quellcode liegt in [`src/app/`](https://github.com/schulydev/SchulyWebsite/tree/main/src/app):

- `app.ts`, `app.config.ts`, `app.routes.ts`: Root-Komponente, Provider, Routing.
- `app.config.server.ts`, `app.routes.server.ts`: Einstellungen für Server-Rendering und Prerendering.
- `components/`: UI-Teile (`hero`, `features`, `faq`, `screenshots`, `download`, `navigation`,
  `footer`, `legal`, `language-switcher`).
- `pages/`: geroutete Ansichten (`home`, `not-found`).
- `services/`: `language`, `lang.resolver`, `seo`.

Ausserhalb von `src/app/`:

- `public/i18n/`: eine Übersetzungsdatei pro Sprache, einschliesslich der Seitenmetadaten `meta.*`.
- `public/_redirects`, `public/_headers`: Redirects und Header für Cloudflare Pages.
- `functions/index.js`: eine Cloudflare Pages Function nur für `/`.
- `scripts/postbuild.ts`: läuft nach `ng build`.

## Routen und Sprachen

Jede Seite hat ein Sprachpräfix: `en`, `de`, `fr`, `it` oder `rm`. Englisch ist der Standard.

| Route | Seite |
| --- | --- |
| `/<lang>` | Startseite |
| `/<lang>/impressum` | Impressum |
| `/<lang>/privacy` | Datenschutz |
| `/<lang>/terms` | Nutzungsbedingungen |
| `/404` und jeder andere Pfad | Nicht gefunden |

- `app.routes.ts` erzeugt die Routen für jede Sprache. `langResolver` setzt die aktive Sprache und wartet auf ihre
  Übersetzungen. So wird jede Route in ihrer eigenen Sprache vorgerendert.
- Der Build nutzt `outputMode: static`. `app.routes.server.ts` listet die Routen und Sprachen zum Vorrendern auf.
- `services/seo.ts` setzt beim Vorrendern Titel, Beschreibung, kanonische URL, Social Tags und `hreflang`-Alternativen jeder
  Route.
- `functions/index.js` leitet `/` anhand von `Accept-Language` zu einer Sprache weiter. `public/_redirects` schickt `/` als
  Fallback nach `/en` und die alten Pfade ohne Präfix zu ihren `/en`-Versionen.
- `scripts/postbuild.ts` schreibt `404.html` und `sitemap.xml` und entfernt das `index.html` im Root. Wenn du eine Sprache
  oder eine Seite hinzufügst, aktualisiere `LANGS` oder `PAGES` in diesem Skript.

## Angular-20-Coding-Konventionen {#angular-20-coding-conventions}

Alle Beiträge folgen diesen Konventionen.

### Komponenten

- Nutze nur Standalone Components. Setze `standalone: true` nicht in Decorators, weil es der Standard ist.
- Nutze die Funktionen `input()` und `output()` statt der Decorators `@Input()` und `@Output()`.
- Setze `changeDetection: ChangeDetectionStrategy.OnPush`.
- Halte Komponenten klein, mit einer Verantwortung. Bevorzuge Inline-Templates bei kleinen Komponenten.
- Bevorzuge Reactive Forms gegenüber Template-Driven Forms.
- Lege Host-Bindings im `host`-Objekt des Decorators ab. Nutze nicht `@HostBinding` oder `@HostListener`.
- Nutze `class`- und `style`-Bindings, nicht `ngClass` oder `ngStyle`.
- Nutze `NgOptimizedImage` für statische Bilder. Es funktioniert nicht für Inline-Base64-Bilder.
- Lade Feature-Routen per Lazy Loading.

### Zustand

- Nutze Signals für lokalen Komponentenzustand und `computed()` für abgeleiteten Zustand.
- Nutze `update` oder `set` auf Signals, nicht `mutate`.
- Halte Zustandsänderungen rein und vorhersehbar.

### Templates

- Nutze den nativen Control Flow (`@if`, `@for`, `@switch`), nicht `*ngIf`, `*ngFor` oder `*ngSwitch`.
- Nutze die `async`-Pipe für Observables. Halte komplexe Logik aus Templates heraus.

### Services

- Gib jedem Service eine Verantwortung, und nutze `providedIn: 'root'` für Singletons.
- Nutze die Funktion `inject()` statt Constructor Injection.

### TypeScript

- Nutze strikte Typprüfung. Bevorzuge Typinferenz, wenn der Typ offensichtlich ist.
- Vermeide `any`. Nutze `unknown`, wenn der Typ unsicher ist.
