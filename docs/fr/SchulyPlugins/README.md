# SchulyPlugins

Utilise ces pages pour compiler, tester et livrer des plugins pour le
[serveur Schuly](https://github.com/schulydev/SchulyServer).

| Page | À utiliser pour |
|---|---|
| [Ajouter un plugin](adding-a-plugin.md) | Passer d'une copie du plugin d'exemple à un plugin chargé |
| [Configuration de développement](setup/development.md) | Installer les outils, compiler un plugin et l'exécuter sur un serveur local |
| [Migrations EF Core](migrations.md) | Donner à un plugin sa propre base de données et faire évoluer son schéma |
| [Client Kiota](setup/kiota-client.md) | Régénérer le client API de Schulware |
| [Distribution](setup/distribution.md) | Voir comment les plugins sont compilés et livrés sur la branche `repo` |
| [Contribuer](contributing.md) | Suivre les règles propres à ce dépôt |

## Fonctionnement des plugins

Chaque plugin se trouve dans son propre dossier sous `src/`, cible .NET 10 et implémente `ISchulyPlugin` de
[`Schuly.Plugin.Abstractions`](https://github.com/schulydev/SchulyPluginAbstractions), une `PackageReference`
NuGet.

La CI compile chaque plugin et publie les DLL sur la branche `repo` (distribution de type Aniyomi). Le serveur
télécharge les plugins listés dans son `plugins.yml` et les charge au démarrage. Il appelle
`ConfigureServices`, `MigrateAsync` et `ConfigureEndpoints`, puis planifie chaque
`IPluginBackgroundTask` récurrente.

## Structure du dépôt

| Chemin | Rôle |
|---|---|
| `src/Schuly.Plugin.Example/` | Plugin de référence à copier. Un `ISchulyPlugin` minimal avec des points d'entrée minimal-API, des routes anonymes et autorisées, et une démo de coffre-fort par plugin. |
| `src/Schuly.Plugin.Schulware/` | Intégration de Schulnetz par [SchulwareAPI](https://github.com/schulydev/SchulwareAPI). EF Core et Postgres, un client généré par Kiota, une tâche de synchronisation en arrière-plan et des contrôleurs MVC. |
| `src/Schuly.Plugin.OdaOrg/` | Intégration d'OdaOrg (portail d'apprentissage ICT-BBAG). Un scraper HttpClient et AngleSharp, EF Core et Postgres, et une tâche de synchronisation en arrière-plan. |
| `src/Schuly.Plugin.Microsoft/` | Microsoft 365 par le service [SchulyMicrosoft](https://github.com/schulydev/SchulyMicrosoft). Lie un compte Microsoft, et lit et écrit les données de mail, de calendrier, de OneDrive, de Teams et de OneNote. Il n'a pas de base de données propre. |
| `src/Shared/` | Helpers compilés dans les plugins qui le choisissent : `ExternalIds`, `SwissTime`, `DataUri` et `Provisioning/InstanceUrl`. |
| `tests/` | `Schuly.Plugin.Microsoft.Tests` et `Schuly.Plugins.Linking.Tests`. |
| `.github/workflows/build_push.yml` | Trouve chaque projet de plugin, le compile et publie les DLL et l'index sur la branche `repo`. |
| `.github/workflows/sync-version-on-release.yml` | Synchronisation de la version à la release. |
| `.github/workflows/sync-docs.yml` | Copie `docs/` vers le site de documentation. |

## Contenu d'un dossier de plugin

Les plugins Schulware et OdaOrg utilisent ces dossiers. Le plugin Microsoft utilise `Controllers/`,
`Services/` et `Infrastructure/`.

| Dossier | Contenu |
|---|---|
| `Controllers/` | Contrôleurs ASP.NET MVC avec les routes HTTP. L'hôte enregistre l'assembly comme ApplicationPart MVC, donc il les trouve automatiquement. |
| `Services/` | La tâche en arrière-plan (`IPluginBackgroundTask`) et de petits services scoped de synchronisation et de connexion. |
| `Dtos/` (Schulware), `Models/` (OdaOrg) | Records. Dans `Dtos/`, un record par fichier. |
| `Data/` | Entités EF Core, `DbContext`, fabrique au moment du design et `Migrations/`. |
| `Infrastructure/` | Fabriques de clients externes et helpers. |
| `Client/` | Client API généré par Kiota (Schulware uniquement). |
| `config.yml` | Exemple de configuration d'exécution. Déploie-le sous le nom `Schuly.Plugin.<Name>.yml` dans le dossier de configuration des plugins du serveur. |
