---
sidebar_position: 8
title: KI-App verbinden
---

# KI-App verbinden

Verbinde Schuly mit einer KI-App wie Claude, ChatGPT oder Cursor, damit sie Fragen zu deinen Schuldaten
beantworten kann. Schuly nutzt dafür das Model Context Protocol (MCP). Du brauchst ein Schuly-Konto.

::: warning Deine Daten gehen an diese App
Die verbundene App erhält die Daten, die sie aus Schuly liest. Es gelten ihre eigenen
Datenschutzbestimmungen. Erlaube deshalb nur, was sie braucht.
:::

## App verbinden

1. Öffne [app.schuly.dev](https://app.schuly.dev) und melde dich an.
2. Wähle in der Seitenleiste unter **AI** den Eintrag **MCP**.
3. Wähle unter **Set up your client** deine App und folge ihren Schritten.
4. Wenn sich dein Browser öffnet, prüfe die Berechtigungen und wähle **Allow**.

Die Seite enthält Schritte für Claude Code, Claude Desktop, ChatGPT, Cursor, VS Code, Windsurf, Gemini CLI
und Codex CLI. Jede andere App, die entfernte MCP-Server unterstützt, kann die **Server URL** auf dieser
Seite nutzen.

Apps, die sich aus der Cloud verbinden, zum Beispiel ChatGPT und claude.ai, brauchen einen Server mit
öffentlicher Adresse.

## Wählen, was eine App darf

Wähle für jeden Bereich, zum Beispiel Noten oder E-Mails, **Off**, **Read** oder **Read & write**. Damit
eine App etwas löschen darf, schalte **Allow deleting** ein. Du kannst diese Berechtigungen später
ändern. Deine Änderungen gelten sofort.

## API-Key nutzen

Manche Tools können keinen Browser öffnen. Erstelle für sie unter **API keys** einen Key und trage ihn
im Tool ein. Schuly zeigt den Key nur einmal an. Behandle ihn wie ein Passwort.

## Aktivität ansehen und App trennen

**Recent activity** listet die neusten Aufrufe der letzten 30 Tage auf. Um eine App zu trennen oder einen
Key zu stoppen, wähle daneben **Revoke**.
