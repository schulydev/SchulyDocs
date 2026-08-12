# Contributing

## Workflow obbligatorio

**Non lavorare mai direttamente su `main`.** Ogni modifica segue questo flusso:

1. **Apri un issue etichettato** che descrive la modifica.
2. **Crea un branch** a partire da `main`: `feature/<issue#>_PascalCase` oppure
   `fix/<issue#>_PascalCase`.
3. **Apri una PR** che fa riferimento all'issue con `Closes #<issue>`.
   - Il corpo della PR contiene **solo Summary + `Closes #<issue>`**. Niente piani
     di test.
4. **Squash-merge** e poi elimina il branch.

### Etichette delle PR

`bug`, `enhancement`, `feature`, `refactor`, `CI/CD`, `dependencies`, `documentation`.

### Messaggi di commit

- Soggetto breve e imperativo (ad es. `Add FAQ section`).

## Regola assoluta

**Nessuna attribuzione a IA / Claude, da nessuna parte** - né nei commit, né nei
corpi delle PR, né negli issue. Mai. Niente `Co-Authored-By`, "Generated with" o
simili.

## Standard di codifica

Segui le **convenzioni di codice Angular 20** documentate in
[architecture.md](architecture.md#convenzioni-di-codice-angular-20).

## Vedi anche

- [Ambiente di sviluppo](setup/development.md)
- [Distribuzione](setup/deployment.md)
- [Release](setup/release.md)
