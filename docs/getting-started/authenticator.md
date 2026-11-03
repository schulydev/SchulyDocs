---
sidebar_position: 6
title: Set up two-factor codes
---

# Set up two-factor codes

Schuly can generate your two-factor codes, so you don't need a separate authenticator app. This
page uses a Microsoft school account as an example.

You need a second screen, because the phone running Schuly has to scan a QR code. With only one
device, use the setup key instead: choose **or enter manually** in Schuly.

::: info The screenshots are in German
The steps show the German labels with their English translations. If your account uses another
language, look for the option in the same position.
:::

## 1. Open your security settings

Go to [myaccount.microsoft.com](https://myaccount.microsoft.com) and sign in.

![The Microsoft My Account home page](/img/totp/01-account-home.png)

Open **Mein Konto** ("My account"), then **Sicherheitsinformationen** ("Security info").

![Security info in the sidebar](/img/totp/02-security-info-nav.png)

## 2. Add a sign-in method

Choose **Anmeldemethode hinzufügen** ("Add sign-in method").

![The list of sign-in methods](/img/totp/03-add-sign-in-method.png)

Choose **Microsoft Authenticator**.

![Choosing Microsoft Authenticator](/img/totp/04-choose-authenticator.png)

## 3. Choose a different app

Choose **Andere App für die Authentifizierung einrichten** ("Use a different authenticator app").

![Use a different authenticator app](/img/totp/05-use-a-different-app.png)

Choose **Weiter** ("Next").

![Set up the account in the app](/img/totp/06-set-up-account.png)

## 4. Scan the code with Schuly

Microsoft shows a QR code.

![The QR code to scan](/img/totp/07-scan-qr-code.png)

On your phone, in Schuly:

1. Tap your avatar in the top left, then **Authenticator**.
2. Tap **Add**, then **Scan QR code**.
3. Point the camera at the code.

Schuly saves the entry and shows a six-digit code.

## 5. Confirm the code

On your computer, choose **Weiter** ("Next"), enter the code from Schuly, and confirm. If the code
expires first, use the next one.

**Authenticator-App** ("Authenticator app") now appears in your sign-in methods.

## Use your codes

Open **Authenticator** in Schuly and tap a code to copy it.

::: warning Your codes aren't backed up
The secret stays on your phone and isn't synced, so you lose it if you lose the phone. Set up a
second sign-in method, such as a phone number, and keep your school's recovery options.
:::

## Troubleshooting

**The camera doesn't open.** Allow camera access for Schuly in your phone's settings.

**The QR code doesn't scan.** Choose **Can't scan the QR code?** on the Microsoft page. In Schuly,
choose **or enter manually** and paste the setup key.

**The code is rejected.** Codes depend on the clock. Set your phone to use network-provided time.
