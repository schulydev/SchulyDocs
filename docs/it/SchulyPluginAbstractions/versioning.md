# Versionamento

Questo pacchetto è un contratto pubblicato, quindi il versionamento è **semver rigoroso**. Il
senso stesso di questo repository è la stabilità: i plugin referenziano il pacchetto, e l'host
fornisce l'assembly a runtime, quindi una modifica incauta rompe ogni plugin sul campo.

## Regole

| Modifica | Bump | Label PR |
|---|---|---|
| Cambiare la firma di un metodo, aggiungere un metodo a un'interfaccia esistente, o rinominare un membro | **MAJOR** | `breaking-change` |
| Aggiungere una nuova interfaccia opzionale, o un metodo con implementazione predefinita | **MINOR** | `feature` |
| Modifiche a doc / metadati / packaging | **PATCH** | *(predefinito - nessuna label necessaria)* |

## Come viene risolta la versione

- `application.properties` contiene la `<version>` corrente; è l'unica fonte di verità e viene
  letta in `$(Version)` da `src/Directory.Build.props` durante build/pack.
- **release-drafter** (`.github/release-drafter.yml`) risolve la *prossima* versione in base
  alle label sulle PR mergiate: `breaking-change` → major, `feature` → minor, tutto il resto →
  patch. Redige anche il changelog.
- Il taglio della release esegue quindi il flusso di pubblicazione, che sincronizza
  `application.properties` con il tag prima della pacchettizzazione. Vedi
  [pubblicazione](setup/publishing.md).

## Stabilità della versione di assembly

`Directory.Build.props` fissa la versione di **assembly** a `MAJOR.MINOR.0.0` (mentre
`FileVersion`/`InformationalVersion` portano la versione completa). Un plugin costruito contro
qualsiasi `MAJOR.MINOR.x` si lega a un'unica assembly `MAJOR.MINOR.0.0`, così i bump di patch
non forzano una ricompilazione di ogni plugin e non causano errori di caricamento dei tipi tra
versioni patch. Solo un bump **MINOR o MAJOR** cambia la versione di assembly di binding - un
motivo in più per seguire esattamente la tabella sopra.
