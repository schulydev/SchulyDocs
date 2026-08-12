---
sidebar_position: 6
title: Set up two-factor codes
---

# Set up two-factor codes

Schuly can hold your two-factor secrets and generate the six-digit codes itself, so you
do not need a separate authenticator app. This page walks through adding one, using a
Microsoft school account as the example.

:::warning You need a second screen
The QR code appears on one screen and has to be **scanned by the phone running Schuly**.
So do this at a laptop or desktop, or on a second device - a phone cannot photograph its
own display. If you only have the one phone, use the setup key instead: every service
that shows a QR code also offers the key as text, and Schuly accepts it under
**enter manually**.
:::

## Two different things called 2FA

Worth getting straight before you start, because they look similar in the app:

| Where | What it is for |
|---|---|
| **Authenticator** screen | Codes you read and type somewhere else, such as signing in to Microsoft. |
| **2FA secret** row on a school connect form | A secret Schuly keeps so it can generate the code itself while syncing in the background. You never read this one. |

This page is about the first one.

## 1. Open your account's security settings

For a school Microsoft account, go to [myaccount.microsoft.com](https://myaccount.microsoft.com)
and sign in.

![The Microsoft My Account home page](/img/totp/01-account-home.png)

Open **Mein Konto** in the sidebar, then **Sicherheitsinformationen**.

![Security info in the sidebar](/img/totp/02-security-info-nav.png)

## 2. Add a sign-in method

Choose **Anmeldemethode hinzufügen**.

![The list of sign-in methods](/img/totp/03-add-sign-in-method.png)

Pick **Microsoft Authenticator** from the list.

![Choosing Microsoft Authenticator](/img/totp/04-choose-authenticator.png)

## 3. Tell it you use a different app

Microsoft assumes you want its own app. You don't - Schuly is the authenticator here.
Choose **Andere App für die Authentifizierung einrichten**.

![Use a different authenticator app](/img/totp/05-use-a-different-app.png)

Then continue with **Weiter**.

![Set up the account in the app](/img/totp/06-set-up-account.png)

## 4. Scan the code with Schuly

Microsoft now shows the QR code.

![The QR code to scan](/img/totp/07-scan-qr-code.png)

On your phone, in Schuly:

1. Tap your avatar in the top left, then **Authenticator**.
2. Tap **Add**, then **Scan QR code**.
3. Point the camera at the code on your other screen.

Schuly saves the entry and shows its six-digit code immediately, with the seconds
remaining beside it.

:::tip The code is needed right away
Microsoft asks for a current code to confirm the new device. That is the code Schuly is
showing you - type it in before the countdown runs out. If it expires, the next one works
just as well; the entry is already saved.
:::

Back on the computer, choose **Weiter**, enter the code, and confirm. **Authenticator-App**
now appears in your list of sign-in methods.

## Afterwards

Your codes live under **Authenticator** in Schuly. Tap one to copy it.

The secret stays on your phone. It is not sent to the Schuly backend and is not part of
any sync, which also means it is not restored automatically if you lose the device - so
keep the recovery options your school offers, and set up a second method such as a phone
number where you can.

## If it goes wrong

**The camera does not open.** Schuly needs camera permission. Grant it in your phone's
app settings and try again.

**The QR code will not scan.** Use the setup key instead: choose
**Can't scan the QR code?** on the Microsoft page, then in Schuly use **enter manually**
and paste the key.

**The code is rejected.** Codes are tied to the clock. If your phone's time is set
manually and drifts, the codes are wrong even though the app looks fine - switch the
phone to network-provided time.
