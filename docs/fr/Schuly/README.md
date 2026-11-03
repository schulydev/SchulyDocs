# Documentation Schuly

Utilise ces pages pour exécuter, compiler et modifier l'application mobile Schuly. Schuly est une
application Flutter pour Android et iOS qui affiche les notes, les examens, l'agenda et les absences des
systèmes scolaires. L'interface utilise [Forui](https://forui.dev).

L'application fonctionne selon deux modes :

- **Mode compte :** utilise un compte Schuly sur [SchulyServer](https://github.com/schulydev/SchulyServer).
- **Mode privé** (aussi appelé mode sécurisé) : conserve les identifiants sur l'appareil et appelle des
  points d'entrée proxy anonymes et sans état.

## Démarrage rapide

```sh
bun run clean   # flutter clean && flutter pub get
bun run dev     # run the dev flavor on a connected device or emulator
```

[Configuration de développement](setup/development.md) liste les prérequis.

## Pages

| Page | Contenu |
| --- | --- |
| [Modes de l'application](architecture-modes.md) | Mode compte et mode privé, où se trouvent les données, le processus de connexion |
| [Configuration de développement](setup/development.md) | Prérequis, tâches bun, flavors, backend local, contrôles de qualité |
| [Build et release](setup/build-and-release.md) | Builds locaux, installation par adb, icônes de l'application, workflow de release |
| [Client API](api-client.md) | Comment `lib/api/` est généré et comment le régénérer |
| [Contribuer](contributing.md) | Les règles et les contrôles de ce dépôt |
