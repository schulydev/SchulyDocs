---
slug: /
sidebar_position: 1
title: Overview
---

# Schuly documentation

Welcome to the unified documentation for the **Schuly** project. Each section below is
maintained inside its own repository under the
[`schulydev`](https://github.com/schulydev) GitHub org and is **synced into this site
automatically** whenever its `docs/` folder changes on `main`.

| Section | Repository | What it covers |
| --- | --- | --- |
| [Mobile app (Schuly)](/Schuly/) | [Schuly](https://github.com/schulydev/Schuly) | Flutter app, app modes, API client |
| [Backend (.NET API)](/SchulyBackend/) | [SchulyBackend](https://github.com/schulydev/SchulyBackend) | API, architecture, migrations, plugin management |
| [Website](/SchulyWebsite/) | [SchulyWebsite](https://github.com/schulydev/SchulyWebsite) | Marketing/site architecture & deployment |
| [Keycloak (auth)](/SchulyKeycloak/) | [SchulyKeycloak](https://github.com/schulydev/SchulyKeycloak) | Realm & theme management, auth setup |
| [Plugin abstractions](/SchulyPluginAbstractions/) | [SchulyPluginAbstractions](https://github.com/schulydev/SchulyPluginAbstractions) | Plugin contract & versioning |
| [Plugins](/SchulyPlugins/) | [SchulyPlugins](https://github.com/schulydev/SchulyPlugins) | Building & distributing plugins |

## How this site is built

You don't edit docs here. Edit the `docs/` folder in each source repo — a GitHub
Actions workflow copies the changes into this repo, and Cloudflare Pages rebuilds the
site on push. See the [repo README](https://github.com/schulydev/SchulyDocs) for the
sync and hosting setup.
