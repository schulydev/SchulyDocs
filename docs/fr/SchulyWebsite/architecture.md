# Architecture

Utilise cette page pour te repérer dans le code du site et pour suivre ses conventions de code.

## Technologies

- Angular 20 avec des composants standalone, sans NgModules
- Signals pour l'état
- SCSS pour les styles, sans Tailwind
- FontAwesome par `@fortawesome/angular-fontawesome`
- `@ngx-translate` pour les traductions
- Le builder `@angular/build:application`, avec Bun comme gestionnaire de packages

## Structure

Le code source se trouve dans [`src/app/`](https://github.com/schulydev/SchulyWebsite/tree/main/src/app) :

- `app.ts`, `app.config.ts`, `app.routes.ts` : composant racine, providers, routage.
- `app.config.server.ts`, `app.routes.server.ts` : paramètres de rendu serveur et de prérendu.
- `components/` : éléments d'interface (`hero`, `features`, `faq`, `screenshots`, `download`, `navigation`,
  `footer`, `legal`, `language-switcher`).
- `pages/` : vues routées (`home`, `not-found`).
- `services/` : `language`, `lang.resolver`, `seo`.

En dehors de `src/app/` :

- `public/i18n/` : un fichier de traduction par langue, y compris les métadonnées de page `meta.*`.
- `public/_redirects`, `public/_headers` : redirections et en-têtes de Cloudflare Pages.
- `functions/index.js` : une Pages Function de Cloudflare pour `/` uniquement.
- `scripts/postbuild.ts` : s'exécute après `ng build`.

## Routes et langues

Chaque page a un préfixe de langue : `en`, `de`, `fr`, `it` ou `rm`. L'anglais est la langue par défaut.

| Route | Page |
| --- | --- |
| `/<lang>` | Accueil |
| `/<lang>/impressum` | Impressum |
| `/<lang>/privacy` | Confidentialité |
| `/<lang>/terms` | Conditions |
| `/404` et tout autre chemin | Page introuvable |

- `app.routes.ts` génère les routes de chaque langue. `langResolver` définit la langue active et attend ses
  traductions, pour que chaque route soit prérendue dans sa propre langue.
- Le build utilise `outputMode: static`. `app.routes.server.ts` liste les routes et les langues à prérendre.
- `services/seo.ts` définit le titre, la description, l'URL canonique, les balises sociales et les alternatives
  `hreflang` de chaque route lors du prérendu.
- `functions/index.js` redirige `/` vers une langue selon `Accept-Language`. `public/_redirects` envoie `/` vers
  `/en` en solution de repli et envoie les anciens chemins sans préfixe vers leurs versions `/en`.
- `scripts/postbuild.ts` écrit `404.html` et `sitemap.xml`, et supprime le `index.html` racine. Quand tu ajoutes
  une langue ou une page, mets à jour `LANGS` ou `PAGES` dans ce script.

## Conventions de code Angular 20 {#angular-20-coding-conventions}

Toutes les contributions suivent ces conventions.

### Composants

- Utilise uniquement des composants standalone. Ne définis pas `standalone: true` dans les décorateurs, car c'est
  la valeur par défaut.
- Utilise les fonctions `input()` et `output()` au lieu des décorateurs `@Input()` et `@Output()`.
- Définis `changeDetection: ChangeDetectionStrategy.OnPush`.
- Garde les composants petits, avec une seule responsabilité. Préfère les templates inline pour les petits
  composants.
- Préfère les formulaires réactifs aux formulaires pilotés par template.
- Mets les liaisons d'hôte dans l'objet `host` du décorateur. N'utilise pas `@HostBinding` ou `@HostListener`.
- Utilise les liaisons `class` et `style`, pas `ngClass` ou `ngStyle`.
- Utilise `NgOptimizedImage` pour les images statiques. Il ne fonctionne pas pour les images base64 inline.
- Charge les routes de fonctionnalités en différé.

### État

- Utilise les signals pour l'état local des composants et `computed()` pour l'état dérivé.
- Utilise `update` ou `set` sur les signals, pas `mutate`.
- Garde les transformations d'état pures et prévisibles.

### Templates

- Utilise le contrôle de flux natif (`@if`, `@for`, `@switch`), pas `*ngIf`, `*ngFor` ou `*ngSwitch`.
- Utilise le pipe `async` pour les observables. Garde la logique complexe hors des templates.

### Services

- Donne à chaque service une seule responsabilité, et utilise `providedIn: 'root'` pour les singletons.
- Utilise la fonction `inject()` au lieu de l'injection par constructeur.

### TypeScript

- Utilise la vérification stricte des types. Préfère l'inférence de type quand le type est évident.
- Évite `any`. Utilise `unknown` quand le type est incertain.
