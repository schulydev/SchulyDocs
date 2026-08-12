# Gestione del realm

Il realm `schuly` è definito in `realms/schuly-realm.json` e viene **importato al
primo avvio** (`--import-realm`). Contiene la configurazione di identità di
Schuly: i ruoli di realm `Student` / `Teacher` / `Administrator` con i gruppi
corrispondenti, i client scope OIDC (`profile`, `email`, `groups`, `picture`), la
selezione del tema di login `schuly`, un flusso browser 2FA, la registrazione
self-service e una password policy che fa riferimento alla blacklist rockyou
(`passwordBlacklist(rockyou.txt)`).

## Auto-registrazione

L'auto-registrazione degli utenti è **abilitata** (`registrationAllowed`), quindi
la pagina di login mostra un link **Registrati** e i visitatori possono creare da
soli il proprio account. Il modulo è volutamente minimale grazie a un profilo
utente dichiarativo - solo **nome utente, email e password** (niente nome/cognome).
La verifica email è disattivata per impostazione predefinita (non è configurato
SMTP di default) - imposta le variabili `SMTP_*` descritte in
[Configurazione](configuration.md#smtp-email-del-realm) se vuoi che le email
verificate o il reset password self-service vengano effettivamente consegnati.

## Autenticazione a due fattori

La 2FA è **passkey-first, ma opzionale**. Il flusso `browser-2fa` verifica prima
nome utente + password, poi segue un passaggio MFA *condizionale*: se l'utente ha
già una credenziale 2FA, gli viene richiesta (passkey oppure OTP - a seconda di
cosa possiede). La registrazione viene **proposta, non imposta**:
`webauthn-register-passwordless` e `CONFIGURE_TOTP` sono abilitati ma **non** sono
azioni predefinite, quindi nessuno viene bloccato da un passaggio di registrazione
obbligatorio al primo accesso.

Questo è importante per i **login mediati (brokered)** tramite un IdP esterno (ad
es. Pocket ID): questi utenti si sono già autenticati con una passkey alla fonte,
quindi un passaggio passkey imposto da Keycloak sarebbe ridondante - e siccome
Keycloak applica le azioni predefinite anche agli utenti mediati, li bloccherebbe.
Mantenere la registrazione opzionale evita questo problema.

OTP / app di autenticazione (`CONFIGURE_TOTP`) e passkey si possono aggiungere
entrambe dalla console account, e il flusso di login accetta l'una o l'altra come
passaggio 2FA.

### Scegliere un metodo di accesso

Entrambi i metodi soddisfano il passaggio 2FA. Puoi aggiungere una passkey,
un'app di autenticazione, o entrambe; i compromessi:

**Passkey** (predefinita) - una credenziale legata al dispositivo, sbloccata con la
biometria o il PIN del dispositivo.

- **Vantaggi**
  - Resistente al phishing - niente da digitare, copiare o trafugare; il segreto
    non lascia mai il dispositivo.
  - Veloce - un tocco biometrico o un PIN, nessun codice da leggere.
  - Nessun segreto condiviso da conservare o trascrivere.
- **Svantaggi**
  - **Nessuna notifica push e nessun supporto web** - la passkey vive sul telefono
    su cui è stata configurata, quindi l'accesso avviene solo lì: niente login da
    desktop/web e niente flusso "push per approvare".
  - Legata a quel dispositivo - perderlo significa dover registrarsi di nuovo
    (serve un ripristino).
  - Richiede un dispositivo con supporto biometrico / WebAuthn.

**App di autenticazione (TOTP)** - un codice a 6 cifre basato sul tempo, generato
da un'app come Google Authenticator, Authy o 1Password.

- **Vantaggi**
  - Funziona ovunque, anche sul web, e su più dispositivi.
  - Portabile - il seed può essere salvato o trasferito tra dispositivi.
  - Familiare e ampiamente supportata.
- **Svantaggi**
  - Devi digitare un codice a 6 cifre a ogni accesso.
  - Si basa su un segreto condiviso (il seed), che è vulnerabile al phishing e va
    conservato con cura.
  - I codici falliscono se l'orologio del dispositivo si disallinea.

> Nota: Keycloak non può presentare un'unica schermata di registrazione in cui
> scegliere tra passkey **o** OTP - una passkey si registra tramite la sua azione
> richiesta, l'OTP tramite il modulo OTP. Poiché la registrazione è opzionale, gli
> utenti aggiungono semplicemente quella che preferiscono dalla console account.

### La registrazione è opzionale (nessuna migrazione forzata)

Il passaggio MFA è `CONDITIONAL`: a un utente **con** una credenziale 2FA viene
richiesta; un utente **senza** accede con la sua password (nessuna registrazione
forzata). Poiché `webauthn-register-passwordless` / `CONFIGURE_TOTP` **non** sono
azioni predefinite, non c'è nulla da riassegnare retroattivamente quando questo
realm viene importato su una base utenti già esistente.

Se *vuoi* rendere la 2FA obbligatoria, contrassegna
`webauthn-register-passwordless` (e/o `CONFIGURE_TOTP`) come **azione predefinita**
nel realm - ma tieni presente che Keycloak applica le azioni predefinite anche agli
**utenti IdP mediati**, il che blocca i login tramite IdP esterno (ad es. Pocket
ID) dietro un passaggio di registrazione ridondante. È esattamente per questo che
qui è lasciata opzionale.

(Gli utenti che hanno già OTP o una passkey non vengono toccati e continuano a
usarla.)

## Modificare il realm

Le modifiche al realm si fanno nella **console di amministrazione**, e vengono poi
salvate nel repository così da essere versionate e integrate nella prossima
immagine.

1. Avvia lo stack di sviluppo e apri la console - vedi
   [Ambiente di sviluppo](setup/development.md).
2. Applica le modifiche al realm `schuly` tramite l'interfaccia.
3. Salva il realm in `realms/`:

   ```sh
   ./scripts/keycloak-export.sh        # bash / macOS / Linux
   ```

   Varianti Windows:

   ```powershell
   .\scripts\keycloak-export.ps1       # PowerShell
   ```

   ```bat
   scripts\keycloak-export.bat         REM cmd.exe (wraps the .ps1)
   ```

Lo script di export ferma il container in esecuzione, esegue il comando `export`
di Keycloak sulla cartella `realms/` (montata su `/export`, `--users skip`), poi
riavvia il container. Il file `realms/schuly-realm.json` aggiornato è quello che
committi.

> L'export esclude gli utenti (`--users skip`) - il file del realm contiene solo
> configurazione, non dati utente.

Committa il file `realms/schuly-realm.json` rigenerato seguendo il normale
[flusso di contribuzione](contributing.md).
