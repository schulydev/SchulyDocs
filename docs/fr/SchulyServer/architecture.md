# Architecture

SchulyServer est une solution en architecture propre (clean architecture) avec CQRS.
Les requêtes arrivent dans des contrôleurs volontairement minces, qui transmettent les
commandes/requêtes via [Mediator](https://github.com/martinothamar/Mediator) à des
handlers dans la couche application ; la persistance et les intégrations externes
vivent dans l'infrastructure.

## Projets

La solution (`Schuly.API.slnx`) est découpée dans les projets suivants :

| Projet | Rôle |
|---|---|
| `Schuly.API` | Point d'entrée. Contrôleurs, câblage de la connexion et endpoints `/auth`, OpenAPI/Scalar, migrations au démarrage, enregistrement de l'hôte de plugins. Détient le `Dockerfile`. |
| `Schuly.Application` | Commandes/requêtes CQRS + handlers Mediator, DTO, mappers, autorisation et comportements de pipeline. **Ne doit pas** référencer Infrastructure. |
| `Schuly.Domain` | Entités pures (`School`, `Class`, `Exam`, `Grade`, `Absence`, `AgendaEntry`, `ApplicationUser`, `SchoolUser`, `Teacher`, `SchoolSystem`, `SemesterReport`, `StudentDocument`, …). Chacune hérite de `Base` (`Id`, `CreatedAt`, `UpdatedAt`). |
| `Schuly.Infrastructure` | `SchulyDbContext` (y compris les tables de connexion), services utilisateur, stockage et vault des secrets de plugins, services du contrat de plugin (`Plugins/`), dépôts (repositories). |
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
[Configuration](setup/configuration.md#stockage-de-documents-s3) pour les paramètres.

Le backend **fait office de proxy pour chaque octet lui-même** : les clients ne
reçoivent jamais d'URL S3 et ne se connectent jamais directement au backend de
stockage. Les envois passent par `POST /api/students/{id}/documents` (multipart) et
les téléchargements reviennent depuis `GET /api/documents/{id}` sous forme de réponse
fichier. Les avatars sont l'exception - ils sont envoyés avec `PUT /api/me/avatar`,
la base de données ne conserve qu'une simple clé de blob, et une URL de capacité signée
HMAC à courte durée de vie sous `/api/avatars/users/{id}` est générée à chaque accès
(voir [Signature des URL d'avatar](setup/configuration.md#signature-des-url-d-avatar)).

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
`Schuly.Plugin.Abstractions`. L'exécution des plugins vit dans `Schuly.API/Plugins` :
les plugins sont téléchargés à l'exécution depuis un registre vers `/app/plugins`,
chacun chargé dans son propre `AssemblyLoadContext` collectible avec un conteneur DI
enfant, et peuvent enregistrer des contrôleurs, des endpoints minimal-API, et des
tâches de fond récurrentes - exécutées par le planificateur propre à l'hôte et renvoyées par leur nom dans le
scope DI du plugin propriétaire. Les requêtes destinées aux plugins s'exécutent dans le
scope DI du plugin propriétaire via `PluginScopeMiddleware`. Voir
[Gestion des plugins](plugin-management.md) pour le registre, le hot-swap, les tâches
de fond, et les endpoints d'administration.

### Ce qu'un plugin peut atteindre

Les plugins n'obtiennent jamais `SchulyDbContext` ni les entités du backend. L'hôte
enregistre les services du contrat dans le conteneur de chaque plugin :

| Service | Implémenté par |
|---|---|
| `ISchoolData` | `PluginSchoolData` sur `SchulyDbContext`, marqué avec le nom d'assembly du plugin comme `Source` |
| `IPluginVault` | Le vault persistant, espace de noms `plugin:<Name>` |
| `IPluginFileStore` | `IDocumentStorage` (S3 chiffré) |
| `IPluginUserContext` | L'utilisateur de la requête en cours |

Les lignes synchronisées (`AgendaEntry`, `Absence`, `Grade`, `StudentDocument`) portent
`Source` et `ExternalId`, uniques par élève ; un `Source` null signifie que la ligne a
été saisie à la main et qu'aucun plugin n'y touche. Un plugin ne peut écrire que pour
les élèves dont le `SchoolUser.Source` est le sien ; un élève sans source est adopté
par le premier plugin qui le crée ou le synchronise.

### Données saisies à la main

Schuly fonctionne sans aucun plugin. Sous `api/me`, un utilisateur connecté crée sa
propre école (`POST api/me/schools`, il en devient l'élève) et ajoute, modifie et
supprime ses propres notes (`api/me/grades` ; la matière et l'examen sont créés si
besoin). Les absences et les entrées d'agenda utilisent les endpoints habituels. Les
lignes saisies à la main ont un `Source` null, donc aucune synchronisation n'y touche ;
une modification ou une suppression manuelle d'une ligne synchronisée est refusée avec
le nom du plugin. Les heures des écritures manuelles doivent porter un décalage UTC
(`...Z` ou `+02:00`) ; les heures sans décalage sont refusées.

### Compatibilité du contrat

Avant d'instancier un plugin, `PluginContract` vérifie la version de
`Schuly.Plugin.Abstractions` avec laquelle le plugin a été compilé. Avant 1.0, le
MAJOR.MINOR doit correspondre ; à partir de 1.0, le MAJOR doit correspondre et le MINOR
du plugin ne peut pas être plus récent que celui de l'hôte. Un plugin qui référence
`Schuly.Domain`, `Schuly.Infrastructure`, `Schuly.Application` ou `Schuly.API` est
aussi refusé. Les refus indiquent les deux versions dans l'erreur.
