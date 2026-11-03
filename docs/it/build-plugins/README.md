# Crea plugin

Un plugin collega Schuly a un sistema scolastico. Accede, legge i dati e li passa a Schuly. Quando un
server carica il tuo plugin, il suo sistema scolastico compare nell'app, senza aggiornare l'app.

I plugin sono class library .NET 10. Usano il pacchetto
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions) e non
accedono mai direttamente al database di Schuly.

## Crea il tuo primo plugin

1. [Configura il tuo ambiente](/it/SchulyPlugins/setup/development).
2. [Copia il plugin di esempio](/it/SchulyPlugins/adding-a-plugin) e impara il ciclo di vita dei plugin.
3. [Aggiungi un database](/it/SchulyPlugins/migrations), se il tuo plugin ha bisogno di tabelle proprie.
4. [Pubblica il tuo plugin](/it/SchulyPlugins/setup/distribution).

## Cerca un'informazione

- [Riferimento del contratto](/it/SchulyPluginAbstractions/contract): ogni interfaccia e record
- [Versionamento](/it/SchulyPluginAbstractions/versioning): quali versioni di plugin accetta un server
