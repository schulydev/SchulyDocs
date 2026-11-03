---
sidebar_position: 6
title: Configurer les codes à deux facteurs
---

# Configurer les codes à deux facteurs

Schuly peut générer tes codes à deux facteurs, pour que tu n'aies pas besoin d'une application
d'authentification séparée. Cette page prend comme exemple un compte scolaire Microsoft.

Il te faut un deuxième écran, car le téléphone qui exécute Schuly doit scanner un code QR. Si tu n'as
qu'un seul appareil, utilise plutôt la clé de configuration : choisis **or enter manually** dans
Schuly.

::: info Les captures d'écran sont en allemand
Les étapes indiquent les libellés allemands avec leur traduction française. Si ton compte utilise une
autre langue, cherche l'option au même endroit.
:::

## 1. Ouvrir tes paramètres de sécurité

Va sur [myaccount.microsoft.com](https://myaccount.microsoft.com) et connecte-toi.

![La page d'accueil de Mon compte Microsoft](/img/totp/01-account-home.png)

Ouvre **Mein Konto** (« Mon compte »), puis **Sicherheitsinformationen** (« Infos de sécurité »).

![Infos de sécurité dans le menu latéral](/img/totp/02-security-info-nav.png)

## 2. Ajouter une méthode de connexion

Choisis **Anmeldemethode hinzufügen** (« Ajouter une méthode de connexion »).

![La liste des méthodes de connexion](/img/totp/03-add-sign-in-method.png)

Choisis **Microsoft Authenticator**.

![Choix de Microsoft Authenticator](/img/totp/04-choose-authenticator.png)

## 3. Choisir une autre application

Choisis **Andere App für die Authentifizierung einrichten** (« Configurer une autre application
d'authentification »).

![Utiliser une autre application d'authentification](/img/totp/05-use-a-different-app.png)

Choisis **Weiter** (« Suivant »).

![Configurer le compte dans l'application](/img/totp/06-set-up-account.png)

## 4. Scanner le code avec Schuly

Microsoft affiche un code QR.

![Le code QR à scanner](/img/totp/07-scan-qr-code.png)

Sur ton téléphone, dans Schuly :

1. Touche ton avatar en haut à gauche, puis **Authenticator**.
2. Touche **Add**, puis **Scan QR code**.
3. Pointe la caméra vers le code.

Schuly enregistre l'entrée et affiche un code à six chiffres.

## 5. Confirmer le code

Sur ton ordinateur, choisis **Weiter** (« Suivant »), saisis le code de Schuly et confirme. Si le code
expire avant, utilise le suivant.

**Authenticator-App** (« Application d'authentification ») apparaît maintenant dans tes méthodes de
connexion.

## Utiliser tes codes

Ouvre **Authenticator** dans Schuly et touche un code pour le copier.

::: warning Tes codes ne sont pas sauvegardés
Le secret reste sur ton téléphone et n'est pas synchronisé : tu le perds si tu perds le téléphone.
Configure une deuxième méthode de connexion, par exemple un numéro de téléphone, et conserve les
options de récupération de ton école.
:::

## Dépannage

**La caméra ne s'ouvre pas.** Autorise l'accès à la caméra pour Schuly dans les paramètres de ton
téléphone.

**Le code QR ne se scanne pas.** Choisis **Can't scan the QR code?** sur la page Microsoft. Dans Schuly,
choisis **or enter manually** et colle la clé de configuration.

**Le code est refusé.** Les codes dépendent de l'horloge. Règle ton téléphone pour qu'il utilise l'heure
fournie par le réseau.
