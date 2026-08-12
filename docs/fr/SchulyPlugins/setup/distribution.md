# Distribution

Les plugins suivent le modèle à deux branches façon **Aniyomi** :

- `main` - les projets source C# des plugins.
- `repo` - les DLL compilées plus un index lisible par machine, tous générés automatiquement.

## Le workflow de compilation + publication

`.github/workflows/build_push.yml` se déclenche sur les push vers `main` qui touchent
`src/Schuly.Plugin.*/**` (ou le workflow lui-même), ainsi que sur déclenchement manuel. Il
comporte trois jobs :

1. **discover** - parcourt `src/**/Schuly.Plugin.*.csproj` et produit une matrice de
   compilation. Un nouveau dossier de plugin avec un csproj est pris en compte sans changement
   de workflow.
2. **build** (par plugin) - `dotnet publish -c Release`, puis met en place :
   - `dll/<AssemblyName>-v<Version>.dll` - l'assembly du plugin, livrée de manière autonome pour
     que les opérateurs puissent l'épingler/la remplacer indépendamment.
   - `dll/<AssemblyName>-v<Version>-deps.zip` - ses dépendances tierces. Les assemblies fournies
     par l'hôte sont exclues (ASP.NET Core, EF Core, Npgsql, Mediator et les assemblies hôtes de
     Schuly, y compris `Schuly.Plugin.Abstractions`) ; seules les véritables dépendances NuGet
     tierces (Kiota, AngleSharp, …) sont incluses. Un plugin sans dépendance reçoit un zip
     marqueur uniquement, pour que le schéma de l'index reste uniforme.
   - un JSON de métadonnées par plugin (`name`, `pkg`, `dll`, `deps`, `version`, `description`,
     `authors`), lu depuis le csproj via `dotnet msbuild -getProperty`.
3. **publish** - fusionne les JSON de chaque plugin en un `index.json` (trié par nom) et un
   `index.min.json` minifié, copie les DLL + zips de dépendances, et committe le tout sur la
   branche `repo`.

`AssemblyName`, `Version`, `Description` et `Authors` proviennent donc directement du
`PropertyGroup` du `.csproj` de chaque plugin - garde-les à jour.

## Installation (pour les opérateurs)

Les artefacts précompilés sont servis depuis
`raw.githubusercontent.com/schulydev/SchulyPlugins/repo`. Télécharge-les dans le dossier
`/app/plugins/` du backend :

```sh
BASE=https://raw.githubusercontent.com/schulydev/SchulyPlugins/repo
NAME=Schuly.Plugin.Schulware
VERSION=2.4.2

# 1. DLL du plugin
curl -L "$BASE/dll/$NAME-v$VERSION.dll" -o /app/plugins/$NAME.dll

# 2. Ses dépendances tierces
curl -L "$BASE/dll/$NAME-v$VERSION-deps.zip" -o /tmp/deps.zip
unzip -o /tmp/deps.zip -d /app/plugins/

# 3. Déposer le Schuly.Plugin.<Name>.yml du plugin dans le plugins-config/ du backend
```

Le backend fournit déjà les assemblies du framework et celles partagées par l'hôte, donc seules
la DLL du plugin et ses dépendances tierces incluses doivent se retrouver dans `plugins/`.
`index.min.json` est le catalogue que les clients lisent pour découvrir les plugins et versions
disponibles.
