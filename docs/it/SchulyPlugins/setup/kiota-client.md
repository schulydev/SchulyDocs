# Client Kiota

Il plugin Schulware comunica con [SchulwareAPI](https://github.com/schulydev/SchulwareAPI)
tramite un client generato con [Kiota](https://learn.microsoft.com/openapi/kiota/) sotto
`src/Schuly.Plugin.Schulware/Client/`. Il codice generato viene committato; il **JSON OpenAPI
no** - rigeneralo sempre direttamente dall'URL live.

## Prima generazione

```sh
cd src/Schuly.Plugin.Schulware
kiota generate \
  --openapi https://schlwr.pianonic.ch/openapi.json \
  --language CSharp \
  --output Client \
  --namespace-name Schuly.Plugin.Schulware.Client \
  --class-name SchulwareApiClient
```

Questo produce `Client/SchulwareApiClient.cs`, i request builder sotto `Client/Api/`, i DTO sotto
`Client/Models/` e un `Client/kiota-lock.json` che registra l'URL di origine, la versione del
generatore e l'insieme di serializzatori/deserializzatori usato.

## Aggiornare dopo una modifica dell'API

Una volta creato il lockfile, rilancia da dentro `Client/`:

```sh
cd src/Schuly.Plugin.Schulware/Client
kiota update
```

`kiota update` legge `kiota-lock.json` e rigenera contro lo stesso `descriptionLocation`
(l'URL OpenAPI live) con le opzioni registrate - equivalente a rilanciare `kiota generate`.

## Regole

- **Non committare mai il JSON OpenAPI** in locale. La generazione lo legge sempre dall'URL
  live, così il client segue la versione dell'API effettivamente distribuita.
- I pacchetti runtime di Kiota (`Microsoft.Kiota.*`) sono `PackageReference` in
  `Schuly.Plugin.Schulware.csproj`; mantieni le loro versioni compatibili con il generatore.
- Una rigenerazione è una modifica di codice come un'altra - segui il flusso di
  [contribuzione](../contributing.md).
