# Architettura

SchulyServer è una soluzione ad architettura pulita con CQRS. Le richieste arrivano
a controller snelli, che smistano comandi/query tramite [Mediator](https://github.com/martinothamar/Mediator)
verso gli handler nel livello applicativo; la persistenza e le integrazioni esterne
risiedono nel livello infrastrutturale.

## Progetti

La soluzione (`Schuly.API.slnx`) è suddivisa nei seguenti progetti:

| Progetto | Ruolo |
|---|---|
| `Schuly.API` | Punto di ingresso. Controller, cablaggio dell'accesso ed endpoint `/auth`, OpenAPI/Scalar, migrazioni all'avvio, registrazione dell'host dei plugin. Possiede il `Dockerfile`. |
| `Schuly.Application` | Comandi/query CQRS + handler Mediator, DTO, mapper, autorizzazione e pipeline behavior. **Non deve** referenziare Infrastructure. |
| `Schuly.Domain` | Entità pure (`School`, `Class`, `Exam`, `Grade`, `Absence`, `AgendaEntry`, `ApplicationUser`, `SchoolUser`, `Teacher`, `SchoolSystem`, `SemesterReport`, `StudentDocument`, …). Ognuna eredita da `Base` (`Id`, `CreatedAt`, `UpdatedAt`). |
| `Schuly.Infrastructure` | `SchulyDbContext` (incluse le tabelle dell'accesso), servizi utente, storage e il vault dei segreti dei plugin, i servizi del contratto dei plugin (`Plugins/`), repository. |
| `Schuly.Tests` / `Schuly.Tests.Plugin` | Progetti di test (TUnit). |

`Schuly.Plugin.Abstractions` viene consumato come **`PackageReference` NuGet**, non
come riferimento di progetto. Le abstraction e le implementazioni dei plugin vivono
in repository separati.

## Regole di suddivisione in livelli

- Le dipendenze puntano verso l'interno: `API → Application → Domain`, e
  `Infrastructure → Application/Domain`.
- **`Schuly.Application` non deve referenziare `Schuly.Infrastructure`.** Gli handler
  dipendono da astrazioni; è il progetto API a comporre i servizi infrastrutturali
  concreti nel contenitore DI all'avvio (`Program.cs`).
- `Schuly.Domain` non ha dipendenze di progetto - le entità restano pure.

## Pipeline delle richieste

I controller sono snelli e delegano a Mediator. Due pipeline behavior vengono
registrati esplicitamente in `Program.cs` ed eseguiti nell'ordine di registrazione:

1. `AuthorizationBehavior` - applica i controlli sui ruoli prima che l'handler venga eseguito.
2. `PluginEventBehavior` - inoltra i comandi del backend agli handler di evento dei plugin.

Gli handler Mediator vengono registrati automaticamente tramite source generation,
quindi un nuovo comando/query e il relativo handler vengono cablati semplicemente
aggiungendo le classi.

## Storage dei documenti

I documenti degli studenti e gli avatar sono conservati in un bucket compatibile
S3 - SeaweedFS negli stack di sviluppo e self-hosting inclusi, anche se qualsiasi
implementazione S3 funziona senza modifiche al codice. Vedi
[Configurazione](setup/configuration.md#storage-dei-documenti-s3) per le impostazioni.

Il backend **inoltra ogni byte lui stesso**: i client non ricevono mai URL S3 e non
si collegano mai direttamente al backend di storage. I caricamenti vanno a
`POST /api/students/{id}/documents` (multipart) e i download arrivano da
`GET /api/documents/{id}` come risposta file. Gli avatar sono l'unica eccezione - vengono
caricati con `PUT /api/me/avatar`, il database conserva solo una chiave blob nuda, e
un URL di capability firmato HMAC e di breve durata sotto `/api/avatars/users/{id}`
viene generato a ogni accesso (vedi
[Firma degli URL degli avatar](setup/configuration.md#firma-degli-url-degli-avatar)).

## Aggiungere un'entità + un endpoint

1. **Entità** in `Schuly.Domain` (eredita da `Base`).
2. **DbSet + configurazione** in `Schuly.Infrastructure/SchulyDbContext.cs`.
3. **Migrazione** - vedi [Migrazioni](migrations.md).
4. **Comando/Query** in `Schuly.Application/Commands/<Entity>/` o
   `Queries/<Entity>/`.
5. **Handler** accanto al comando/query (registrato automaticamente tramite Mediator source-gen).
6. **Controller** in `Schuly.API/Controllers/` - snello, delega a Mediator.

## Host dei plugin

Il backend ospita plugin che implementano `ISchulyPlugin` da
`Schuly.Plugin.Abstractions`. Il runtime dei plugin si trova in `Schuly.API/Plugins`:
i plugin vengono scaricati a runtime da un registro in `/app/plugins`, ciascuno
caricato nel proprio `AssemblyLoadContext` collezionabile con un contenitore DI
figlio, e possono registrare controller, endpoint minimal-API e attività ricorrenti
in background - eseguite dallo scheduler dell'host e reinoltrate per nome allo scope DI del
plugin proprietario. Le richieste ai plugin vengono eseguite all'interno dello scope
DI del plugin proprietario tramite `PluginScopeMiddleware`. Vedi
[Gestione dei plugin](plugin-management.md) per il registro, l'hot-swap, le attività
in background e gli endpoint di amministrazione.

### Cosa può raggiungere un plugin

I plugin non ricevono mai `SchulyDbContext` né le entità del backend. L'host registra
i servizi del contratto nel contenitore di ciascun plugin:

| Servizio | Basato su |
|---|---|
| `ISchoolData` | `PluginSchoolData` su `SchulyDbContext`, marcato con il nome dell'assembly del plugin come `Source` |
| `IPluginVault` | Il vault persistente, namespace `plugin:<Name>` |
| `IPluginFileStore` | `IDocumentStorage` (S3 cifrato) |
| `IPluginUserContext` | L'utente della richiesta corrente |

Le righe sincronizzate (`AgendaEntry`, `Absence`, `Grade`, `StudentDocument`) portano
`Source` e `ExternalId`, univoci per studente; `Source` null significa che la riga è
stata inserita a mano e nessun plugin la tocca. Un plugin può scrivere solo sugli
studenti il cui `SchoolUser.Source` è il suo; uno studente senza ancora una fonte
viene adottato dal primo plugin che lo crea o lo sincronizza.

### Dati inseriti a mano

Schuly funziona senza alcun plugin. Sotto `api/me` un utente che ha effettuato
l'accesso crea una propria scuola (`POST api/me/schools`, ne diventa lo studente) e
aggiunge, modifica e rimuove i propri voti (`api/me/grades`; la materia e la verifica
vengono create se necessario). Assenze e voci dell'agenda usano gli endpoint normali.
Le righe inserite a mano hanno `Source` null, quindi nessuna sincronizzazione le
tocca; una modifica o cancellazione manuale di una riga sincronizzata viene rifiutata
con il nome del plugin. Gli orari nelle scritture manuali devono avere un offset UTC
(`...Z` o `+02:00`); gli orari senza offset vengono rifiutati.

### Compatibilità del contratto

Prima di istanziare un plugin, `PluginContract` controlla la versione di
`Schuly.Plugin.Abstractions` con cui il plugin è stato compilato. Prima della 1.0
MAJOR.MINOR devono coincidere; dalla 1.0 deve coincidere il MAJOR e il MINOR del
plugin non può essere più recente di quello dell'host. Viene rifiutato anche un
plugin che referenzia `Schuly.Domain`, `Schuly.Infrastructure`, `Schuly.Application`
o `Schuly.API`. I rifiuti indicano entrambe le versioni nell'errore.
