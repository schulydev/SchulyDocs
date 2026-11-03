# Contribuer

Utilise cette page pour les règles et les contrôles propres au serveur. Pour les issues, les branches, les pull
requests et les labels, suis le [processus partagé](/fr/contribute/).

## Règles de code

- Respecte les [règles de couches](architecture.md#regles-de-couches) : `Schuly.Application` ne doit pas
  référencer `Schuly.Infrastructure`.
- Garde les contrôleurs légers. Ils délèguent à Mediator, et les handlers contiennent la logique.
- Ajoute des tests à `Schuly.Tests` quand c'est pertinent.
- Garde les signatures de déclaration sur une seule ligne, quelle que soit leur longueur. Ne coupe pas la liste
  de paramètres d'un `record`, d'une `class` ou d'un `struct` à constructeur principal, d'une méthode ou d'un
  constructeur. Laisse coupés les enchaînements de méthodes, les requêtes LINQ et les conditions sur plusieurs
  lignes.
- Utilise Bun pour les tâches du frontend, pas npm, npx ou node.
- Garde le corps du commit centré sur ce qui a changé et pourquoi.

## Versionnement

Ne change pas `application.properties` à la main dans les pull requests de fonctionnalités. La publication d'une
release le synchronise depuis le tag. Voir [Images et releases](setup/production.md).

## Contrôles

La CI les exécute sur chaque pull request. Pour les exécuter toi-même :

```sh
dotnet restore Schuly.API.slnx
dotnet build Schuly.API.slnx -c Release --no-restore -warnaserror
dotnet test Schuly.API.slnx -c Release --no-build
```

```sh
cd src/Schuly.Frontend
bun install --frozen-lockfile
bun run build
bun run test --watch=false
```

La CI compile aussi l'image sandbox quand une pull request modifie `src/Schuly.Sandbox/**`.
