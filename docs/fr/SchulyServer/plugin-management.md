# Gestion des plugins

Les plugins connectent Schuly aux systèmes scolaires. Ton serveur les télécharge depuis un registre, tu
ne copies donc aucun fichier à la main.

## Ajouter ou retirer un plugin

Modifie `config/plugins.yml` et redémarre le backend :

```yaml
plugins:
  - name: Schuly.Plugin.Schulware
    version: latest
  - name: Schuly.Plugin.Microsoft
    version: latest
  - name: Schuly.Plugin.OdaOrg
    version: latest
```

Au démarrage, le serveur télécharge ce qui est listé et retire ce qui ne l'est pas. Le système scolaire
d'un plugin apparaît ensuite automatiquement dans l'application. Il n'y a pas d'API d'administration
pour les plugins.

### Faire tourner sans Microsoft 365

1. Retire `Schuly.Plugin.Microsoft` de `plugins.yml`.
2. Dans `compose.staging.yml`, retire le service `schulymicrosoft` et l'entrée correspondante dans le
   `depends_on` du backend.

## Configurer un plugin

Chaque plugin lit `config/plugins-config/<AssemblyName>.yml`. Les valeurs par défaut conviennent à la
plupart des serveurs.

- **Motifs d'absence :** définis `AbsenceReasons` dans `Schuly.Plugin.Schulware.yml`, avec comme clé
  l'hôte de l'URL Schulnetz de l'école.
- **Service Microsoft :** le plugin Microsoft a besoin de `MicrosoftApi.BaseUrl` dans
  `Schuly.Plugin.Microsoft.yml` et ne démarre pas sans cette valeur.

## Changer quand une tâche s'exécute

Les plugins exécutent des tâches récurrentes, comme la synchronisation d'un horaire. Pour remplacer le
planning d'une tâche, ajoute-le au fichier de configuration du plugin :

```yaml
Schedules:
  schulware.sync-timetable:
    Cron: "0 6 * * *"
    Retries: 3
    RunOnStartup: false
```

Si le planning ne peut pas être analysé, la valeur par défaut du plugin s'applique. Les mêmes clés
fonctionnent comme variables d'environnement `SCHULY_PLUGIN_<NAME>_`.

Schuly conserve le planning et l'historique d'exécution de chaque tâche dans la table `PluginTasks`.
Une exécution prévue pendant une interruption a lieu une fois après le démarrage suivant. Une tâche ne
se chevauche jamais elle-même.

## Paramètres

| Clé | Par défaut | Rôle |
|---|---|---|
| `Plugins:Registry` | Branche `repo` de SchulyPlugins | URL de base du registre |
| `Plugins:File` | `<app>/plugins.yml` | La liste des plugins |
| `Plugins:Directory` | `<app>/plugins` | L'emplacement des DLL des plugins |
| `Plugins:ConfigDirectory` | `<app>/plugins-config` | L'emplacement des fichiers de configuration des plugins |

## Comment ça marche

Chaque plugin s'exécute dans son propre `AssemblyLoadContext` collectible avec son propre conteneur de
services. L'hôte câble ses contrôleurs, endpoints et tâches en arrière-plan quand il charge le plugin,
et les retire quand il le décharge. Les DLL de dépendances partagées ont un compteur de références :
retirer un plugin ne supprime donc jamais une DLL qu'un autre plugin utilise.
