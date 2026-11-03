---
sidebar_position: 8
title: Connect an AI app
---

# Connect an AI app

Connect Schuly to an AI app such as Claude, ChatGPT, or Cursor, so that it can answer questions about
your school data. Schuly uses the Model Context Protocol (MCP) for this. You need a Schuly account.

::: warning Your data goes to that app
The app you connect receives the data it reads from Schuly. Its own privacy terms apply, so allow
only what it needs.
:::

## Connect an app

1. Open [app.schuly.dev](https://app.schuly.dev) and sign in.
2. In the sidebar, under **AI**, choose **MCP**.
3. Under **Set up your client**, pick your app and follow its steps.
4. When your browser opens, check the permissions and choose **Allow**.

The page has steps for Claude Code, Claude Desktop, ChatGPT, Cursor, VS Code, Windsurf, Gemini CLI,
and Codex CLI. Any other app that supports remote MCP servers can use the **Server URL** on that page.

Apps that connect from the cloud, such as ChatGPT and claude.ai, need a server with a public address.

## Choose what an app can do

For each area, such as grades or mail, choose **Off**, **Read**, or **Read & write**. To let an app
delete things, turn on **Allow deleting**. You can edit these permissions later, and your changes
apply right away.

## Use an API key

Some tools can't open a browser. For those, create a key under **API keys** and add it to the tool.
Schuly shows the key only once. Treat it like a password.

## See activity and disconnect an app

**Recent activity** lists the latest calls from the last 30 days. To disconnect an app or stop a key,
choose **Revoke** next to it.
