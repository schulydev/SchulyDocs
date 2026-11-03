# Créer des plugins

Un plugin connecte Schuly à un système scolaire. Il se connecte, lit les données et les transmet à
Schuly. Dès qu'un serveur charge ton plugin, son système scolaire apparaît dans l'application, sans
mise à jour de l'application.

Les plugins sont des bibliothèques de classes .NET 10. Ils utilisent le paquet
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions) et
n'accèdent jamais directement à la base de données de Schuly.

## Créer ton premier plugin

1. [Prépare ton environnement](/fr/SchulyPlugins/setup/development).
2. [Copie le plugin d'exemple](/fr/SchulyPlugins/adding-a-plugin) et découvre le cycle de vie d'un plugin.
3. [Ajoute une base de données](/fr/SchulyPlugins/migrations), si ton plugin a besoin de ses propres tables.
4. [Publie ton plugin](/fr/SchulyPlugins/setup/distribution).

## Chercher une information

- [Référence du contrat](/fr/SchulyPluginAbstractions/contract) : chaque interface et chaque record
- [Versionnement](/fr/SchulyPluginAbstractions/versioning) : les versions de plugin qu'un serveur accepte
