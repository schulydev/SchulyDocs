# Développement du thème

Le thème de connexion aux couleurs de Schuly se trouve dans `keycloakify/`. C'est un
projet [Keycloakify](https://keycloakify.dev) 11 (React 18 + Vite + Tailwind CSS 4,
avec des composants d'interface façon shadcn sous `src/components/ui`). La
configuration Vite nomme le thème `schuly` et ne construit que le thème de connexion
(`accountThemeImplementation: "none"`).

## Chaîne d'outils

- **Bun** est le gestionnaire de paquets (un `bun.lock` est commité). Installe les
  dépendances avec `bun install`.
- Moteur Node : `^18 || >=20` (l'image de build utilise Node 22).
- **Maven** est requis par Keycloakify pour empaqueter le provider jar (l'étape
  Docker du thème l'installe).

Scripts (`keycloakify/package.json`) :

| Script | Ce qu'il fait |
|---|---|
| `bun run dev` | Serveur de développement Vite pour itérer rapidement sur le thème. |
| `bun run build` | `tsc && vite build`. |
| `bun run build-keycloak-theme` | `build` puis `keycloakify build` - produit le(s) provider jar(s). |
| `bun run storybook` | Storybook (`-p 6006`) pour prévisualiser les pages de connexion isolément. |
| `bun run format` | Prettier. |

> La configuration de Storybook se trouve sous `keycloakify/.storybook/`.
> Utilise-la pour développer les pages de connexion sans Keycloak en cours
> d'exécution.

## Itérer sur le thème en local

```sh
cd keycloakify
bun install
bun run dev          # or: bun run storybook
```

## Comment le thème arrive dans l'image

Le thème n'est **pas** une dépendance d'exécution que tu installes séparément - il
est intégré dans l'image. Dans la première étape du `Dockerfile` (`node:22` +
Maven), le thème est construit avec `npm run build-keycloak-theme`, et le fichier
résultant
`dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar` est copié dans l'étape
builder de Keycloak sous
`/opt/keycloak/providers/schuly-keycloak-theme.jar`. Le `kc.sh build` optimisé
l'intègre ensuite dans l'image finale. Le realm le sélectionne via
`loginTheme: "schuly"`.

> L'étape Docker du thème utilise `npm install` / `npm run build-keycloak-theme`. Le
> `bun.lock` commité sert au développement local ; le build de l'image ne s'appuie
> pas dessus.

Après avoir modifié le thème, reconstruis l'image (`docker compose -f
compose.dev.yml up --build`) pour le voir dans la console en cours d'exécution.
