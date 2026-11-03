# Contribuer

Utilise cette page pour les règles et les contrôles propres à l'application mobile. Pour les issues, les
branches, les pull requests et les labels, suis le [processus partagé](/fr/contribute/).

## Règles

- Exécute les tâches avec `bun run <script>` au lieu de la commande brute, et n'utilise pas npm, npx ou
  node.
- Utilise un générateur en ligne de commande quand il en existe un, comme `gh issue create` ou
  `gh pr create`.

## Contrôles avant d'ouvrir une pull request

```sh
bun run analyze
bun run test
bun run format
```

La CI exécute `flutter analyze` et `flutter test` sur chaque pull request. Si tu modifies `android/**` ou
`pubspec.yaml`, la CI compile aussi un APK de debug du flavor dev.

Voir [Configuration de développement](setup/development.md) pour les détails.
