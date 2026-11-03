# Déploiement

Utilise cette page pour voir comment le site arrive sur Cloudflare Pages et ce qu'il faut vérifier quand tu changes
le build. L'intégration GitHub de Cloudflare gère les déploiements. Elle est configurée dans le tableau de bord de
Cloudflare, pas dans un workflow GitHub Actions.

## Ce qui est déployé

- Les pushes vers `main` sont déployés en production.
- Les branches de pull request reçoivent des déploiements de prévisualisation.

## Paramètres de build de Cloudflare

| Paramètre | Valeur |
| --- | --- |
| Commande de build | `bun run build` |
| Dossier de sortie | `dist/SchulyWebsite/browser` |
| Environnement | `BUN_VERSION=1.2.21` |

Le builder `@angular/build:application` de `angular.json` produit le dossier de sortie. Si tu changes le nom du
projet, le builder ou les paramètres de sortie dans `angular.json`, vérifie que le chemin de sortie de Cloudflare
correspond toujours.

Le déploiement utilise aussi `public/_redirects`, `public/_headers` et la Pages Function de
`functions/index.js`.

## CI

`.github/workflows/build.yml` ne déploie rien. Sur les pushes et les pull requests vers `main`, il exécute
`bun install --frozen-lockfile` et `bun run build` avec la dernière version de Bun, donc il détecte le code cassé
avant que Cloudflare ne tente un déploiement de prévisualisation.
