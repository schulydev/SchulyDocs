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

## Tâches de fond

Un plugin déclare une tâche récurrente en enregistrant un `IPluginBackgroundTask` : un
nom, un `PluginSchedule` (une expression cron plus des retries optionnels et
`RunOnStartup`), et un corps `ExecuteAsync`. Le backend ne laisse jamais un plugin
parler directement à TickerQ - il possède une seule fonction ticker côté hôte qui
renvoie l'exécution dans le scope DI propre au plugin, par nom de plugin et de tâche.
Cette indirection existe parce qu'une assembly de plugin est chargée à l'exécution dans
un `AssemblyLoadContext` collectible ; une `[TickerFunction]` déclarée à l'intérieur ne
serait jamais vue par le générateur de code source de TickerQ, qui ne s'exécute qu'à la
compilation de l'hôte.

Le planning de chaque tâche est persisté dans la base de données principale (schéma
`ticker` de TickerQ), pas gardé en mémoire. Le planning, la prochaine exécution et
l'historique des exécutions survivent donc à un redémarrage - et une exécution prévue
pendant une interruption n'est pas sautée en silence.

Un opérateur peut surcharger la cadence d'une tâche par plugin dans
`plugins-config/<AssemblyName>.yml` :

```yaml
Schedules:
  schulware.sync-timetable:
    Cron: "0 6 * * *"
    Retries: 3
    RunOnStartup: false
```

Une surcharge qui n'est pas lisible (une expression cron mal tapée, par exemple) est
ignorée au profit de la valeur par défaut du plugin, plutôt que de mettre la tâche hors
service. Les mêmes clés fonctionnent comme variables d'environnement
`SCHULY_PLUGIN_<NAME>_`, comme le reste de la configuration des plugins.

`GET /api/plugins/scheduler` indique pour chaque tâche son cron, sa dernière exécution,
sa prochaine exécution et ses compteurs d'échecs. Le tableau de bord TickerQ est monté
sur `/tickerq` en Development uniquement.

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
| `GET` | `/api/plugins/scheduler` | Plannings des tâches de fond, dernière/prochaine exécution, compteurs d'échecs. |
| `GET` | `/api/plugins/registry` | Plugins disponibles dans le registre. |
| `POST` | `/api/plugins/install` | `{ "name": "...", "version": "latest" }` - télécharge + charge. |
| `POST` | `/api/plugins/{name}/update` | Met à jour vers la dernière version du registre. |
| `DELETE` | `/api/plugins/{name}` | Décharge + supprime. |

Chaque changement est appliqué en cours de processus et persisté dans `plugins.yml`,
donc il survit à un redémarrage. Les DLL de dépendances partagées sont comptées par
référence : supprimer un plugin ne supprime jamais une dépendance qu'un autre plugin
utilise encore.
