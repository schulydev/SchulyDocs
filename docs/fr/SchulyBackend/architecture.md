# Architecture

SchulyBackend est une solution en architecture propre (clean architecture) avec CQRS.
Les requêtes arrivent dans des contrôleurs volontairement minces, qui transmettent les
commandes/requêtes via [Mediator](https://github.com/martinothamar/Mediator) à des
handlers dans la couche application ; la persistance et les intégrations externes
vivent dans l'infrastructure.

## Projets

La solution (`Schuly.API.slnx`) est découpée dans les projets suivants :

| Projet | Rôle |
|---|---|
| `Schuly.API` | Point d'entrée. Contrôleurs, câblage OIDC, OpenAPI/Scalar, migrations au démarrage, enregistrement de l'hôte de plugins. Détient le `Dockerfile`. |
| `Schuly.Application` | Commandes/requêtes CQRS + handlers Mediator, DTO, mappers, autorisation et comportements de pipeline. **Ne doit pas** référencer Infrastructure. |
| `Schuly.Domain` | Entités pures (`School`, `Class`, `Exam`, `Grade`, `Absence`, `AgendaEntry`, `ApplicationUser`, `SchoolUser`, `Teacher`, `SchoolSystem`, `SemesterReport`, `StudentDocument`, …). Chacune hérite de `Base` (`Id`, `CreatedAt`, `UpdatedAt`). |
| `Schuly.Infrastructure` | `SchulyDbContext`, services OIDC/utilisateur, stockage et vault, dépôts (repositories), exécution des plugins (`PluginBackgroundTaskHost`). |
| `Schuly.Tests` / `Schuly.Tests.Plugin` | Projets de tests (TUnit). |

`Schuly.Plugin.Abstractions` est consommé comme une **référence NuGet
(`PackageReference`)**, pas comme une référence de projet. Les abstractions et les
implémentations de plugins vivent dans des dépôts séparés.

## Règles de couches

- Les dépendances pointent vers l'intérieur : `API → Application → Domain`, et
  `Infrastructure → Application/Domain`.
- **`Schuly.Application` ne doit pas référencer `Schuly.Infrastructure`.** Les handlers
  dépendent d'abstractions ; c'est le projet API qui compose les services
  d'infrastructure concrets dans le conteneur DI au démarrage (`Program.cs`).
- `Schuly.Domain` n'a aucune dépendance de projet - les entités restent pures.

## Pipeline de requêtes

Les contrôleurs sont minces et délèguent à Mediator. Deux comportements de pipeline
sont enregistrés explicitement dans `Program.cs` et s'exécutent dans l'ordre
d'enregistrement :

1. `AuthorizationBehavior` - impose les contrôles de rôle avant l'exécution du handler.
2. `PluginEventBehavior` - transmet les commandes backend aux handlers d'événements des
   plugins.

Les handlers Mediator sont enregistrés automatiquement via la génération de code
source, donc une nouvelle commande/requête et son handler sont câblés simplement en
ajoutant les classes.

## Stockage de documents

Les documents d'élèves et les avatars sont conservés dans un bucket compatible S3 -
SeaweedFS dans les piles de développement et d'auto-hébergement fournies, bien que
n'importe quelle implémentation S3 fonctionne sans changement de code. Voir
[Configuration](setup/configuration.md#document-storage-s3) pour les paramètres.

Le backend **fait office de proxy pour chaque octet lui-même** : les clients ne
reçoivent jamais d'URL S3 et ne se connectent jamais directement au backend de
stockage. Les envois passent par `POST /api/students/{id}/documents` (multipart) et
les téléchargements reviennent depuis `GET /api/documents/{id}` sous forme de réponse
fichier. Les avatars sont l'exception - la base de données ne conserve qu'une simple
clé de blob, et une URL de capacité signée HMAC à courte durée de vie est générée à
chaque accès (voir [Signature des URL d'avatar](setup/configuration.md#avatar-url-signing)).

## Ajouter une entité + un endpoint

1. **Entité** dans `Schuly.Domain` (hérite de `Base`).
2. **DbSet + configuration** dans `Schuly.Infrastructure/SchulyDbContext.cs`.
3. **Migration** - voir [Migrations](migrations.md).
4. **Commande/Requête** dans `Schuly.Application/Commands/<Entity>/` ou
   `Queries/<Entity>/`.
5. **Handler** à côté de la commande/requête (enregistré automatiquement via la
   génération de code source de Mediator).
6. **Contrôleur** dans `Schuly.API/Controllers/` - mince, délègue à Mediator.

## Hôte de plugins

Le backend héberge des plugins qui implémentent `ISchulyPlugin` depuis
`Schuly.Plugin.Abstractions`. Les plugins sont téléchargés à l'exécution depuis un
registre vers `/app/plugins`, chacun chargé dans son propre `AssemblyLoadContext`
collectible avec un conteneur DI enfant, et peuvent enregistrer des contrôleurs, des
endpoints minimal-API, et des tâches de fond récurrentes (exécutées par
`PluginBackgroundTaskHost`). Les requêtes destinées aux plugins s'exécutent dans le
scope DI du plugin propriétaire via `PluginScopeMiddleware`. Voir
[Gestion des plugins](plugin-management.md) pour le registre, le hot-swap, et les
endpoints d'administration.
