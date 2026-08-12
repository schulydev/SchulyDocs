---
sidebar_position: 6
title: Configura i codici a due fattori
---

# Configura i codici a due fattori

Schuly può memorizzare i tuoi segreti a due fattori e generare da sola i codici a sei
cifre, così non hai bisogno di un'app di autenticazione separata. Questa pagina ti
guida nell'aggiungerne uno, usando come esempio un account scolastico Microsoft.

:::info Gli screenshot provengono da un account in tedesco
Microsoft mostra questo percorso nella lingua impostata sul tuo account, e gli
screenshot qui sotto provengono per l'appunto da un account in tedesco. Le etichette
tedesche sono segnalate nel testo con la relativa traduzione italiana a fianco, quindi
cerca l'opzione in quella posizione, indipendentemente dalla lingua mostrata sul tuo
schermo.
:::

:::warning Ti serve un secondo schermo
Il codice QR appare su uno schermo e deve essere **scansionato dal telefono su cui
gira Schuly**. Fallo quindi da un laptop o un desktop, oppure su un secondo
dispositivo - un telefono non può fotografare il proprio schermo. Se hai un solo
telefono, usa invece la chiave di configurazione: ogni servizio che mostra un codice QR
offre anche la chiave come testo, e Schuly la accetta sotto **Inserisci manualmente**.
:::

## Due cose diverse chiamate entrambe 2FA

Vale la pena chiarirlo prima di iniziare, perché nell'app si somigliano:

| Dove | A cosa serve |
|---|---|
| Schermata **Authenticator** | Codici che leggi e digiti altrove, ad esempio per accedere a Microsoft. |
| Riga **segreto 2FA** nel modulo di collegamento di una scuola | Un segreto che Schuly conserva per poter generare da sola il codice durante la sincronizzazione in background. Questo non lo leggi mai. |

Questa pagina riguarda il primo caso.

## 1. Apri le impostazioni di sicurezza del tuo account

Per un account scolastico Microsoft, vai su
[myaccount.microsoft.com](https://myaccount.microsoft.com) e accedi.

![La pagina principale di Il mio account Microsoft](/img/totp/01-account-home.png)

Apri **Mein Konto** ("Il mio account") nella barra laterale, poi
**Sicherheitsinformationen** ("Informazioni di sicurezza").

![Informazioni di sicurezza nella barra laterale](/img/totp/02-security-info-nav.png)

## 2. Aggiungi un metodo di accesso

Scegli **Anmeldemethode hinzufügen** ("Aggiungi metodo di accesso").

![L'elenco dei metodi di accesso](/img/totp/03-add-sign-in-method.png)

Seleziona **Microsoft Authenticator** dall'elenco.

![Selezione di Microsoft Authenticator](/img/totp/04-choose-authenticator.png)

## 3. Indica che usi un'altra app

Microsoft presume che tu voglia usare la sua app. Non è così - qui è Schuly a fare da
autenticatore. Scegli **Andere App für die Authentifizierung einrichten**
("Configura un'altra app di autenticazione").

![Usa un'altra app di autenticazione](/img/totp/05-use-a-different-app.png)

Prosegui poi con **Weiter** ("Avanti").

![Configura l'account nell'app](/img/totp/06-set-up-account.png)

## 4. Scansiona il codice con Schuly

Microsoft mostra ora il codice QR.

![Il codice QR da scansionare](/img/totp/07-scan-qr-code.png)

Sul tuo telefono, in Schuly:

1. Tocca il tuo avatar in alto a sinistra, poi **Authenticator**.
2. Tocca **Aggiungi**, poi **Scansiona codice QR**.
3. Inquadra con la fotocamera il codice sull'altro schermo.

Schuly salva la voce e mostra subito il suo codice a sei cifre, con accanto i secondi
rimanenti.

:::tip Il codice serve subito
Microsoft chiede un codice attuale per confermare il nuovo dispositivo. È il codice che
Schuly ti sta mostrando - inseriscilo prima che il conto alla rovescia finisca. Se
scade, il successivo funziona altrettanto bene; la voce è già stata salvata.
:::

Sul computer, scegli di nuovo **Weiter** ("Avanti"), inserisci il codice e conferma.
**Authenticator-App** ("App di autenticazione") compare ora nel tuo elenco di metodi di
accesso.

## In seguito

I tuoi codici si trovano sotto **Authenticator** in Schuly. Toccane uno per copiarlo.

Il segreto resta sul tuo telefono. Non viene inviato al backend di Schuly e non fa
parte di alcuna sincronizzazione, il che significa anche che non viene ripristinato
automaticamente se perdi il dispositivo - conserva quindi le opzioni di recupero
offerte dalla tua scuola e, dove possibile, configura un secondo metodo come un numero
di telefono.

## Se qualcosa va storto

**La fotocamera non si apre.** Schuly ha bisogno del permesso per la fotocamera.
Concedilo nelle impostazioni delle app del tuo telefono e riprova.

**Il codice QR non si scansiona.** Usa invece la chiave di configurazione: scegli
l'opzione "Impossibile scansionare il codice QR?" sulla pagina Microsoft, poi in Schuly
usa **Inserisci manualmente** e incolla la chiave.

**Il codice viene rifiutato.** I codici sono legati all'orologio. Se l'ora del tuo
telefono è impostata manualmente e va alla deriva, i codici risultano sbagliati anche
se l'app sembra normale - imposta il telefono sull'ora fornita dalla rete.
