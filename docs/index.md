---
layout: home

hero:
  name: Schuly Docs
  text: Documentation for the Schuly project
  tagline: Every repo's docs, synced into one place.
  image:
    src: /img/logo.png
    alt: Schuly
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started/
    - theme: alt
      text: GitHub org
      link: https://github.com/schulydev

features:
  - icon:
      light: /icons/smartphone.light.svg
      dark: /icons/smartphone.dark.svg
    title: Mobile app (Schuly)
    details: Flutter app, account vs private modes, the generated API client.
    link: /Schuly/
  - icon:
      light: /icons/server.light.svg
      dark: /icons/server.dark.svg
    title: Backend (.NET API)
    details: API architecture, migrations, plugin management, configuration.
    link: /SchulyBackend/
  - icon:
      light: /icons/globe.light.svg
      dark: /icons/globe.dark.svg
    title: Website
    details: Marketing site architecture, development and deployment.
    link: /SchulyWebsite/
  - icon:
      light: /icons/key-round.light.svg
      dark: /icons/key-round.dark.svg
    title: Keycloak (auth)
    details: Realm and theme management, auth setup and releases.
    link: /SchulyKeycloak/
  - icon:
      light: /icons/puzzle.light.svg
      dark: /icons/puzzle.dark.svg
    title: Plugin abstractions
    details: The plugin contract and versioning rules.
    link: /SchulyPluginAbstractions/
  - icon:
      light: /icons/plug.light.svg
      dark: /icons/plug.dark.svg
    title: Plugins
    details: Building, distributing and migrating plugins.
    link: /SchulyPlugins/
---

You don't edit docs here. Each section is maintained in its own repository under the
[`schulydev`](https://github.com/schulydev) GitHub org and is **synced into this site
automatically** whenever its `docs/` folder changes on `main`.
