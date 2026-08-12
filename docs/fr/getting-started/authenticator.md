---
sidebar_position: 6
title: Configurer les codes à deux facteurs
---

# Configurer les codes à deux facteurs

Schuly peut stocker tes secrets à deux facteurs et générer lui-même les codes à six
chiffres, pour que tu n'aies pas besoin d'une application d'authentification séparée.
Cette page explique comment en ajouter un, en prenant un compte scolaire Microsoft
comme exemple.

:::info Les captures d'écran proviennent d'un compte en allemand
Microsoft affiche ce parcours dans la langue configurée sur ton compte, et les captures
d'écran ci-dessous proviennent justement d'un compte en allemand. Les libellés allemands
sont signalés dans le texte avec leur traduction française à côté, alors repère
l'option à cette position, quelle que soit la langue affichée sur ton propre écran.
:::

:::warning Il te faut un deuxième écran
Le code QR apparaît sur un écran et doit être **scanné par le téléphone qui exécute
Schuly**. Fais donc cette étape sur un ordinateur portable ou de bureau, ou sur un
deuxième appareil - un téléphone ne peut pas photographier son propre écran. Si tu n'as
qu'un seul téléphone, utilise plutôt la clé de configuration : chaque service qui
affiche un code QR propose aussi la clé sous forme de texte, et Schuly l'accepte sous
**Saisie manuelle**.
:::

## Deux choses différentes appelées 2FA

Un point à clarifier avant de commencer, car elles se ressemblent dans l'application :

| Où | À quoi ça sert |
|---|---|
| Écran **Authenticator** | Des codes que tu lis et saisis ailleurs, par exemple pour te connecter à Microsoft. |
| Ligne **secret 2FA** dans le formulaire de connexion d'une école | Un secret que Schuly conserve pour pouvoir générer le code lui-même pendant la synchronisation en arrière-plan. Tu ne le lis jamais. |

Cette page traite du premier cas.

## 1. Ouvrir les paramètres de sécurité de ton compte

Pour un compte scolaire Microsoft, rends-toi sur
[myaccount.microsoft.com](https://myaccount.microsoft.com) et connecte-toi.

![La page d'accueil de Mon compte Microsoft](/img/totp/01-account-home.png)

Ouvre **Mein Konto** (« Mon compte ») dans le menu latéral, puis
**Sicherheitsinformationen** (« Infos de sécurité »).

![Infos de sécurité dans le menu latéral](/img/totp/02-security-info-nav.png)

## 2. Ajouter une méthode de connexion

Choisis **Anmeldemethode hinzufügen** (« Ajouter une méthode de connexion »).

![La liste des méthodes de connexion](/img/totp/03-add-sign-in-method.png)

Sélectionne **Microsoft Authenticator** dans la liste.

![Sélection de Microsoft Authenticator](/img/totp/04-choose-authenticator.png)

## 3. Indiquer que tu utilises une autre application

Microsoft part du principe que tu veux utiliser sa propre application. Ce n'est pas le
cas - ici, c'est Schuly qui joue le rôle d'application d'authentification. Choisis
**Andere App für die Authentifizierung einrichten** (« Configurer une autre application
d'authentification »).

![Utiliser une autre application d'authentification](/img/totp/05-use-a-different-app.png)

Poursuis ensuite avec **Weiter** (« Suivant »).

![Configurer le compte dans l'application](/img/totp/06-set-up-account.png)

## 4. Scanner le code avec Schuly

Microsoft affiche maintenant le code QR.

![Le code QR à scanner](/img/totp/07-scan-qr-code.png)

Sur ton téléphone, dans Schuly :

1. Touche ton avatar en haut à gauche, puis **Authenticator**.
2. Touche **Ajouter**, puis **Scanner le code QR**.
3. Pointe la caméra vers le code affiché sur ton autre écran.

Schuly enregistre l'entrée et affiche immédiatement son code à six chiffres, avec le
nombre de secondes restantes à côté.

:::tip Le code est nécessaire tout de suite
Microsoft demande un code actuel pour confirmer le nouvel appareil. C'est le code que
Schuly t'affiche - saisis-le avant la fin du compte à rebours. S'il expire, le suivant
fonctionne tout aussi bien ; l'entrée est déjà enregistrée.
:::

De retour sur l'ordinateur, choisis à nouveau **Weiter** (« Suivant »), saisis le code
et confirme. **Authenticator-App** (« Application d'authentification ») apparaît
maintenant dans ta liste de méthodes de connexion.

## Ensuite

Tes codes se trouvent sous **Authenticator** dans Schuly. Touche-en un pour le copier.

Le secret reste sur ton téléphone. Il n'est pas envoyé au backend de Schuly et ne fait
partie d'aucune synchronisation, ce qui signifie aussi qu'il n'est pas restauré
automatiquement si tu perds l'appareil - conserve donc les options de récupération
proposées par ton école, et configure si possible une deuxième méthode, comme un
numéro de téléphone.

## En cas de problème

**La caméra ne s'ouvre pas.** Schuly a besoin de l'autorisation d'accès à la caméra.
Accorde-la dans les paramètres d'applications de ton téléphone et réessaie.

**Le code QR ne se scanne pas.** Utilise plutôt la clé de configuration : choisis
l'option « Impossible de scanner le code QR ? » sur la page Microsoft, puis dans Schuly
utilise **Saisie manuelle** et colle la clé.

**Le code est refusé.** Les codes sont liés à l'horloge. Si l'heure de ton téléphone
est réglée manuellement et qu'elle dérive, les codes sont faux même si l'application
semble normale - passe ton téléphone à l'heure fournie par le réseau.
