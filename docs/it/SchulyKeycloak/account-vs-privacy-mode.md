# Modalità account vs. privacy

Schuly si può usare in due modi. Questa pagina spiega i compromessi, così puoi
scegliere come accedere.

## Modalità account (consigliata)

Accedi con un **account Schuly** - l'identità cloud basata su questo Keycloak. Il
tuo profilo e i tuoi dati restano su Schuly e ti seguono su tutti i dispositivi.

- **Vantaggi**
  - **Notifiche push** - ricevi avvisi sui cambiamenti (orario, voti, messaggi).
  - **Supporto web** - usa Schuly nel browser, non solo nell'app.
  - **Sincronizzazione tra dispositivi** - accedi ovunque e riprendi da dove avevi lasciato.
  - Supporta la 2FA (una passkey o un'app di autenticazione) - proposta, non
    imposta - vedi [Gestione del realm](realm-management.md).
- **Svantaggi**
  - Richiede di creare un account e di accedere.
  - I tuoi dati sono conservati nel cloud di Schuly (protetti, ma non solo locali).
  - Dipende dalla raggiungibilità del servizio di identità Schuly.

## Modalità privacy

Usa l'app **senza un account Schuly** - comunica direttamente con il portale della
tua scuola e mantiene le tue credenziali e i tuoi dati sul dispositivo.

- **Vantaggi**
  - Privacy massima - nulla viene salvato nel cloud di Schuly.
  - Nessun account da creare; i dati restano sul dispositivo.
- **Svantaggi**
  - **Nessuna notifica push e nessun supporto web** - entrambi richiedono un account
    Schuly, quindi in modalità privacy non ricevi notifiche e puoi usare l'app solo
    su questo dispositivo.
  - Nessuna sincronizzazione tra dispositivi - ogni dispositivo va configurato
    separatamente.

## Quale scegliere?

Scegli la **modalità account** se vuoi le notifiche, l'app web e i dati
sincronizzati su tutti i dispositivi - è l'esperienza quotidiana per la maggior
parte degli utenti. Scegli la **modalità privacy** se preferisci tenere tutto sul
tuo dispositivo e non hai bisogno di notifiche, app web o sincronizzazione.
