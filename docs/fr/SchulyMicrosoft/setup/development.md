# Configuration de développement

Exécute le service en local et lance ses tests.

## Exécuter le service

```sh
pip install -r requirements.txt
python asgi.py
```

Le service écoute sur `http://localhost:8010`. La référence de l'API est à `/docs`.

Ou exécute-le avec Docker :

```sh
docker build -t schulymicrosoft .
docker run -p 8010:8010 schulymicrosoft
```

## Exécuter les tests

Les tests sont entièrement simulés et n'effectuent aucun appel à Microsoft.

```sh
python -m pytest tests -q
```

## Règles pour les modifications

- N'ajoute pas de points d'entrée pour des identifiants autres que la connexion par mot de passe existante.
- Garde les mots de passe hors des journaux, des tâches de connexion, des erreurs et des réponses.
- Garde le service dans un seul processus. N'ajoute ni workers ni réplicas.
- Utilise uniquement les API publiques d'OutNote et d'Entrance.

Pour le processus, voir [Contribuer](/fr/contribute/).
