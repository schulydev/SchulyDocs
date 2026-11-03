# Build plugins

A plugin connects Schuly to a school system. It signs in, reads the data, and hands it to Schuly.
Once a server loads your plugin, its school system appears in the app, with no app update.

Plugins are .NET 10 class libraries. They use the
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions) package and
never touch Schuly's database directly.

## Build your first plugin

1. [Set up your environment](/SchulyPlugins/setup/development).
2. [Copy the example plugin](/SchulyPlugins/adding-a-plugin) and learn the plugin lifecycle.
3. [Add a database](/SchulyPlugins/migrations), if your plugin needs its own tables.
4. [Publish your plugin](/SchulyPlugins/setup/distribution).

## Look something up

- [Contract reference](/SchulyPluginAbstractions/contract): every interface and record
- [Versioning](/SchulyPluginAbstractions/versioning): which plugin versions a server accepts
