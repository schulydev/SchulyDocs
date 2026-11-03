# Versionamento

Usa questa pagina per scegliere l'aumento di versione giusto per una modifica al contratto.

Questo pacchetto segue il semver in modo rigoroso. I plugin fanno riferimento al pacchetto e l'host fornisce l'assembly a
runtime, quindi una modifica fatta senza attenzione rompe tutti i plugin in uso.

## Regole

| Modifica | Aumento | Etichetta della PR |
|---|---|---|
| Cambiare la firma di un metodo, aggiungere un metodo a un'interfaccia esistente o rinominare un membro | **MAJOR** | `breaking-change` |
| Aggiungere una nuova interfaccia facoltativa o un metodo con implementazione predefinita | **MINOR** | `feature` |
| Modifiche a documentazione, metadati o packaging | **PATCH** | Non serve |

## Come viene ricavata la versione

- `application.properties` contiene la `<version>` corrente. È l'unica fonte di verità.
  `src/Directory.Build.props` la legge in `$(Version)` durante build e pack.
- **release-drafter** (`.github/release-drafter.yml`) ricava la versione successiva dalle etichette delle
  PR unite e prepara il changelog:
  - `breaking` o `breaking-change`: major
  - `feature`, `enhancement` o `minor`: minor
  - tutto il resto: patch
- La creazione della release avvia il flusso di pubblicazione, che sincronizza `application.properties` con il tag prima del
  pack. Vedi [pubblicazione](setup/publishing.md).

## Stabilità della versione dell'assembly

`Directory.Build.props` fissa la versione dell'assembly a `MAJOR.MINOR.0.0`. `FileVersion` e
`InformationalVersion` contengono la versione completa.

Un plugin compilato per un qualsiasi `MAJOR.MINOR.x` si lega a un unico assembly `MAJOR.MINOR.0.0`. Gli aumenti di patch non obbligano
a ricompilare tutti i plugin e non causano errori di caricamento dei tipi tra versioni patch. Solo un aumento MINOR o MAJOR
cambia la versione dell'assembly a cui ci si lega: è un motivo in più per seguire esattamente la tabella qui sopra.

## Prima della 1.0

Finché la versione è `0.x`, una modifica incompatibile aumenta MINOR (da `0.3` a `0.4`) invece di MAJOR. Crea la
release con un `gh release create v0.<next>.0` esplicito, non con la versione che release-drafter suggerisce per un'etichetta
`breaking-change`.

## Compatibilità al caricamento

Il backend confronta la versione dell'assembly `Schuly.Plugin.Abstractions` per cui è stato compilato un plugin con la
propria. Rifiuta un plugin incompatibile con un messaggio chiaro nel log, così il plugin non fallisce più tardi con un
errore di caricamento dei tipi.

| Contratto dell'host | Un plugin è compatibile quando |
|---|---|
| `1.x` e successivi | Ha lo stesso MAJOR, e il suo MINOR non è più recente di quello dell'host |
| `0.x` | Ha lo stesso MAJOR.MINOR |

Quindi durante `0.x` i plugin devono essere ricompilati dopo ogni release MINOR.
