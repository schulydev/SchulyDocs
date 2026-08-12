# Documentation SchulyBackend

SchulyBackend est l'API ASP.NET Core 10 derrière Schuly. Elle suit une architecture
propre (clean architecture) avec CQRS (via [Mediator](https://github.com/martinothamar/Mediator)),
utilise EF Core sur PostgreSQL, s'authentifie avec OIDC, et héberge des plugins chargés
à l'exécution depuis un registre.

## Index

- [Architecture](architecture.md) - découpage en couches, responsabilités des projets,
  le flux d'ajout d'une entité, et l'hôte de plugins.
- Mise en place
  - [Développement](setup/development.md) - faire tourner l'API et Postgres en local.
  - [Auto-hébergement](setup/self-hosting.md) - pas à pas : faire tourner toute la pile sur ton propre serveur.
  - [Configuration](setup/configuration.md) - paramètres, OIDC, rôles, chaînes de connexion.
  - [Production](setup/production.md) - image Docker, flux de release, migrations au démarrage.
- [Migrations](migrations.md) - scripts de migration EF Core et comportement au démarrage.
- [Gestion des plugins](plugin-management.md) - registre de plugins à l'exécution, hot-swap, endpoints d'administration.
- [Contribuer](contributing.md) - flux issue → branche → PR et conventions.
