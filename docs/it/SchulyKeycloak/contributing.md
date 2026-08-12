# Contribuire

Questo repository segue lo stesso flusso di lavoro degli altri progetti Schuly. È
vincolante - seguilo per ogni modifica.

## Flusso di lavoro

1. **Apri un issue** che descrive la modifica, con un'etichetta appropriata (vedi
   sotto).
2. **Crea un branch da `main`** - non lavorare mai direttamente su `main`:
   - `feature/<issue#>_PascalCase` per funzionalità/miglioramenti
   - `fix/<issue#>_PascalCase` per correzioni di bug
3. **Apri una PR** diretta a `main`. Il corpo della PR contiene **solo un riepilogo
   + `Closes #<issue>`** - niente piani di test, niente sezioni aggiuntive.
4. **Fai lo squash-merge** della PR e **elimina il branch**.

## Etichette

Usa una tra: `bug`, `enhancement`, `feature`, `refactor`, `CI/CD`, `dependencies`,
`documentation`.

## Regole fisse

- **Nessuna attribuzione a un'AI o a Claude, da nessuna parte** - né nei commit, né
  nei titoli o corpi delle PR, né nei testi degli issue. Niente "Co-Authored-By",
  "Generated with" o simili. Mai.
- Mantieni gli oggetti dei commit brevi e all'imperativo.
- Usa i generatori da riga di comando (`gh issue create`, `gh pr create`, …) dove
  esistono.

## Versionamento

Le versioni sono tracciate in `application.properties` e sincronizzate dalla CI
con il tag di release - non incrementarle a mano. Vedi [Release](setup/release.md).
