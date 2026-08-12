# Contribuire

Il flusso qui sotto è **obbligatorio** - non fare mai commit direttamente su `main`.

## Flusso

1. **Apri una issue etichettata** che descriva la modifica. Scegli l'etichetta giusta
   (ad es. `new-plugin` per un nuovo plugin, più `bug` / `enhancement` / `documentation` / ecc.).
2. **Crea un branch** a partire da `main`: `feature/<issue#>_PascalCase` oppure
   `fix/<issue#>_PascalCase`.
3. **Fai commit** con un oggetto breve e all'imperativo (ad es. `Add OdaOrg vacation sync`).
4. **Apri una PR** che colleghi la issue. Il corpo della PR contiene **solo il riepilogo e
   `Closes #<issue>`** - niente piani di test.
5. **Squash-merge**, poi elimina il branch.

## Regole ferree

- **Nessuna attribuzione a IA/Claude, da nessuna parte - mai.** Né nei messaggi di commit, né
  nei titoli/corpi delle PR, né nel testo delle issue. Nessun trailer `Co-Authored-By`, nessuna
  riga "Generated with".
- Usa i generatori da CLI quando esistono (`gh issue create`, `gh pr create`,
  `dotnet ef migrations add`, `kiota`, …).
- Mantieni le modifiche circoscritte: l'indice di distribuzione pubblicato legge `Version` /
  `Description` / `Authors` dal csproj di ogni plugin, quindi incrementa `<Version>` quando
  cambi il comportamento di un plugin.

## Vedi anche

- [adding-a-plugin.md](adding-a-plugin.md) - scheletro + ciclo di vita.
- [migrations.md](migrations.md) - migrazioni EF Core.
- [setup/kiota-client.md](setup/kiota-client.md) - rigenerare il client Schulware.
- [setup/distribution.md](setup/distribution.md) - come vengono distribuiti i merge su `main`.
