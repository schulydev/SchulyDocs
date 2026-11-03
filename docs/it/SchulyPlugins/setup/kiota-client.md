# Client Kiota

Usa questa pagina per rigenerare il client che il plugin Schulware usa per chiamare
[SchulwareAPI](https://github.com/schulydev/SchulwareAPI). È un client generato con
[Kiota](https://learn.microsoft.com/openapi/kiota/) in
`src/Schuly.Plugin.Schulware/Client/`.

Il codice generato è nel repository. Il JSON OpenAPI no, quindi rigeneri sempre dall'URL attivo.

## Aggiorna dopo le modifiche all'API

Esegui questo comando dall'interno di `Client/`:

```sh
cd src/Schuly.Plugin.Schulware/Client
kiota update --output .
```

`kiota update` legge `kiota-lock.json` e rigenera sullo stesso `descriptionLocation`, l'URL OpenAPI attivo,
con le opzioni registrate. Dà lo stesso risultato di una nuova esecuzione di `kiota generate`.
Senza `--output .`, cerca in `./output` e fallisce.

## Genera da zero

```sh
cd src/Schuly.Plugin.Schulware
kiota generate \
  --openapi https://schlwr.pianonic.ch/openapi.json \
  --language CSharp \
  --output Client \
  --namespace-name Schuly.Plugin.Schulware.Client \
  --class-name SchulwareApiClient
```

Questo produce `Client/SchulwareApiClient.cs`, i request builder in `Client/Api/`, i DTO in
`Client/Models/` e `Client/kiota-lock.json`. Il file di lock registra l'URL sorgente, la versione del
generatore e l'insieme di serializer e deserializer.

## Regole

- **Non fare mai il commit del JSON OpenAPI.** La generazione lo legge sempre dall'URL attivo, così il client segue
  l'API distribuita.
- Mantieni i pacchetti runtime di Kiota (`Microsoft.Kiota.*`) compatibili con il generatore. Sono
  `PackageReference` in `Schuly.Plugin.Schulware.csproj`.
- Tratta la rigenerazione come una modifica al codice. Segui il [flusso di lavoro condiviso](/it/contribute/).
