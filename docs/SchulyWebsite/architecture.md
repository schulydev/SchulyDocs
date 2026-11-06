# Architecture

Use this page to find your way around the site's code and to follow its coding conventions.

## Stack

- Angular 20 with standalone components, no NgModules
- Signals for state
- SCSS for styling, no Tailwind
- FontAwesome through `@fortawesome/angular-fontawesome`
- `@ngx-translate` for translations
- The `@angular/build:application` builder, with Bun as the package manager

## Layout

The source is in [`src/app/`](https://github.com/schulydev/SchulyWebsite/tree/main/src/app):

- `app.ts`, `app.config.ts`, `app.routes.ts`: root component, providers, routing.
- `app.config.server.ts`, `app.routes.server.ts`: server rendering and prerender settings.
- `components/`: UI pieces (`hero`, `features`, `faq`, `screenshots`, `download`, `navigation`,
  `footer`, `legal`, `language-switcher`).
- `pages/`: routed views (`home`, `not-found`).
- `services/`: `language`, `lang.resolver`, `seo`.

Outside `src/app/`:

- `public/i18n/`: one translation file per language, including the `meta.*` page metadata.
- `public/_redirects`, `public/_headers`: Cloudflare Pages redirects and headers.
- `functions/index.js`: a Cloudflare Pages Function for `/` only.
- `scripts/postbuild.ts`: runs after `ng build`.

## Routes and languages

Every page has a language prefix: `de`, `gsw`, `fr`, `it`, `rm`, or `en`. German is the default; Swiss German
is only used when chosen in the menu.

| Route | Page |
| --- | --- |
| `/<lang>` | Home |
| `/<lang>/impressum` | Impressum |
| `/<lang>/privacy` | Privacy |
| `/<lang>/terms` | Terms |
| Any other path | Not found (404, `noindex`) |

- `app.routes.ts` generates the routes for each language. `langResolver` sets the active language and
  waits for its translations, so each route prerenders in its own language.
- The build uses `outputMode: static`. `app.routes.server.ts` lists the routes and languages to
  prerender.
- `services/seo.ts` sets each route's title, description, canonical URL, social tags, and `hreflang`
  alternates when it prerenders.
- `functions/index.js` redirects `/` to a language based on `Accept-Language`. `public/_redirects`
  sends `/` to `/de` as a fallback and sends the old unprefixed paths to their `/de` versions. On
  `*.pages.dev` hosts, `public/_headers` and the function add `X-Robots-Tag: noindex`.
- `scripts/postbuild.ts` writes `404.html` (and removes the `/404` route), writes `sitemap.xml`, removes
  the root `index.html`, and turns `<lang><path>/index.html` into `<lang><path>.html`. Cloudflare Pages
  serves `de.html` at `/de` with 200, so the slash-less canonical URLs need no redirect. When
  you add a language or a page, update `LANGS` or `PAGES` in that script.

## Angular 20 coding conventions

All contributions follow these conventions.

### Components

- Use standalone components only. Don't set `standalone: true` in decorators, because it's the
  default.
- Use the `input()` and `output()` functions instead of the `@Input()` and `@Output()` decorators.
- Set `changeDetection: ChangeDetectionStrategy.OnPush`.
- Keep components small, with one responsibility. Prefer inline templates for small components.
- Prefer reactive forms over template-driven forms.
- Put host bindings in the decorator's `host` object. Don't use `@HostBinding` or `@HostListener`.
- Use `class` and `style` bindings, not `ngClass` or `ngStyle`.
- Use `NgOptimizedImage` for static images. It doesn't work for inline base64 images.
- Lazy load feature routes.

### State

- Use signals for local component state and `computed()` for derived state.
- Use `update` or `set` on signals, not `mutate`.
- Keep state transformations pure and predictable.

### Templates

- Use native control flow (`@if`, `@for`, `@switch`), not `*ngIf`, `*ngFor`, or `*ngSwitch`.
- Use the `async` pipe for observables. Keep complex logic out of templates.

### Services

- Give each service one responsibility, and use `providedIn: 'root'` for singletons.
- Use the `inject()` function instead of constructor injection.

### TypeScript

- Use strict type checking. Prefer type inference when the type is obvious.
- Avoid `any`. Use `unknown` when the type is uncertain.
