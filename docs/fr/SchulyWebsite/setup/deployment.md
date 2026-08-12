# Déploiement

Le site est hébergé sur **Cloudflare Pages**. Le déploiement passe par
l'**intégration GitHub de Cloudflare** (configurée dans le dashboard Cloudflare,
**pas** par un workflow GitHub Actions de ce repo).

## Déploiements de production

- Les push sur **`main`** sont automatiquement déployés par Cloudflare Pages.
- Les **branches de PR** reçoivent automatiquement des **déploiements de
  prévisualisation** via la même intégration.

## Paramètres de build Cloudflare

| Paramètre | Valeur |
|---|---|
| Commande de build | `bun run build` |
| Répertoire de sortie | `dist/SchulyWebsite/browser` |
| Environnement | `BUN_VERSION=1.2.21` |

Le build utilise le builder `@angular/build:application` (voir `angular.json`), qui
produit le répertoire `dist/SchulyWebsite/browser` que Cloudflare est configuré pour
servir. **Si tu modifies `angular.json`** (nom du projet, builder ou paramètres de
sortie), vérifie que le chemin de sortie attendu par Cloudflare correspond toujours.

## CI vs déploiement

`.github/workflows/build.yml` est **indépendant** du déploiement. Il se contente
d'exécuter `bun install --frozen-lockfile` + `bun run build` lors des push et des PR
sur `main`, pour vérifier que le build passe - ce qui permet de détecter du code
cassé avant que Cloudflare ne tente un déploiement de prévisualisation. Il ne publie
rien lui-même.

## Voir aussi

- [Configuration du développement](development.md)
- [Release](release.md)
