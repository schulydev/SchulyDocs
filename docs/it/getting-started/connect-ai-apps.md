---
sidebar_position: 8
title: "Collega un'app di IA"
---

# Collega un'app di IA

Collega Schuly a un'app di IA come Claude, ChatGPT o Cursor, così può rispondere a domande sui tuoi
dati scolastici. Per questo Schuly usa il Model Context Protocol (MCP). Ti serve un account Schuly.

::: warning I tuoi dati vanno a quell'app
L'app che colleghi riceve i dati che legge da Schuly. Valgono le sue condizioni sulla privacy, quindi
consenti solo ciò che le serve.
:::

## Collega un'app

1. Apri [app.schuly.dev](https://app.schuly.dev) e accedi.
2. Nella barra laterale, sotto **AI**, scegli **MCP**.
3. Sotto **Set up your client**, scegli la tua app e segui i suoi passaggi.
4. Quando si apre il browser, controlla le autorizzazioni e scegli **Allow**.

La pagina contiene i passaggi per Claude Code, Claude Desktop, ChatGPT, Cursor, VS Code, Windsurf, Gemini CLI
e Codex CLI. Qualsiasi altra app che supporta i server MCP remoti può usare il **Server URL** su quella pagina.

Le app che si collegano dal cloud, come ChatGPT e claude.ai, hanno bisogno di un server con un indirizzo pubblico.

## Scegli cosa può fare un'app

Per ogni area, come le note o la posta, scegli **Off**, **Read** o **Read & write**. Per permettere a un'app
di eliminare elementi, attiva **Allow deleting**. Puoi modificare queste autorizzazioni in seguito, e le modifiche
valgono subito.

## Usa una chiave API

Alcuni strumenti non possono aprire un browser. Per questi, crea una chiave sotto **API keys** e aggiungila allo strumento.
Schuly mostra la chiave una sola volta. Trattala come una password.

## Vedi l'attività e scollega un'app

**Recent activity** elenca le ultime chiamate degli ultimi 30 giorni. Per scollegare un'app o bloccare una chiave,
scegli **Revoke** accanto a essa.
