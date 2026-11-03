---
sidebar_position: 6
title: Zwei-Faktor-Codes einrichten
---

# Zwei-Faktor-Codes einrichten

Schuly kann deine Zwei-Faktor-Codes generieren, du brauchst also keine separate Authenticator-App.
Diese Seite nutzt ein Microsoft-Schulkonto als Beispiel.

Du brauchst einen zweiten Bildschirm, weil das Telefon mit Schuly einen QR-Code scannen muss. Mit
nur einem Gerät nutzt du stattdessen den Einrichtungsschlüssel: Wähle in Schuly **or enter manually**.

## 1. Sicherheitseinstellungen öffnen

Gehe zu [myaccount.microsoft.com](https://myaccount.microsoft.com) und melde dich an.

![Die Startseite von Microsoft Mein Konto](/img/totp/01-account-home.png)

Öffne **Mein Konto**, dann **Sicherheitsinformationen**.

![Sicherheitsinformationen in der Seitenleiste](/img/totp/02-security-info-nav.png)

## 2. Anmeldemethode hinzufügen

Wähle **Anmeldemethode hinzufügen**.

![Die Liste der Anmeldemethoden](/img/totp/03-add-sign-in-method.png)

Wähle **Microsoft Authenticator**.

![Microsoft Authenticator auswählen](/img/totp/04-choose-authenticator.png)

## 3. Andere App wählen

Wähle **Andere App für die Authentifizierung einrichten**.

![Eine andere Authenticator-App verwenden](/img/totp/05-use-a-different-app.png)

Wähle **Weiter**.

![Konto in der App einrichten](/img/totp/06-set-up-account.png)

## 4. Code mit Schuly scannen

Microsoft zeigt einen QR-Code an.

![Der zu scannende QR-Code](/img/totp/07-scan-qr-code.png)

Auf deinem Telefon, in Schuly:

1. Tippe oben links auf dein Profilbild, dann auf **Authenticator**.
2. Tippe auf **Add**, dann auf **Scan QR code**.
3. Richte die Kamera auf den Code.

Schuly speichert den Eintrag und zeigt einen sechsstelligen Code an.

## 5. Code bestätigen

Wähle am Computer **Weiter**, gib den Code aus Schuly ein und bestätige. Wenn der Code vorher
abläuft, nutze den nächsten.

**Authenticator-App** erscheint nun in deinen Anmeldemethoden.

## Codes nutzen

Öffne **Authenticator** in Schuly und tippe auf einen Code, um ihn zu kopieren.

::: warning Deine Codes werden nicht gesichert
Das Geheimnis bleibt auf deinem Telefon und wird nicht synchronisiert. Wenn du das Telefon verlierst,
verlierst du es also auch. Richte eine zweite Anmeldemethode ein, zum Beispiel eine Telefonnummer,
und behalte die Wiederherstellungsoptionen deiner Schule.
:::

## Fehlerbehebung

**Die Kamera öffnet sich nicht.** Erlaube Schuly den Kamerazugriff in den Einstellungen deines
Telefons.

**Der QR-Code lässt sich nicht scannen.** Wähle auf der Microsoft-Seite **QR-Code kann nicht gescannt
werden?**. Wähle in Schuly **or enter manually** und füge den Einrichtungsschlüssel ein.

**Der Code wird abgelehnt.** Codes hängen von der Uhrzeit ab. Stelle dein Telefon auf netzwerkbasierte
Zeit um.
