# Documentazione di SchulyMicrosoft

SchulyMicrosoft è un servizio FastAPI senza stato che dà a Schuly l'accesso ai dati Microsoft
365 dello studente: mail, calendario, OneDrive, OneNote e Teams. Il plugin Microsoft di Schuly è il suo unico chiamante.

Non servono un'app Azure né il consenso di un amministratore del tenant, perché il servizio usa i client di Microsoft
con consenso già concesso, tramite [OutNote](https://github.com/PianoNic/OutNote) e
[Entrance](https://github.com/PianoNic/Entrance).

- [Setup di sviluppo](setup/development.md)
- [Route API](https://github.com/schulydev/SchulyMicrosoft#how-sign-in-works), disponibili anche su `/docs` in un servizio in esecuzione

## Come funziona l'accesso

Il risultato di ogni accesso è un refresh token. Il chiamante lo memorizza e lo invia a ogni lettura nell'header
`X-MS-Refresh-Token`. Il servizio restituisce il token ruotato nello stesso header e non memorizza
nulla.

| Flusso | Usato da | Come funziona |
|---|---|---|
| Accesso dal browser | Il plugin nell'app mobile | Authorization code con PKCE sulla pagina di Microsoft in una WebView |
| Device code | Altri chiamanti | Lo studente inserisce un codice breve sulla pagina di Microsoft mentre il chiamante esegue il polling |
| Accesso con password | L'app web, che non può ospitare la pagina di Microsoft | Il servizio riceve la password una volta, per quella chiamata |

### Accesso con password

Il servizio tiene la password in memoria solo per quella chiamata. Non la memorizza, non la mette in cache, non la scrive nei log e non la
restituisce mai. Se Microsoft chiede l'MFA, l'accesso si mette in pausa e offre `push` o `otp`.

Solo il plugin di Schuly può chiamare queste route:

- Ogni richiesta ha bisogno del segreto condiviso in `X-Schuly-Service-Key`. Deve essere uguale a `SCHULY_SERVICE_KEY`. Se questa variabile non è impostata, le route rispondono 503.
- Ogni richiesta ha bisogno dell'id dell'utente Schuly in `X-Schuly-User-Id`. Un job di accesso appartiene a quell'utente.

I job di accesso restano in memoria per un massimo di 10 minuti, quindi il servizio deve funzionare come un unico processo.
`asgi.py` imposta `workers=1`.

## Esclusione di responsabilità

Per scopi didattici e di ricerca, e solo con account di tua proprietà. Il servizio esegue un vero accesso a
Microsoft, quindi tratta ogni refresh token restituito come una password. Riutilizzare i client first-party di Microsoft
non è un metodo di integrazione supportato ufficialmente, e un tenant può bloccarlo. Il
progetto non è affiliato a Microsoft né approvato da Microsoft.
