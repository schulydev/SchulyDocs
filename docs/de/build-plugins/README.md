# Plugins entwickeln

Ein Plugin verbindet Schuly mit einem Schulsystem. Es meldet sich an, liest die Daten und gibt sie
an Schuly weiter. Sobald ein Server dein Plugin lädt, erscheint dessen Schulsystem in der App, ohne
App-Update.

Plugins sind .NET-10-Class-Libraries. Sie nutzen das Paket
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions) und
greifen nie direkt auf die Datenbank von Schuly zu.

## Dein erstes Plugin entwickeln

1. [Richte deine Umgebung ein](/de/SchulyPlugins/setup/development).
2. [Kopiere das Beispiel-Plugin](/de/SchulyPlugins/adding-a-plugin) und lerne den Plugin-Lebenszyklus kennen.
3. [Füge eine Datenbank hinzu](/de/SchulyPlugins/migrations), falls dein Plugin eigene Tabellen braucht.
4. [Veröffentliche dein Plugin](/de/SchulyPlugins/setup/distribution).

## Etwas nachschlagen

- [Vertragsreferenz](/de/SchulyPluginAbstractions/contract): jedes Interface und jeder Record
- [Versionierung](/de/SchulyPluginAbstractions/versioning): welche Plugin-Versionen ein Server akzeptiert
