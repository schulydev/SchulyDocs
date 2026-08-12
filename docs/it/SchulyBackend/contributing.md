# Come contribuire

Un flusso di lavoro breve e vincolante mantiene la cronologia pulita e rilasciabile.

## Flusso di lavoro

1. **Apri un issue etichettato** che descriva la modifica. Applica un'etichetta
   dalla tassonomia sottostante.
2. **Crea un branch da `main`**: `feature/<issue#>_PascalCase` o `fix/<issue#>_PascalCase`.
   Non fare mai commit direttamente su `main`.
3. **Apri una PR** (anch'essa etichettata) verso `main`. Il corpo della PR è
   **Summary** più `Closes #<issue>` - nient'altro (nessun piano di test).
4. **Squash-merge** ed elimina il branch.

## Messaggi di commit

- Soggetto breve e imperativo (es. `Add absences endpoint`).
- Nessun rumore nel corpo; resta concentrato su cosa/perché.

## Etichette

Usa un'etichetta coerente con la tassonomia dell'organizzazione:

| Etichetta | Da usare per |
|---|---|
| `bug` | Un difetto / comportamento errato. |
| `enhancement` | Miglioramento di un comportamento esistente. |
| `feature` | Nuova funzionalità. |
| `refactor` | Ristrutturazione interna, nessuna modifica di comportamento. |
| `CI/CD` | Modifiche a build, release e workflow. |
| `dependencies` | Aggiornamenti delle dipendenze. |
| `documentation` | Modifiche riguardanti solo la documentazione. |

## Versionamento

`application.properties` è l'unica fonte di verità per la versione e viene
sincronizzato automaticamente dal tag di release quando una release viene
pubblicata - vedi [Produzione](setup/production.md). Non incrementarlo manualmente
nelle PR di funzionalità.

## Aspettative sul codice

- Rispetta le [regole di suddivisione in livelli](architecture.md):
  `Schuly.Application` non deve referenziare `Schuly.Infrastructure`.
- I controller restano snelli e delegano a Mediator; la logica risiede negli handler.
- Aggiungi test in `Schuly.Tests` dove ha senso farlo.
