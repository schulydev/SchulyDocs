# Contributing

Questo repository è il **contratto pubblicato stabile**. Mantienilo piccolo, mantienilo
stabile. Quasi ogni modifica è governata dal [versionamento](versioning.md) - leggilo prima.

## Regole sulle dipendenze

L'assembly abstractions deve referenziare **solo**:

- la BCL, e
- il framework reference `Microsoft.AspNetCore.App`.

**Non** aggiungere riferimenti a `Schuly.Application` (quei tipi vivono in
[SchulyBackend](https://github.com/schulydev/SchulyBackend) e non vengono pubblicati).

> Il repository distribuisce le DLL del backend `Schuly.Domain.dll` e
> `Schuly.Infrastructure.dll` come binari precompilati sotto
> `src/Schuly.Plugin.Abstractions/libs/` (sincronizzati dal backend), così i plugin ottengono
> un accesso tipizzato al database; i pacchetti EF Core di cui queste DLL hanno bisogno sono
> dichiarati nel csproj. Non trasformarle in riferimenti di progetto e non importare altro
> codice sorgente del backend in questo repository.

## Workflow (obbligatorio)

1. **Apri un'issue etichettata** che descrive la modifica. Usa la label corretta affinché
   release-drafter risolva correttamente la versione successiva (`breaking-change`, `feature`,
   `documentation`, `CI/CD`, `dependencies`, `bug`, `refactor`).
2. **Crea un branch** da `main`: `feature/<issue#>_PascalCase` oppure
   `fix/<issue#>_PascalCase`. Non committare mai direttamente su `main`.
3. **Apri una PR** con `Closes #<issue>`. Il corpo della PR è **solo Summary +
   `Closes #<issue>`** - niente piani di test.
4. **Squash-merge** ed elimina il branch.

I soggetti dei commit sono brevi e all'imperativo.

## Nessuna attribuzione AI

Non aggiungere mai attribuzioni AI / assistente da nessuna parte - né nei messaggi di commit,
né nelle descrizioni delle PR, né nei testi delle issue. Nessun trailer `Co-Authored-By`,
nessuna riga "generated with". Mai.

## Scegliere il bump di versione

Vedi la tabella in [versionamento](versioning.md). La label di PR che scegli determina la
versione della release, quindi scegli con attenzione.
