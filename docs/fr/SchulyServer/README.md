# Documentation SchulyServer

SchulyServer est l'API ASP.NET Core 10 et l'application web derrière Schuly. Il suit une architecture
propre (clean architecture) avec CQRS (via [Mediator](https://github.com/martinothamar/Mediator)),
utilise EF Core sur PostgreSQL, intègre la connexion et charge des plugins à l'exécution depuis un
registre.

## Faire tourner un serveur

- [Auto-héberger Schuly](setup/self-hosting.md)
- [Faire tourner Schuly sans domaine](setup/self-hosting-lan.md)
- [Faire tourner et mettre à jour ton serveur](setup/operations.md)
- [Configuration](setup/configuration.md)
- [Gestion des plugins](plugin-management.md)

## Travailler sur le code

- [Mise en place du développement](setup/development.md)
- [Architecture](architecture.md)
- [Migrations](migrations.md)
- [Images et releases](setup/production.md)
- [Contribuer](contributing.md)
