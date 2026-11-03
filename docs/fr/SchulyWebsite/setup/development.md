# Configuration de développement

Utilise cette page pour installer, exécuter, compiler et tester le site sur ta machine.

## Prérequis

Installe Bun `1.2.21` ou une version plus récente. C'est le seul gestionnaire de packages de ce projet, et il n'y a
pas de `package-lock.json`.

Le projet utilise le format texte `bun.lock`, que Bun 1.1.x ne peut pas lire. `package.json` épingle `bun@1.2.21`
dans `packageManager`, et `cli.packageManager` dans `angular.json` sélectionne Bun pour la CLI Angular.

## Commandes

```sh
bun install       # install dependencies
bun start         # ng serve on http://localhost:4200
bun run watch     # ng build --watch --configuration development
bun run build     # ng build (production), then scripts/postbuild.ts
bun run test      # ng test (Karma and Jasmine)
```

Le build de production écrit dans `dist/SchulyWebsite/browser`. Voir [Déploiement](deployment.md) pour savoir comment
cette sortie est servie.
