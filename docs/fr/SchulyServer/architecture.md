# Architecture

Utilise cette page pour trouver où placer le code dans SchulyServer et comment y ajouter des éléments. Le
serveur est une solution en clean architecture avec CQRS. Des contrôleurs légers envoient les commandes et les
requêtes par [Mediator](https://github.com/martinothamar/Mediator) aux handlers de la couche application. La
persistance et les intégrations externes se trouvent dans l'infrastructure.

## Projets

Le fichier de solution est `Schuly.API.slnx`.

| Projet | Rôle |
|---|---|
| `Schuly.API` | Point d'entrée. Contrôleurs, câblage de la connexion et points d'entrée `/auth`, OpenAPI et Scalar, migrations au démarrage, hôte de plugins, serveur MCP, Helply. Possède le `Dockerfile` de l'API. |
| `Schuly.Application` | Commandes et requêtes CQRS, handlers Mediator, DTO, mappers, comportements d'autorisation et de pipeline. Ne doit pas référencer Infrastructure. |
| `Schuly.Domain` | Entités pures (`School`, `Class`, `Exam`, `Grade`, `Absence`, `AgendaEntry`, `ApplicationUser`, `SchoolUser`, `Teacher`, `SchoolSystem`, `SemesterReport`, `StudentDocument` et d'autres). Chacune hérite de `Base` (`Id`, `CreatedAt`, `UpdatedAt`). |
| `Schuly.Infrastructure` | `SchulyDbContext` (y compris les tables de connexion), services d'utilisateurs, stockage, coffre-fort de secrets des plugins, services du contrat de plugin (`Plugins/`), repositories. |
| `Schuly.Sandbox` | Le sidecar sandbox de Helply, avec sa propre image `ghcr.io/schulydev/schuly-sandbox`. |
| `Schuly.Frontend` | L'application web Angular 22, compilée avec Bun. Elle ne fait pas partie du fichier de solution. L'image de l'API la sert depuis `wwwroot`. |
| `Schuly.Tests`, `Schuly.Tests.Plugin` | Projets de tests (TUnit). |

`Schuly.Plugin.Abstractions` est une `PackageReference` NuGet, pas une référence de projet. Les abstractions
et les plugins se trouvent dans des dépôts séparés.

## Règles de couches

- Les dépendances pointent vers l'intérieur : `API → Application → Domain`, et `Infrastructure → Application/Domain`.
- `Schuly.Application` ne doit pas référencer `Schuly.Infrastructure`. Les handlers dépendent d'abstractions,
  et le projet API enregistre les services concrets dans `Program.cs`.
- `Schuly.Domain` n'a pas de dépendances de projet.

## Pipeline de requêtes

`Program.cs` enregistre trois comportements de pipeline, qui s'exécutent dans cet ordre :

1. `AuthorizationBehavior` : lève une exception si un type de requête n'a pas d'attribut `[AllowAuthenticated]`.
2. `NotificationOriginBehavior` : marque la requête comme lancée par l'utilisateur, pour que les propres actions
   de l'utilisateur ne produisent jamais de notification push.
3. `PluginEventBehavior` : envoie les commandes du backend aux handlers d'événements des plugins.

La génération de source de Mediator enregistre les handlers, donc ajouter les classes est suffisant.

## Ajouter une entité et un point d'entrée

1. **Entité :** ajoute-la à `Schuly.Domain`, en héritant de `Base`.
2. **DbSet et configuration :** ajoute-les à `Schuly.Infrastructure/SchulyDbContext.cs`.
3. **Migration :** voir [Migrations](migrations.md).
4. **Commande ou requête :** ajoute-la à `Schuly.Application/Commands/<Entity>/` ou `Queries/<Entity>/`.
5. **Handler :** ajoute-le à côté de la commande ou de la requête.
6. **Contrôleur :** ajoute un contrôleur léger à `Schuly.API/Controllers/` qui délègue à Mediator.

## Stockage de documents

Les documents des élèves et les avatars se trouvent dans un bucket compatible S3. Les stacks fournies pour le
développement et l'auto-hébergement utilisent SeaweedFS, et toute implémentation S3 fonctionne sans changement
de code. Voir [Configuration](setup/configuration.md#document-storage-s3) pour les paramètres.

Le backend sert de proxy pour chaque octet. Les clients ne reçoivent jamais d'URL S3 et ne se connectent jamais
directement au stockage :

- Envoi avec `POST /api/students/{id}/documents` (multipart).
- Téléchargement depuis `GET /api/documents/{id}`, qui renvoie une réponse de fichier.

Les avatars sont la seule exception. Tu les envoies avec `PUT /api/me/avatar`, et la base de données ne contient
qu'une simple clé de blob. Le serveur crée une URL de courte durée signée par HMAC sous
`/api/avatars/users/{id}` à chaque accès. Voir
[Signature des URL d'avatar](setup/configuration.md#avatar-url-signing).

## Serveur MCP et Helply

`/mcp` est un serveur Streamable HTTP sans état. Ses outils se trouvent dans `Schuly.API/Mcp/Tools`, et son
authentification dans `Schuly.Infrastructure/Mcp`. Les jetons MCP et les JWT de `/api` ne fonctionnent pas sur
les points d'entrée de l'autre.

Chaque outil a besoin de `[McpAccess(area, level)]`, et les suppressions ont aussi besoin de
`[McpDestructive]`. Un nouvel outil sans `[McpAccess]` est visible par toutes les connexions.

Helply se trouve dans `Schuly.API/Helply`. Voir [Configuration](setup/configuration.md#helply) pour Helply et
[Serveur MCP](setup/configuration.md#mcp-server) pour les paramètres MCP.

## Hôte de plugins

Le backend héberge des plugins qui implémentent `ISchulyPlugin` de `Schuly.Plugin.Abstractions`. Le runtime se
trouve dans `Schuly.API/Plugins` :

- Il télécharge les plugins depuis un registre dans `/app/plugins` à l'exécution.
- Il charge chaque plugin dans son propre `AssemblyLoadContext` collectable, avec un conteneur DI enfant.
- Les plugins peuvent enregistrer des contrôleurs, des points d'entrée minimal-API et des tâches récurrentes en
  arrière-plan. Le planificateur de l'hôte exécute chaque tâche par son nom dans le scope DI du plugin
  propriétaire.
- `PluginScopeMiddleware` exécute les requêtes de plugin dans le scope DI du plugin propriétaire.

Voir [Gestion des plugins](plugin-management.md) pour le registre, le remplacement à chaud et les tâches en
arrière-plan.

### Ce qu'un plugin peut atteindre

Les plugins n'obtiennent jamais `SchulyDbContext` ni les entités du backend. L'hôte enregistre ces services du
contrat dans le conteneur de chaque plugin :

| Service | Reposant sur |
|---|---|
| `ISchoolData` | `PluginSchoolData` sur `SchulyDbContext`, marqué avec le nom d'assembly du plugin comme `Source` |
| `IPluginVault` | Le coffre-fort persistant, namespace `plugin:<Name>` |
| `IPluginFileStore` | `IDocumentStorage` (S3 chiffré) |
| `IPluginUserContext` | L'utilisateur de la requête courante |

Les lignes synchronisées (`AgendaEntry`, `Absence`, `Grade`, `StudentDocument`) portent `Source` et `ExternalId`,
uniques par élève. Une `Source` null signifie que quelqu'un a saisi la ligne à la main, et aucun plugin n'y touche.

Un plugin ne peut écrire que pour les élèves dont le `SchoolUser.Source` est le sien. Le premier plugin qui
provisionne ou synchronise un élève sans source adopte cet élève.

### Données saisies à la main

Schuly fonctionne sans aucun plugin. Sous `api/me`, un utilisateur connecté peut :

- Créer sa propre école avec `POST api/me/schools`, ce qui fait de lui son élève.
- Ajouter, modifier et supprimer ses propres notes avec `api/me/grades`. La branche et l'examen sont créés si
  nécessaire.

Les absences et les entrées d'agenda utilisent les points d'entrée normaux. Les lignes saisies à la main ont une
`Source` null, donc aucune synchronisation n'y touche. L'API refuse la modification ou la suppression manuelle
d'une ligne synchronisée et nomme le plugin.

Les heures des écritures manuelles doivent porter un décalage UTC (`...Z` ou `+02:00`). L'API refuse les heures
sans décalage.

### Compatibilité du contrat

Avant de créer un plugin, `PluginContract` vérifie pour quelle version de `Schuly.Plugin.Abstractions` le plugin
a été compilé :

- **Avant la 1.0 :** le MAJOR.MINOR doit correspondre.
- **À partir de la 1.0 :** le MAJOR doit correspondre, et le MINOR du plugin ne peut pas être plus récent que
  celui de l'hôte.

`PluginContract` refuse aussi un plugin qui référence `Schuly.Domain`, `Schuly.Infrastructure`,
`Schuly.Application` ou `Schuly.API`. Les erreurs de refus nomment les deux versions.
