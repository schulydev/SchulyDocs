# Contribuire

Il workflow di contribuzione è **obbligatorio** - seguilo esattamente.

## Regole fisse

- **Non lavorare mai direttamente su `main`.** Ogni modifica passa attraverso un
  ciclo issue → branch → PR.
- **Nessuna attribuzione a AI / Claude, mai.** I messaggi di commit, i titoli/corpi
  delle PR e i testi delle issue non devono menzionare AI, Claude o alcun assistente,
  e non devono includere righe `Co-Authored-By` o "Generated with".
- **Nessun piano di test nelle PR.** Il corpo della PR è **solo Summary +
  `Closes #<issue>`**.
- **Preferire i generatori CLI** ogni volta che ne esiste uno (`gh issue create`,
  `gh pr create`, ecc.) invece di passaggi manuali.

## Workflow

1. **Crea un'issue etichettata** che descriva la modifica.

   ```sh
   gh issue create --title "..." --body "..." --label <label>
   ```

2. **Crea un branch a partire da `main`**, usando il numero dell'issue e uno slug in
   `PascalCase`:

   ```sh
   git switch -c feature/<issue#>_PascalCase   # nuova funzionalità
   git switch -c fix/<issue#>_PascalCase       # correzione di bug
   ```

3. **Fai il commit** con un soggetto breve e imperativo (es. `Add agenda filter`).

4. **Apri una PR** (etichettata) il cui corpo contenga solo un breve riepilogo e il
   riferimento di chiusura:

   ```sh
   gh pr create --title "..." --label <label> --body "Summary of the change.

   Closes #<issue>"
   ```

5. **Fai squash-merge ed elimina il branch** una volta approvata la PR.

## Convenzione per i nomi dei branch

| Tipo | Modello | Esempio |
| --- | --- | --- |
| Feature | `feature/<issue#>_PascalCase` | `feature/123_AgendaFilter` |
| Fix | `fix/<issue#>_PascalCase` | `fix/124_LoginCrash` |

## Label

Applica la label appropriata sia all'issue sia alla PR:

| Label | Da usare per |
| --- | --- |
| `bug` | Segnalazioni di difetti |
| `enhancement` | Miglioramenti a un comportamento esistente |
| `feature` | Nuove funzionalità |
| `refactor` | Ristrutturazione interna, senza cambio di comportamento |
| `CI/CD` | Modifiche a pipeline / workflow |
| `dependencies` | Aggiornamenti delle dipendenze |
| `documentation` | Modifiche solo alla documentazione |

## Prima di aprire una PR

Esegui i controlli di qualità (vedi
[Configurazione per lo sviluppo](setup/development.md)):

```sh
bun run analyze
bun run test
bun run format
```
