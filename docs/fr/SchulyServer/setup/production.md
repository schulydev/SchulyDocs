# Production

L'API est livrée sous forme d'image Docker multi-architecture construite à partir de
`src/Schuly.API/Dockerfile`.

## Image du conteneur

- **Le contexte de build est `./src`.** Les chemins `COPY` du Dockerfile sont relatifs
  à ce répertoire, pas à la racine du dépôt.
- Étapes de build : build/publish SDK sur `mcr.microsoft.com/dotnet/sdk:10.0`, runtime
  sur `mcr.microsoft.com/dotnet/aspnet:10.0`. Le point d'entrée est
  `dotnet Schuly.API.dll`.
- Le fichier `application.properties` à la racine du dépôt (que `Directory.Build.props`
  lit normalement pour la version) n'est **pas** dans le contexte de build, donc
  l'image est construite avec `-p:Version=$VERSION`. Le workflow de release transmet
  le tag de release comme `VERSION` ; cela garde la version de l'assembly hôte alignée
  avec ce à quoi se lient les plugins chargés à l'exécution.
- L'image pré-crée `/app/plugins` et `/app/plugins-config` pour les plugins chargés à
  l'exécution et leur configuration propre à chaque plugin.

## Versionnement + release

Source de vérité unique : **`application.properties`** (`<version>`).
`src/Directory.Build.props` la lit via `XmlPeek`.

Publier une GitHub Release déclenche `docker-publish-release.yaml` :

1. **`sync-version`** - compare le tag de release (le `v` retiré) à
   `application.properties`. En cas de différence, ouvre une branche
   `release-sync/<version>` qui met à jour le fichier et fusionne automatiquement
   (squash) la PR dans `main`.
2. **`build-and-push-multiarch`** - construit `linux/amd64` + `linux/arm64` depuis
   `./src` et pousse les tags :
   - `ghcr.io/schulydev/schuly:<semver>` plus `:<major>`, `:<major>.<minor>`, et
     `:latest` (latest uniquement pour les versions non pré-release).
   - `<DOCKERHUB_USERNAME>/schuly:<semver>` (Docker Hub, **au mieux** - l'étape de
     connexion est `continue-on-error`).

## Migrations au démarrage

Le conteneur applique automatiquement les migrations EF Core au démarrage
(`ApplyMigrations()` dans `Program.cs` → `db.Database.Migrate()`) et alimente le
catalogue des systèmes scolaires. Aucune étape de migration séparée n'est requise lors
du déploiement ; assure-toi simplement que la base de données est accessible via la
chaîne de connexion `SchulyDatabase`. Voir [Migrations](../migrations.md) et
[Configuration](configuration.md).
