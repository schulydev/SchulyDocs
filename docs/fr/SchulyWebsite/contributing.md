# Contribuer

Utilise cette page pour les règles et les contrôles propres au site web. Pour les issues, les branches, les pull
requests et les labels, suis le [processus partagé](/fr/contribute/).

## Règles

- Utilise Bun pour tout, pas npm, npx ou node.
- Suis les [conventions de code Angular 20](architecture.md#angular-20-coding-conventions).
- Quand tu ajoutes une langue ou une page, mets à jour `scripts/postbuild.ts`. Voir
  [Routes et langues](architecture.md#routes-et-langues).

## Contrôles

La CI les exécute sur les pushes et les pull requests vers `main`. Exécute-les avant d'ouvrir une pull request :

```sh
bun install --frozen-lockfile
bun run build
```

Exécute aussi les tests unitaires. La CI ne les exécute pas.

```sh
bun run test
```
