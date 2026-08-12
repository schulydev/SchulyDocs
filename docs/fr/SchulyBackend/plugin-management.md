# Gestion des plugins

Les plugins sont chargés dans le backend à l'exécution depuis un registre - pas de
rebuild, pas de dépôt manuel de DLL, pas de redémarrage.

## Comment ça marche

- Le **registre** (`Plugins:Registry`, par défaut la branche `repo` de SchulyPlugins)
  sert un `index.min.json` et des artefacts sous `dll/` : `dll/<name>-v<ver>.dll` plus
  un `-deps.zip` contenant les dépendances privées du plugin.
- L'**ensemble désiré** vit dans `plugins.yml` (`Plugins:File`). Au démarrage, le
  backend le réconcilie avec le registre + le répertoire des plugins : il télécharge
  les plugins manquants ou obsolètes, retire ceux qui ne sont plus listés, puis les
  charge.
- **Hot-swap** : chaque plugin s'exécute dans son propre `AssemblyLoadContext`
  collectible avec son propre conteneur de services enfant. Ses contrôleurs, endpoints
  minimal-API et tâches de fond sont câblés au chargement et démontés au déchargement -
  le processus en cours d'exécution ne redémarre jamais. Les requêtes destinées à un
  plugin s'exécutent dans le scope DI propre au plugin (avec repli sur les services de
  l'hôte).

## Configuration

| Clé | Par défaut | Rôle |
|---|---|---|
| `Plugins:Registry` | Branche `repo` de SchulyPlugins | URL de base du registre. |
| `Plugins:File` | `<app>/plugins.yml` | Ensemble désiré de plugins, déclaratif. |
| `Plugins:Directory` | `<app>/plugins` | Où sont stockées les DLL de plugins. |
| `Plugins:ConfigDirectory` | `<app>/plugins-config` | Configuration `<AssemblyName>.yml` par plugin. |

## Endpoints d'administration (`Administrator`)

| Méthode | Route | Action |
|---|---|---|
| `GET` | `/api/plugins` | Plugins chargés. |
| `GET` | `/api/plugins/registry` | Plugins disponibles dans le registre. |
| `POST` | `/api/plugins/install` | `{ "name": "...", "version": "latest" }` - télécharge + charge. |
| `POST` | `/api/plugins/{name}/update` | Met à jour vers la dernière version du registre. |
| `DELETE` | `/api/plugins/{name}` | Décharge + supprime. |

Chaque changement est appliqué en cours de processus et persisté dans `plugins.yml`,
donc il survit à un redémarrage. Les DLL de dépendances partagées sont comptées par
référence : supprimer un plugin ne supprime jamais une dépendance qu'un autre plugin
utilise encore.
