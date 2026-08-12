# Sviluppo del tema

Il tema di login personalizzato Schuly si trova in `keycloakify/`. È un progetto
[Keycloakify](https://keycloakify.dev) 11 (React 18 + Vite + Tailwind CSS 4, con
componenti UI in stile shadcn sotto `src/components/ui`). La configurazione Vite
chiama il tema `schuly` e compila solo il tema di login
(`accountThemeImplementation: "none"`).

## Toolchain

- **Bun** è il package manager (un `bun.lock` è committato). Installa le
  dipendenze con `bun install`.
- Engine Node: `^18 || >=20` (l'immagine di build usa Node 22).
- **Maven** è richiesto da Keycloakify per impacchettare il provider jar (lo stage
  Docker del tema lo installa).

Script (`keycloakify/package.json`):

| Script | Cosa fa |
|---|---|
| `bun run dev` | Server di sviluppo Vite per iterare rapidamente sul tema. |
| `bun run build` | `tsc && vite build`. |
| `bun run build-keycloak-theme` | `build`, poi `keycloakify build` - produce il/i provider jar. |
| `bun run storybook` | Storybook (`-p 6006`) per visualizzare le pagine di login in isolamento. |
| `bun run format` | Prettier. |

> La configurazione di Storybook si trova in `keycloakify/.storybook/`. Usala per
> sviluppare le pagine di login senza un Keycloak in esecuzione.

## Iterare sul tema in locale

```sh
cd keycloakify
bun install
bun run dev          # or: bun run storybook
```

## Come il tema arriva nell'immagine

Il tema **non** è una dipendenza di runtime che installi separatamente - viene
integrato nell'immagine. Nel primo stage del `Dockerfile` (`node:22` + Maven), il
tema viene compilato con `npm run build-keycloak-theme`, e il file risultante
`dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar` viene copiato nello
stage builder di Keycloak come
`/opt/keycloak/providers/schuly-keycloak-theme.jar`. Il `kc.sh build` ottimizzato
lo integra poi nell'immagine finale. Il realm lo seleziona tramite
`loginTheme: "schuly"`.

> Lo stage Docker del tema usa `npm install` / `npm run build-keycloak-theme`. Il
> `bun.lock` committato serve per lo sviluppo locale; il build dell'immagine non
> dipende da esso.

Dopo aver modificato il tema, ricostruisci l'immagine (`docker compose -f
compose.dev.yml up --build`) per vederlo nella console in esecuzione.
