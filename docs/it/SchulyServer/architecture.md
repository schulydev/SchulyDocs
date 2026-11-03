# Architettura

Usa questa pagina per trovare dove va il codice in SchulyServer e come aggiungerne. Il server è una
soluzione clean architecture con CQRS. Controller sottili inviano comandi e query tramite
[Mediator](https://github.com/martinothamar/Mediator) agli handler nel livello application.
La persistenza e le integrazioni esterne si trovano in infrastructure.

## Progetti

Il file di soluzione è `Schuly.API.slnx`.

| Progetto | Ruolo |
|---|---|
| `Schuly.API` | Punto di ingresso. Controller, configurazione dell'accesso ed endpoint `/auth`, OpenAPI e Scalar, migrazioni all'avvio, host dei plugin, server MCP, Helply. Contiene il `Dockerfile` dell'API. |
| `Schuly.Application` | Comandi e query CQRS, handler Mediator, DTO, mapper, behavior di autorizzazione e di pipeline. Non deve fare riferimento a Infrastructure. |
| `Schuly.Domain` | Entità pure (`School`, `Class`, `Exam`, `Grade`, `Absence`, `AgendaEntry`, `ApplicationUser`, `SchoolUser`, `Teacher`, `SchoolSystem`, `SemesterReport`, `StudentDocument` e altre). Ognuna eredita da `Base` (`Id`, `CreatedAt`, `UpdatedAt`). |
| `Schuly.Infrastructure` | `SchulyDbContext` (incluse le tabelle dell'accesso), servizi utente, storage, il vault dei segreti dei plugin, i servizi del contratto dei plugin (`Plugins/`), repository. |
| `Schuly.Sandbox` | Il sidecar sandbox di Helply, con la propria immagine `ghcr.io/schulydev/schuly-sandbox`. |
| `Schuly.Frontend` | L'app web Angular 22, compilata con Bun. Non fa parte del file di soluzione. L'immagine dell'API la serve da `wwwroot`. |
| `Schuly.Tests`, `Schuly.Tests.Plugin` | Progetti di test (TUnit). |

`Schuly.Plugin.Abstractions` è un `PackageReference` NuGet, non un riferimento a un progetto. Le astrazioni
e i plugin si trovano in repository separati.

## Regole dei livelli

- Le dipendenze puntano verso l'interno: `API → Application → Domain` e `Infrastructure → Application/Domain`.
- `Schuly.Application` non deve fare riferimento a `Schuly.Infrastructure`. Gli handler dipendono dalle astrazioni,
  e il progetto API registra i servizi concreti in `Program.cs`.
- `Schuly.Domain` non ha dipendenze da altri progetti.

## Pipeline delle richieste

`Program.cs` registra tre behavior di pipeline, che vengono eseguiti in quest'ordine:

1. `AuthorizationBehavior`: lancia un'eccezione se un tipo di richiesta non ha l'attributo `[AllowAuthenticated]`.
2. `NotificationOriginBehavior`: segna la richiesta come avviata dall'utente, così le azioni dell'utente non
   producono mai una notifica push per lui.
3. `PluginEventBehavior`: invia i comandi del backend agli handler di eventi dei plugin.

La generazione del codice di Mediator registra gli handler, quindi è sufficiente aggiungere le classi.

## Aggiungi un'entità e un endpoint

1. **Entità:** aggiungila a `Schuly.Domain`, ereditando da `Base`.
2. **DbSet e configurazione:** aggiungili a `Schuly.Infrastructure/SchulyDbContext.cs`.
3. **Migrazione:** vedi [Migrazioni](migrations.md).
4. **Comando o query:** aggiungilo a `Schuly.Application/Commands/<Entity>/` o `Queries/<Entity>/`.
5. **Handler:** aggiungilo accanto al comando o alla query.
6. **Controller:** aggiungine uno sottile a `Schuly.API/Controllers/` che delega a Mediator.

## Storage dei documenti

I documenti degli studenti e gli avatar si trovano in un bucket compatibile con S3. Gli stack inclusi per lo sviluppo e per il self-hosting
usano SeaweedFS, e qualsiasi implementazione S3 funziona senza modifiche al codice. Vedi
[Configurazione](setup/configuration.md#document-storage-s3) per le impostazioni.

Il backend fa da proxy per ogni byte. I client non ricevono mai URL S3 e non si collegano mai direttamente allo storage:

- Carica con `POST /api/students/{id}/documents` (multipart).
- Scarica da `GET /api/documents/{id}`, che restituisce una risposta con il file.

Gli avatar sono l'unica eccezione. Li carichi con `PUT /api/me/avatar`, e il database contiene solo
una semplice chiave del blob. Il server crea un URL di breve durata firmato con HMAC sotto `/api/avatars/users/{id}` a
ogni accesso. Vedi [Firma degli URL degli avatar](setup/configuration.md#avatar-url-signing).

## Server MCP e Helply

`/mcp` è un server Streamable HTTP senza stato. I suoi strumenti si trovano in `Schuly.API/Mcp/Tools`, e la sua autenticazione
in `Schuly.Infrastructure/Mcp`. I token MCP e i JWT di `/api` non funzionano sugli endpoint gli uni degli altri.

Ogni strumento ha bisogno di `[McpAccess(area, level)]`, e le eliminazioni anche di `[McpDestructive]`. Un nuovo strumento
senza `[McpAccess]` è visibile a ogni connessione.

Helply si trova in `Schuly.API/Helply`. Vedi [Configurazione](setup/configuration.md#helply) per Helply e
[Server MCP](setup/configuration.md#mcp-server) per le impostazioni MCP.

## Host dei plugin

Il backend ospita plugin che implementano `ISchulyPlugin` da `Schuly.Plugin.Abstractions`. Il runtime
si trova in `Schuly.API/Plugins`:

- Scarica i plugin da un registro in `/app/plugins` a runtime.
- Carica ogni plugin nel proprio `AssemblyLoadContext` collectible, con un container DI figlio.
- I plugin possono registrare controller, endpoint minimal API e task ricorrenti in background. Lo
  scheduler dell'host esegue ogni task per nome nello scope DI del plugin proprietario.
- `PluginScopeMiddleware` esegue le richieste dei plugin nello scope DI del plugin proprietario.

Vedi [Gestione dei plugin](plugin-management.md) per il registro, l'hot-swap e i task in background.

### Cosa può raggiungere un plugin

I plugin non ricevono mai `SchulyDbContext` né le entità del backend. L'host registra questi servizi del
contratto nel container di ogni plugin:

| Servizio | Basato su |
|---|---|
| `ISchoolData` | `PluginSchoolData` su `SchulyDbContext`, marcato con il nome dell'assembly del plugin come `Source` |
| `IPluginVault` | Il vault persistente, namespace `plugin:<Name>` |
| `IPluginFileStore` | `IDocumentStorage` (S3 cifrato) |
| `IPluginUserContext` | L'utente della richiesta corrente |

Le righe sincronizzate (`AgendaEntry`, `Absence`, `Grade`, `StudentDocument`) hanno `Source` ed `ExternalId`,
univoci per studente. Un `Source` nullo significa che qualcuno ha inserito la riga a mano, e nessun plugin la tocca.

Un plugin può scrivere solo sugli studenti il cui `SchoolUser.Source` è il suo. Il primo plugin che
crea o sincronizza uno studente senza fonte adotta quello studente.

### Dati inseriti a mano

Schuly funziona senza alcun plugin. Sotto `api/me`, un utente che ha effettuato l'accesso può:

- Creare la propria scuola con `POST api/me/schools`, che lo rende suo studente.
- Aggiungere, cambiare e rimuovere le proprie note con `api/me/grades`. La materia e l'esame vengono creati se
  servono.

Le assenze e le voci di agenda usano gli endpoint normali. Le righe inserite a mano hanno un `Source` nullo, quindi nessuna
sincronizzazione le tocca. L'API rifiuta la modifica o l'eliminazione manuale di una riga sincronizzata e nomina il plugin.

Gli orari nelle scritture manuali devono avere un offset UTC (`...Z` o `+02:00`). L'API rifiuta gli orari senza offset.

### Compatibilità del contratto

Prima di creare un plugin, `PluginContract` controlla per quale versione di `Schuly.Plugin.Abstractions` è stato
compilato il plugin:

- **Prima della 1.0:** il MAJOR.MINOR deve corrispondere.
- **Dalla 1.0:** il MAJOR deve corrispondere, e il MINOR del plugin non può essere più recente di quello dell'host.

`PluginContract` rifiuta anche un plugin che fa riferimento a `Schuly.Domain`, `Schuly.Infrastructure`,
`Schuly.Application` o `Schuly.API`. Gli errori di rifiuto nominano entrambe le versioni.
