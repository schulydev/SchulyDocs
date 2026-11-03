# Images et releases

Utilise cette page pour voir comment les images Docker du serveur sont compilées et publiées. L'API est livrée sous
forme d'image multi-architecture compilée à partir de `src/Schuly.API/Dockerfile`.

## Image du conteneur

- **Contexte de build :** `./src`. Les chemins `COPY` du Dockerfile sont relatifs à ce contexte, pas à la racine du
  dépôt.
- **Étapes de build :** le frontend se compile avec `oven/bun:1.3.5` et `node:24-slim`, et son résultat va dans
  `wwwroot`. L'API se compile et se publie sur `mcr.microsoft.com/dotnet/sdk:10.0`.
- **Runtime :** `mcr.microsoft.com/dotnet/aspnet:10.0`. Le point d'entrée est `dotnet Schuly.API.dll`.
- **Version :** `Directory.Build.props` lit normalement la version dans le fichier `application.properties` à la
  racine du dépôt, mais ce fichier n'est pas dans le contexte de build. L'image est compilée avec
  `-p:Version=$VERSION` à la place, et le workflow de release transmet la version de la release. Cela garde la
  version d'assembly de l'hôte alignée sur celle à laquelle les plugins chargés à l'exécution se lient.
- **Dossiers de plugins :** l'image crée `/app/plugins` et `/app/plugins-config` pour les plugins chargés à
  l'exécution et leur configuration.

## Versionnement et releases

`application.properties` (`<version>`) est la seule source de vérité. `src/Directory.Build.props` le lit.

La publication d'une release GitHub démarre `docker-publish-release.yaml` :

1. **`sync-version` :** compare le tag de release, sans son `v`, à `application.properties`. S'ils diffèrent, il met
   à jour le fichier et fusionne en squash une pull request `release-sync/<version>` dans `main`.
2. **`build-and-push-multiarch` :** compile `linux/amd64` et `linux/arm64` à partir de `./src` et pousse vers
   `ghcr.io/schulydev/schuly` et `<DOCKERHUB_USERNAME>/schuly`. L'étape de connexion à Docker Hub est en
   `continue-on-error`.
3. **`build-and-push-sandbox` :** compile le sidecar sandbox pour `linux/amd64` à partir de
   `src/Schuly.Sandbox/Dockerfile` et le pousse vers `ghcr.io/schulydev/schuly-sandbox`.

Chaque image reçoit les tags `<semver>`, `<major>.<minor>` et `<major>`, plus `latest` pour les versions qui ne sont
pas des préversions.

## Migrations au démarrage

Le conteneur applique les migrations EF Core au démarrage (`ApplyMigrations()` dans `Program.cs` appelle
`db.Database.Migrate()`) et initialise le catalogue des systèmes scolaires. Tu n'as pas besoin d'une étape de
migration séparée quand tu déploies. Assure-toi que la chaîne de connexion `SchulyDatabase` peut atteindre la base
de données. Voir [Migrations](../migrations.md) et [Configuration](configuration.md).
