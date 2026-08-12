# Architecture

## Stack

- **Angular 20**, composants standalone (pas de NgModules).
- **Signals** pour le state.
- **SCSS** pour le style - **pas de Tailwind**.
- **FontAwesome** via `@fortawesome/angular-fontawesome`.
- **`@ngx-translate`** pour l'i18n.
- Construit avec le builder `@angular/build:application` ; **Bun** comme gestionnaire
  de paquets.

## Organisation

Le code source de l'application se trouve dans [`src/app/`](../src/app) :

- `app.ts`, `app.config.ts`, `app.routes.ts` - composant racine, providers, routing.
- `app.config.server.ts`, `app.routes.server.ts` - configuration du rendu côté serveur (SSR).
- `components/` - éléments d'UI réutilisables (`hero`, `features`, `faq`, `screenshots`,
  `download`, `navigation`, `footer`, `legal`, `language-switcher`, `theme-toggle`).
- `pages/` - vues routées (`home`, `not-found`).
- `services/` - services singleton (`language`, `theme`).

## Conventions de code Angular 20

Ces conventions sont obligatoires pour toutes les contributions.

### Composants

- Uniquement des composants standalone. **Ne mets pas** `standalone: true` dans les
  décorateurs - c'est la valeur par défaut.
- Utilise les fonctions `input()` / `output()` plutôt que les décorateurs `@Input()` /
  `@Output()`.
- Configure `changeDetection: ChangeDetectionStrategy.OnPush`.
- Garde les composants petits et à responsabilité unique ; privilégie les templates
  inline pour les petits composants.
- Privilégie les **Reactive Forms** aux formulaires template-driven.
- Place les host bindings dans l'objet `host` du décorateur - **n'utilise pas**
  `@HostBinding` / `@HostListener`.
- Utilise les bindings `class` et `style` - **pas** `ngClass` / `ngStyle`.
- Utilise `NgOptimizedImage` pour les images statiques (remarque : ne fonctionne pas
  pour les images en base64 inline).
- Mets en place le lazy loading pour les routes de feature.

### State

- Utilise les **signals** pour le state local des composants et `computed()` pour le
  state dérivé.
- N'utilise **pas** `mutate` sur les signals - utilise `update` ou `set`.
- Garde les transformations de state pures et prévisibles.

### Templates

- Utilise le control flow natif (`@if`, `@for`, `@switch`) - pas `*ngIf` / `*ngFor` /
  `*ngSwitch`.
- Utilise le pipe `async` pour les observables. Garde les templates exempts de logique
  complexe.

### Services

- Responsabilité unique ; `providedIn: 'root'` pour les singletons.
- Utilise la fonction `inject()` plutôt que l'injection par constructeur.

### TypeScript

- Vérification de type stricte. Privilégie l'inférence de type quand elle est évidente.
- Évite `any` ; utilise `unknown` quand le type est incertain.

## Voir aussi

- [Configuration du développement](setup/development.md)
- [Contributing](contributing.md)
