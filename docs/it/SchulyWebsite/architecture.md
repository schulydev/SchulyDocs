# Architettura

Usa questa pagina per orientarti nel codice del sito e per seguire le sue convenzioni di codice.

## Stack

- Angular 20 con componenti standalone, senza NgModules
- Signal per lo stato
- SCSS per gli stili, senza Tailwind
- FontAwesome tramite `@fortawesome/angular-fontawesome`
- `@ngx-translate` per le traduzioni
- Il builder `@angular/build:application`, con Bun come gestore di pacchetti

## Struttura

Il codice sorgente è in [`src/app/`](https://github.com/schulydev/SchulyWebsite/tree/main/src/app):

- `app.ts`, `app.config.ts`, `app.routes.ts`: componente radice, provider, routing.
- `app.config.server.ts`, `app.routes.server.ts`: impostazioni di server rendering e prerendering.
- `components/`: elementi dell'interfaccia (`hero`, `features`, `faq`, `screenshots`, `download`, `navigation`,
  `footer`, `legal`, `language-switcher`).
- `pages/`: viste con route (`home`, `not-found`).
- `services/`: `language`, `lang.resolver`, `seo`.

Fuori da `src/app/`:

- `public/i18n/`: un file di traduzione per lingua, inclusi i metadati di pagina `meta.*`.
- `public/_redirects`, `public/_headers`: reindirizzamenti e header di Cloudflare Pages.
- `functions/index.js`: una Pages Function di Cloudflare solo per `/`.
- `scripts/postbuild.ts`: viene eseguito dopo `ng build`.

## Route e lingue

Ogni pagina ha un prefisso di lingua: `en`, `de`, `fr`, `it` o `rm`. L'inglese è la lingua predefinita.

| Route | Pagina |
| --- | --- |
| `/<lang>` | Home |
| `/<lang>/impressum` | Impressum |
| `/<lang>/privacy` | Privacy |
| `/<lang>/terms` | Condizioni |
| `/404` e qualsiasi altro percorso | Non trovata |

- `app.routes.ts` genera le route per ogni lingua. `langResolver` imposta la lingua attiva e
  attende le sue traduzioni, così ogni route viene prerenderizzata nella propria lingua.
- La build usa `outputMode: static`. `app.routes.server.ts` elenca le route e le lingue da
  prerenderizzare.
- `services/seo.ts` imposta il titolo, la descrizione, l'URL canonico, i tag social e le alternative `hreflang` di ogni route
  durante il prerendering.
- `functions/index.js` reindirizza `/` a una lingua in base a `Accept-Language`. `public/_redirects`
  manda `/` a `/en` come fallback e manda i vecchi percorsi senza prefisso alle loro versioni `/en`.
- `scripts/postbuild.ts` scrive `404.html` e `sitemap.xml`, e rimuove `index.html` dalla radice. Quando
  aggiungi una lingua o una pagina, aggiorna `LANGS` o `PAGES` in quello script.

## Convenzioni di codice Angular 20 {#angular-20-coding-conventions}

Tutti i contributi seguono queste convenzioni.

### Componenti

- Usa solo componenti standalone. Non impostare `standalone: true` nei decoratori, perché è il
  valore predefinito.
- Usa le funzioni `input()` e `output()` invece dei decoratori `@Input()` e `@Output()`.
- Imposta `changeDetection: ChangeDetectionStrategy.OnPush`.
- Mantieni i componenti piccoli, con una sola responsabilità. Preferisci i template inline per i componenti piccoli.
- Preferisci i reactive form ai form basati su template.
- Metti gli host binding nell'oggetto `host` del decoratore. Non usare `@HostBinding` o `@HostListener`.
- Usa i binding `class` e `style`, non `ngClass` o `ngStyle`.
- Usa `NgOptimizedImage` per le immagini statiche. Non funziona per le immagini base64 inline.
- Usa il lazy loading per le route delle funzionalità.

### Stato

- Usa i signal per lo stato locale dei componenti e `computed()` per lo stato derivato.
- Usa `update` o `set` sui signal, non `mutate`.
- Mantieni le trasformazioni dello stato pure e prevedibili.

### Template

- Usa il control flow nativo (`@if`, `@for`, `@switch`), non `*ngIf`, `*ngFor` o `*ngSwitch`.
- Usa la pipe `async` per gli observable. Tieni la logica complessa fuori dai template.

### Servizi

- Dai a ogni servizio una sola responsabilità, e usa `providedIn: 'root'` per i singleton.
- Usa la funzione `inject()` invece dell'iniezione nel costruttore.

### TypeScript

- Usa il controllo rigoroso dei tipi. Preferisci l'inferenza di tipo quando il tipo è ovvio.
- Evita `any`. Usa `unknown` quando il tipo è incerto.
