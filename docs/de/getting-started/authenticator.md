---
sidebar_position: 6
title: Zwei-Faktor-Codes einrichten
---

# Zwei-Faktor-Codes einrichten

Schuly kann deine Zwei-Faktor-Geheimnisse speichern und die sechsstelligen Codes selbst
generieren, sodass du keine separate Authenticator-App brauchst. Diese Seite zeigt dir,
wie du einen einrichtest - am Beispiel eines Microsoft-Schulkontos.

:::warning Du brauchst einen zweiten Bildschirm
Der QR-Code erscheint auf einem Bildschirm und muss **vom Telefon mit Schuly gescannt
werden**. Mach das also an einem Laptop oder Desktop, oder auf einem zweiten Gerät - ein
Telefon kann nicht sein eigenes Display fotografieren. Falls du nur ein Telefon hast,
nutze stattdessen den Einrichtungsschlüssel: Jeder Dienst, der einen QR-Code anzeigt,
bietet den Schlüssel auch als Text an, und Schuly akzeptiert ihn unter
**Manuell eingeben**.
:::

## Zwei verschiedene Dinge, die beide 2FA heissen

Das solltest du dir vor dem Start klarmachen, weil sie sich in der App ähnlich sehen:

| Wo | Wofür |
|---|---|
| Bildschirm **Authenticator** | Codes, die du liest und woanders eintippst, zum Beispiel bei der Anmeldung bei Microsoft. |
| Zeile **2FA-Geheimnis** im Verbindungsformular einer Schule | Ein Geheimnis, das Schuly aufbewahrt, um den Code während der Hintergrundsynchronisation selbst zu generieren. Diesen liest du nie. |

Auf dieser Seite geht es um den ersten Fall.

## 1. Sicherheitseinstellungen deines Kontos öffnen

Gehe für ein schulisches Microsoft-Konto zu
[myaccount.microsoft.com](https://myaccount.microsoft.com) und melde dich an.

![Die Startseite von Microsoft Mein Konto](/img/totp/01-account-home.png)

Öffne **Mein Konto** in der Seitenleiste, dann **Sicherheitsinformationen**.

![Sicherheitsinformationen in der Seitenleiste](/img/totp/02-security-info-nav.png)

## 2. Anmeldemethode hinzufügen

Wähle **Anmeldemethode hinzufügen**.

![Die Liste der Anmeldemethoden](/img/totp/03-add-sign-in-method.png)

Wähle aus der Liste **Microsoft Authenticator**.

![Microsoft Authenticator auswählen](/img/totp/04-choose-authenticator.png)

## 3. Angeben, dass du eine andere App verwendest

Microsoft geht davon aus, dass du seine eigene App nutzen willst. Das willst du nicht -
hier übernimmt Schuly die Rolle des Authenticators. Wähle **Andere App für die
Authentifizierung einrichten**.

![Eine andere Authenticator-App verwenden](/img/totp/05-use-a-different-app.png)

Fahre dann mit **Weiter** fort.

![Konto in der App einrichten](/img/totp/06-set-up-account.png)

## 4. Code mit Schuly scannen

Microsoft zeigt jetzt den QR-Code an.

![Der zu scannende QR-Code](/img/totp/07-scan-qr-code.png)

Auf deinem Telefon, in Schuly:

1. Tippe oben links auf dein Profilbild, dann auf **Authenticator**.
2. Tippe auf **Hinzufügen**, dann auf **QR-Code scannen**.
3. Halte die Kamera auf den Code auf deinem anderen Bildschirm.

Schuly speichert den Eintrag und zeigt sofort den sechsstelligen Code an, mit der
verbleibenden Zeit in Sekunden daneben.

:::tip Der Code wird sofort benötigt
Microsoft verlangt einen aktuellen Code, um das neue Gerät zu bestätigen. Das ist der
Code, den Schuly dir anzeigt - gib ihn ein, bevor der Countdown abläuft. Falls er
abläuft, funktioniert der nächste genauso gut; der Eintrag ist bereits gespeichert.
:::

Wähle am Computer wieder **Weiter**, gib den Code ein und bestätige.
**Authenticator-App** erscheint nun in deiner Liste der Anmeldemethoden.

## Danach

Deine Codes findest du unter **Authenticator** in Schuly. Tippe auf einen, um ihn zu
kopieren.

Das Geheimnis bleibt auf deinem Telefon. Es wird nicht an das Schuly-Backend gesendet
und ist nicht Teil einer Synchronisation, was auch bedeutet, dass es nicht automatisch
wiederhergestellt wird, wenn du das Gerät verlierst - bewahre also die
Wiederherstellungsoptionen deiner Schule auf und richte, wo möglich, eine zweite Methode
wie eine Telefonnummer ein.

## Wenn etwas schiefgeht

**Die Kamera öffnet sich nicht.** Schuly braucht Kamerazugriff. Erteile ihn in den
App-Einstellungen deines Telefons und versuche es erneut.

**Der QR-Code lässt sich nicht scannen.** Nutze stattdessen den Einrichtungsschlüssel:
Wähle auf der Microsoft-Seite **QR-Code kann nicht gescannt werden?**, dann in Schuly
**Manuell eingeben** und füge den Schlüssel ein.

**Der Code wird abgelehnt.** Codes sind an die Uhrzeit gebunden. Wenn die Zeit auf
deinem Telefon manuell eingestellt ist und abweicht, sind die Codes falsch, auch wenn in
der App alles normal aussieht - stelle dein Telefon auf netzwerkbasierte Zeit um.
