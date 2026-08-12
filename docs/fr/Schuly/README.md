# Documentation Schuly

Schuly est une application mobile Flutter qui donne accès aux données scolaires
(notes, examens, agenda, absences) des systèmes basés sur Schulnetz. Elle fonctionne
selon deux modes - un **mode compte**, adossé à
[SchulyBackend](https://github.com/schulydev/SchulyBackend) via OIDC, et un
**mode privé / sécurisé**, qui conserve les identifiants sur l'appareil et ne
communique qu'avec des points d'entrée proxy anonymes et sans état. L'interface est
construite avec [Forui](https://forui.dev).

## Sommaire

| Document | Contenu |
| --- | --- |
| [Architecture : modes de l'app](architecture-modes.md) | Mode compte vs mode privé, où résident les données, le déroulement de la connexion |
| [Configuration de développement](setup/development.md) | SDK Flutter, task runner bun, exécution des flavors dev/prod, analyze/test/format |
| [Build & release](setup/build-and-release.md) | APK de release, build iOS, installation via adb, régénération de l'icône de l'app |
| [Client API](api-client.md) | Comment `lib/api/` est généré et comment le régénérer |
| [Contribuer](contributing.md) | Le workflow imposé issue → branche → PR et la taxonomie des labels |

## Démarrage rapide

```sh
bun run clean   # flutter clean && flutter pub get
bun run dev     # lance le flavor dev sur un appareil/émulateur connecté
```

Voir [Configuration de développement](setup/development.md) pour les prérequis.
