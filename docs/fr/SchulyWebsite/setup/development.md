# Configuration du développement

## Prérequis

- **Bun `1.2.21+`** - c'est le seul gestionnaire de paquets utilisé pour ce projet.
  Il n'y a **ni npm ni `package-lock.json`**.
  - La version est fixée via `packageManager` dans `package.json` et
    `cli.packageManager` dans `angular.json`.
  - La version compte : le projet utilise le format de lockfile **texte
    `bun.lock`**, que Bun 1.1.x ne peut pas lire. Utilise 1.2.21 ou une version plus
    récente.

## Installation

```sh
bun install
```

## Lancement

```sh
bun start            # ng serve sur http://localhost:4200
```

## Watch (build de dev continu)

```sh
bun run watch        # ng build --watch --configuration development
```

## Build de production

```sh
bun run build        # ng build (production) + scripts/postbuild.ts
```

Le build de production est généré dans `dist/SchulyWebsite/browser`. Voir
[déploiement](deployment.md) pour savoir comment cette sortie est servie.

## Tests

```sh
bun run test         # ng test (Karma + Jasmine)
```

## Voir aussi

- [Déploiement](deployment.md)
- [Architecture et conventions de code](../architecture.md)
- [Contributing](../contributing.md)
