# Come contribuire

Usa questa pagina per le regole e i controlli specifici del server. Per issue, branch, pull request
ed etichette, segui il [flusso di lavoro condiviso](/it/contribute/).

## Regole per il codice

- Rispetta le [regole dei livelli](architecture.md#regole-dei-livelli): `Schuly.Application` non deve fare riferimento a
  `Schuly.Infrastructure`.
- Mantieni sottili i controller. Delegano a Mediator, e la logica sta negli handler.
- Aggiungi test a `Schuly.Tests` dove ha senso.
- Tieni le firme delle dichiarazioni su una riga, anche se lunghe. Non andare a capo nell'elenco dei parametri di un `record`,
  di una `class` o `struct` con costruttore primario, di un metodo o di un costruttore. Lascia a capo le catene di metodi, le query
  LINQ e le condizioni su più righe.
- Usa Bun per i task del frontend, non npm, npx o node.
- Concentra il corpo del commit su cosa è cambiato e perché.

## Versionamento

Non aumentare `application.properties` a mano nelle pull request di funzionalità. La pubblicazione di una release lo sincronizza
dal tag. Vedi [Immagini e release](setup/production.md).

## Controlli

La CI li esegue su ogni pull request. Per eseguirli tu:

```sh
dotnet restore Schuly.API.slnx
dotnet build Schuly.API.slnx -c Release --no-restore -warnaserror
dotnet test Schuly.API.slnx -c Release --no-build
```

```sh
cd src/Schuly.Frontend
bun install --frozen-lockfile
bun run build
bun run test --watch=false
```

La CI compila anche l'immagine della sandbox quando una pull request modifica `src/Schuly.Sandbox/**`.
