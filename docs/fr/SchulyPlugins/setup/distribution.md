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

## Installation

Les serveurs téléchargent automatiquement les plugins depuis cette branche. Les opérateurs listent les
plugins qu'ils veulent dans `plugins.yml`. Voir [Gestion des plugins](/fr/SchulyServer/plugin-management).
`index.min.json` est le catalogue que les serveurs lisent pour trouver les plugins et les versions.
