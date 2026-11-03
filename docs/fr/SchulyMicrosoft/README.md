# Documentation SchulyMicrosoft

SchulyMicrosoft est un service FastAPI sans état qui donne à Schuly l'accès aux propres données
Microsoft 365 d'un élève : mail, calendrier, OneDrive, OneNote et Teams. Le plugin Schuly Microsoft est
son seul appelant.

Il n'a besoin ni d'une application Azure ni du consentement d'un administrateur de tenant, car il utilise
les clients pré-consentis de Microsoft par [OutNote](https://github.com/PianoNic/OutNote) et
[Entrance](https://github.com/PianoNic/Entrance).

- [Configuration de développement](setup/development.md)
- [Routes de l'API](https://github.com/schulydev/SchulyMicrosoft#how-sign-in-works), aussi disponibles à `/docs` sur un service en cours d'exécution

## Fonctionnement de la connexion

Le résultat de chaque connexion est un jeton de rafraîchissement. L'appelant le stocke et l'envoie à
chaque lecture dans l'en-tête `X-MS-Refresh-Token`. Le service renvoie le jeton renouvelé dans le même
en-tête et ne stocke rien.

| Processus | Utilisé par | Fonctionnement |
|---|---|---|
| Connexion par navigateur | Le plugin dans l'application mobile | Code d'autorisation avec PKCE sur la propre page de Microsoft dans une WebView |
| Code d'appareil | Les autres appelants | L'élève saisit un code court sur la page de Microsoft pendant que l'appelant interroge le service |
| Connexion par mot de passe | L'application web, qui ne peut pas héberger la page de Microsoft | Le service reçoit le mot de passe une seule fois, pour cet appel |

### Connexion par mot de passe

Le service garde le mot de passe en mémoire pour cet appel uniquement, et ne le stocke, ne le met en
cache, ne le journalise et ne le renvoie jamais. Si Microsoft demande une MFA, la connexion se met en
pause et propose `push` ou `otp`.

Seul le plugin Schuly peut appeler ces routes :

- Chaque requête a besoin du secret partagé dans `X-Schuly-Service-Key`. Il doit être égal à `SCHULY_SERVICE_KEY`. Si cette variable n'est pas définie, les routes répondent 503.
- Chaque requête a besoin de l'id de l'utilisateur Schuly dans `X-Schuly-User-Id`. Une tâche de connexion appartient à cet utilisateur.

Les tâches de connexion restent en mémoire pendant 10 minutes au maximum, donc le service doit tourner
dans exactement un seul processus. `asgi.py` définit `workers=1`.

## Avertissement

À des fins éducatives et de recherche, et uniquement sur des comptes qui t'appartiennent. Le service
pilote une vraie connexion Microsoft, donc traite tout jeton de rafraîchissement renvoyé comme un mot de
passe. Réutiliser les clients propres de Microsoft n'est pas une voie d'intégration officiellement prise
en charge, et un tenant peut la bloquer. Le projet n'est ni affilié à Microsoft ni approuvé par
Microsoft.
