# Distribution

Cette page explique comment les plugins passent de `main` à un serveur. Les plugins utilisent le modèle à deux
branches de type Aniyomi :

- `main` contient les projets source C# des plugins.
- `repo` contient les DLL compilées et un index lisible par une machine, le tout généré automatiquement.

## Le workflow de build et de publication

[`build_push.yml`](https://github.com/schulydev/SchulyPlugins/blob/main/.github/workflows/build_push.yml)
s'exécute sur les pushes vers `main` qui touchent `src/Schuly.Plugin.*/**` ou le workflow lui-même, et sur
déclenchement manuel. Un changement uniquement dans `src/Shared/` ne le déclenche pas.

Il a trois jobs :

1. **discover** trouve chaque `src/<folder>/Schuly.Plugin.*.csproj` et émet une matrice de build. Un nouveau
   dossier de plugin avec un csproj ne demande aucun changement du workflow.
2. **build** exécute `dotnet publish -c Release` pour chaque plugin, puis prépare :
   - `dll/<AssemblyName>-v<Version>.dll` : l'assembly du plugin.
   - `dll/<AssemblyName>-v<Version>-deps.zip` : ses dépendances tierces, comme Kiota ou AngleSharp. Le zip
     laisse de côté `Microsoft.AspNetCore.*`, `Microsoft.Extensions.*`,
     `Microsoft.EntityFrameworkCore.*`, `Npgsql.*`, `Mediator.*` et `Schuly.Plugin.Abstractions.dll`, que le
     serveur fournit. Un plugin sans dépendances reçoit un zip qui ne contient qu'un marqueur, pour que le
     schéma de l'index reste uniforme.
   - Un JSON de métadonnées pour le plugin avec `name`, `pkg`, `dll`, `deps`, `version`, `contract`,
     `description` et `authors`. `contract` est le MAJOR.MINOR de `Schuly.Plugin.Abstractions` que le plugin a
     résolu. `name`, `version`, `description` et `authors` viennent du csproj par
     `dotnet msbuild -getProperty`.
3. **publish** fusionne les fichiers JSON dans `index.json`, trié par nom, et dans un `index.min.json` minifié.
   Il remplace ensuite `dll/` et les deux fichiers d'index sur la branche `repo` et fait un commit. La branche
   ne contient que les builds de la dernière exécution.

`AssemblyName`, `Version`, `Description` et `Authors` viennent du csproj de chaque plugin, donc garde-les à
jour.

## Installer un plugin

Les serveurs téléchargent automatiquement les plugins depuis la branche `repo`. Les opérateurs listent les
plugins qu'ils veulent dans `plugins.yml`. Voir [Gestion des plugins](/fr/SchulyServer/plugin-management).
`index.min.json` est le catalogue que les serveurs lisent pour trouver les plugins et les versions.
