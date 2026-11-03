---
sidebar_position: 8
title: "Connecter une application d'IA"
---

# Connecter une application d'IA

Connecte Schuly à une application d'IA comme Claude, ChatGPT ou Cursor, pour qu'elle puisse répondre à
des questions sur tes données scolaires. Schuly utilise pour cela le Model Context Protocol (MCP). Il te
faut un compte Schuly.

::: warning Tes données vont à cette application
L'application que tu connectes reçoit les données qu'elle lit dans Schuly. Ses propres conditions de
confidentialité s'appliquent, donc n'autorise que ce dont elle a besoin.
:::

## Connecter une application

1. Ouvre [app.schuly.dev](https://app.schuly.dev) et connecte-toi.
2. Dans la barre latérale, sous **AI**, choisis **MCP**.
3. Sous **Set up your client**, choisis ton application et suis ses étapes.
4. Quand ton navigateur s'ouvre, vérifie les autorisations et choisis **Allow**.

La page contient les étapes pour Claude Code, Claude Desktop, ChatGPT, Cursor, VS Code, Windsurf, Gemini
CLI et Codex CLI. Toute autre application qui prend en charge les serveurs MCP distants peut utiliser la
**Server URL** de cette page.

Les applications qui se connectent depuis le cloud, comme ChatGPT et claude.ai, ont besoin d'un serveur
avec une adresse publique.

## Choisir ce qu'une application peut faire

Pour chaque domaine, comme les notes ou les mails, choisis **Off**, **Read** ou **Read & write**. Pour
permettre à une application de supprimer des éléments, active **Allow deleting**. Tu peux modifier ces
autorisations plus tard, et tes changements s'appliquent tout de suite.

## Utiliser une clé API

Certains outils ne peuvent pas ouvrir de navigateur. Pour ceux-ci, crée une clé sous **API keys** et
ajoute-la à l'outil. Schuly n'affiche la clé qu'une seule fois. Traite-la comme un mot de passe.

## Voir l'activité et déconnecter une application

**Recent activity** liste les derniers appels des 30 derniers jours. Pour déconnecter une application ou
arrêter une clé, choisis **Revoke** à côté d'elle.
