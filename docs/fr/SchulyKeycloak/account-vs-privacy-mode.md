# Mode compte vs. mode privé

Schuly peut s'utiliser de deux façons. Cette page explique les compromis pour que tu
puisses choisir comment te connecter.

## Mode compte (recommandé)

Connecte-toi avec un **compte Schuly** - l'identité cloud reposant sur ce Keycloak.
Ton profil et tes données restent chez Schuly et te suivent sur tous tes appareils.

- **Avantages**
  - **Notifications push** - sois averti des changements (horaire, notes, messages).
  - **Support web** - utilise Schuly dans le navigateur, pas seulement dans l'appli.
  - **Synchronisation entre appareils** - connecte-toi n'importe où et reprends là où tu t'es arrêté.
  - Prend en charge la 2FA (une clé d'accès, ou une appli d'authentification) - proposée, pas imposée - voir
    [Gestion du realm](realm-management.md).
- **Inconvénients**
  - Nécessite de créer un compte et de s'y connecter.
  - Tes données sont stockées dans le cloud Schuly (sécurisées, mais pas uniquement en local).
  - Dépend de la disponibilité du service d'identité Schuly.

## Mode privé

Utilise l'application **sans compte Schuly** - elle communique directement avec le
portail de ton école et garde tes identifiants et tes données sur l'appareil.

- **Avantages**
  - Confidentialité maximale - rien n'est stocké dans le cloud Schuly.
  - Aucun compte à créer ; les données restent sur ton appareil.
- **Inconvénients**
  - **Pas de notifications push ni de support web** - les deux nécessitent un compte
    Schuly, donc en mode privé tu ne reçois pas de notifications et ne peux utiliser
    l'appli que sur cet appareil.
  - Pas de synchronisation entre appareils - chaque appareil est configuré indépendamment.

## Lequel choisir ?

Choisis le **mode compte** si tu veux les notifications, l'application web et tes
données synchronisées sur tous tes appareils - c'est l'expérience du quotidien pour
la plupart des utilisateurs. Choisis le **mode privé** si tu préfères tout garder sur
ton appareil et que tu n'as besoin ni des notifications, ni de l'application web, ni
de la synchronisation.
