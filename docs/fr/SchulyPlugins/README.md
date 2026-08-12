# Documentation SchulyPlugins

Plugins officiels pour le [backend Schuly](https://github.com/schulydev/SchulyBackend). Chaque
plugin vit dans son propre dossier sous `src/`, cible **.NET 10** et implémente `ISchulyPlugin`
depuis [`Schuly.Plugin.Abstractions`](https://github.com/schulydev/SchulyPluginAbstractions)
(consommé comme `PackageReference` NuGet). Le backend charge les DLL des plugins compilées au
démarrage et pilote leur cycle de vie (`ConfigureServices`, `ConfigureEndpoints`,
`MigrateAsync`), ainsi que toute `IPluginBackgroundTask` récurrente. Les plugins sont compilés et
livrés sous forme de DLL sur la branche `repo` (distribution façon Aniyomi), puis déposés par les
opérateurs dans le dossier `/app/plugins/` du backend.

## Organisation du dépôt

| Chemin | Rôle |
|---|---|
| `src/Schuly.Plugin.Example/` | Plugin de référence / gabarit. `ISchulyPlugin` minimal avec des endpoints en API minimale, des routes anonymes et authentifiées, et une démo de coffre-fort propre au plugin. |
| `src/Schuly.Plugin.Schulware/` | Intégration Schulnetz via [SchulwareAPI](https://github.com/schulydev/SchulwareAPI). EF Core + Postgres, client généré par Kiota, tâche de synchronisation en arrière-plan, contrôleurs MVC. |
| `src/Schuly.Plugin.OdaOrg/` | Intégration OdaOrg (portail d'apprentissage de l'ICT-BBAG). HttpClient + scraper AngleSharp, EF Core + Postgres, tâche de synchronisation en arrière-plan. |
| `.github/workflows/build_push.yml` | Détecte chaque `src/Schuly.Plugin.*/*.csproj`, compile, puis publie les DLL + l'index sur la branche `repo`. |
| `.github/workflows/sync-version-on-release.yml` | Synchronisation de version lors d'une release. |

Un dossier de plugin Schulware/OdaOrg est organisé ainsi :

| Dossier | Contenu |
|---|---|
| `Controllers/` | Contrôleurs ASP.NET MVC - routes HTTP (l'hôte enregistre l'assembly comme ApplicationPart MVC, elles sont donc découvertes automatiquement). |
| `Services/` | Tâche en arrière-plan (`IPluginBackgroundTask`) et services de synchronisation/connexion à portée limitée (scoped). |
| `Dtos/` / `Models/` | Un record par fichier. |
| `Data/` | Entités EF Core, `DbContext`, fabrique design-time et `Migrations/`. |
| `Infrastructure/` | Fabriques/utilitaires pour les clients externes. |
| `Client/` | Client API généré par Kiota (Schulware uniquement). |
| `config.yml` | Exemple de configuration à l'exécution (`Schuly.Plugin.<Name>.yml` dans le répertoire de configuration des plugins du backend). |

## Documents

| Doc | Contenu |
|---|---|
| [setup/development.md](setup/development.md) | Prérequis, compilation d'un plugin, exécution face à un backend en production. |
| [adding-a-plugin.md](adding-a-plugin.md) | Créer le gabarit d'un nouveau plugin + le cycle de vie `ISchulyPlugin`. |
| [migrations.md](migrations.md) | Migrations EF Core par plugin et la base Postgres dédiée. |
| [setup/kiota-client.md](setup/kiota-client.md) | Régénérer le client Kiota de Schulware. |
| [setup/distribution.md](setup/distribution.md) | Comment les plugins sont compilés et livrés sur la branche `repo`. |
| [contributing.md](contributing.md) | Le processus obligatoire issue → branche → PR → squash. |
