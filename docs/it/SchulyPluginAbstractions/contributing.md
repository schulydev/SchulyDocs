# Come contribuire

Queste regole valgono per questo repository. Per branch, commit, pull request ed etichette, segui il
[flusso di lavoro condiviso](/it/contribute/).

Questo repository è il contratto pubblicato, quindi mantienilo piccolo e stabile. Il [versionamento](versioning.md) governa
quasi ogni modifica. Leggilo per primo.

## Regole sulle dipendenze

L'assembly delle astrazioni può fare riferimento solo a:

- la BCL
- il riferimento al framework `Microsoft.AspNetCore.App`

Non aggiungere riferimenti a `Schuly.Application`, `Schuly.Domain` o `Schuly.Infrastructure`. Questi tipi
si trovano in [SchulyServer](https://github.com/schulydev/SchulyServer) e non vengono pubblicati.

I plugin non vedono mai le entità o il `DbContext` del backend. Scrivono i dati scolastici tramite `ISchoolData`
con i record semplici di `SchoolRecords.cs`. Tieni questi record liberi da tipi del backend e aggiungi campi
solo in modo retrocompatibile.

## Scegli un aumento di versione

L'etichetta che scegli per la PR determina la versione della release, quindi applicala con attenzione. Oltre alle etichette
condivise, questo repository usa `breaking-change`. Vedi la tabella in [versionamento](versioning.md).
