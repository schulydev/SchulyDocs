# Gestion du realm

Le realm `schuly` est défini dans `realms/schuly-realm.json` et **importé au premier
démarrage** (`--import-realm`). Il porte la configuration d'identité de Schuly : les
rôles de realm `Student` / `Teacher` / `Administrator` et leurs groupes
correspondants, les client scopes OIDC (`profile`, `email`, `groups`, `picture`), la
sélection du thème de connexion `schuly`, un flux navigateur 2FA, l'inscription en
libre-service et une politique de mot de passe qui référence la liste noire rockyou
(`passwordBlacklist(rockyou.txt)`).

## Auto-inscription

L'auto-inscription des utilisateurs est **activée** (`registrationAllowed`), donc la
page de connexion affiche un lien **S'inscrire** et les visiteurs peuvent créer leur
propre compte. Le formulaire est volontairement minimal grâce à un profil
utilisateur déclaratif - juste **nom d'utilisateur, e-mail et mot de passe** (pas de
prénom/nom). La vérification d'e-mail est désactivée par défaut (aucun SMTP n'est
configuré d'origine) - renseigne les variables `SMTP_*` de la
[Configuration](configuration.md#smtp-e-mail-du-realm) si tu veux que les e-mails
vérifiés ou la réinitialisation de mot de passe en libre-service soient réellement
délivrés.

## Authentification à deux facteurs

La 2FA privilégie la **clé d'accès (passkey), mais reste optionnelle**. Le flux
`browser-2fa` vérifie d'abord le nom d'utilisateur + mot de passe, puis une étape
MFA *conditionnelle* : si l'utilisateur possède déjà un identifiant 2FA, il lui est
demandé (clé d'accès ou OTP - selon ce qu'il possède). L'inscription est
**proposée, pas imposée** : `webauthn-register-passwordless` et `CONFIGURE_TOTP`
sont activés mais **ne sont pas** des actions par défaut, donc personne n'est bloqué
par une étape d'inscription obligatoire à la première connexion.

C'est important pour les **connexions déléguées (brokered logins)** via un IdP
externe (par ex. Pocket ID) : ces utilisateurs se sont déjà authentifiés avec une
clé d'accès à la source, une étape de clé d'accès imposée par Keycloak serait donc
redondante - et comme Keycloak applique aussi les actions par défaut aux
utilisateurs délégués, elle les bloquerait. Garder l'inscription optionnelle évite
cela.

L'OTP / l'appli d'authentification (`CONFIGURE_TOTP`) et les clés d'accès peuvent
tous deux être ajoutés depuis la console de compte, et le flux de connexion accepte
l'un ou l'autre comme étape 2FA.

### Choisir une méthode de connexion

Les deux méthodes satisfont l'étape 2FA. Tu peux ajouter une clé d'accès, une appli
d'authentification, ou les deux ; les compromis :

**Clé d'accès (passkey)** (par défaut) - un identifiant lié à l'appareil, déverrouillé
par biométrie ou code PIN de l'appareil.

- **Avantages**
  - Résistante au phishing - rien à taper, copier ou divulguer ; le secret ne quitte
    jamais l'appareil.
  - Rapide - un geste biométrique ou un code PIN, aucun code à lire.
  - Aucun secret partagé à stocker ou à retranscrire.
- **Inconvénients**
  - **Pas de notifications push ni de support web** - la clé d'accès vit sur le
    téléphone où elle a été configurée, la connexion s'y fait donc uniquement : pas
    de connexion bureau/web ni de flux « push pour approuver ».
  - Liée à cet appareil - le perdre implique de se réinscrire (récupération
    nécessaire).
  - Nécessite un appareil compatible biométrie / WebAuthn.

**Appli d'authentification (TOTP)** - un code à 6 chiffres basé sur le temps, généré
par une appli comme Google Authenticator, Authy ou 1Password.

- **Avantages**
  - Fonctionne partout, y compris sur le web, et sur plusieurs appareils.
  - Portable - la graine (seed) peut être sauvegardée ou déplacée d'un appareil à
    l'autre.
  - Familière et largement prise en charge.
- **Inconvénients**
  - Il faut taper un code à 6 chiffres à chaque connexion.
  - Repose sur un secret partagé (la graine), qui peut être hameçonné et doit être
    conservé en sécurité.
  - Les codes échouent si l'horloge de l'appareil se désynchronise.

> Remarque : Keycloak ne peut pas présenter un seul écran d'inscription « choisis
> clé d'accès **ou** OTP » - une clé d'accès s'inscrit via son action requise, l'OTP
> via le formulaire OTP. Comme l'inscription est optionnelle, les utilisateurs
> ajoutent simplement celle qu'ils préfèrent depuis la console de compte.

### L'inscription est optionnelle (pas de migration forcée)

L'étape MFA est `CONDITIONAL` : un utilisateur **disposant** d'un identifiant 2FA se
le voit demander ; un utilisateur qui **n'en a pas** se connecte avec son mot de
passe (pas d'inscription forcée). Comme `webauthn-register-passwordless` /
`CONFIGURE_TOTP` **ne sont pas** des actions par défaut, il n'y a rien à
réattribuer rétroactivement lors de l'import de ce realm sur une base
d'utilisateurs existante.

Si tu *veux* rendre la 2FA obligatoire, marque `webauthn-register-passwordless`
(et/ou `CONFIGURE_TOTP`) comme **action par défaut** dans le realm - mais garde à
l'esprit que Keycloak applique les actions par défaut aussi aux **utilisateurs d'IdP
délégués**, ce qui bloque les connexions via IdP externe (par ex. Pocket ID)
derrière une étape d'inscription redondante. C'est exactement pour cette raison
qu'elle est laissée optionnelle ici.

(Les utilisateurs qui ont déjà l'OTP ou une clé d'accès ne sont pas affectés et
continuent à l'utiliser.)

## Modifier le realm

Les changements de realm se font dans la **console d'administration**, puis sont
capturés dans le dépôt pour être versionnés et intégrés à la prochaine image.

1. Démarre la stack de développement et ouvre la console - voir
   [Environnement de développement](setup/development.md).
2. Effectue tes changements dans le realm `schuly` via l'interface.
3. Capture le realm vers `realms/` :

   ```sh
   ./scripts/keycloak-export.sh        # bash / macOS / Linux
   ```

   Variantes Windows :

   ```powershell
   .\scripts\keycloak-export.ps1       # PowerShell
   ```

   ```bat
   scripts\keycloak-export.bat         REM cmd.exe (wraps the .ps1)
   ```

Le script d'export arrête le conteneur en cours d'exécution, lance la commande
`export` de Keycloak sur le dossier `realms/` (monté sur `/export`, `--users skip`),
puis relance le conteneur. Le fichier `realms/schuly-realm.json` mis à jour est ce
que tu commits.

> L'export exclut les utilisateurs (`--users skip`) - le fichier du realm ne
> contient que de la configuration, pas de données utilisateur.

Commit le fichier `realms/schuly-realm.json` régénéré en suivant le
[workflow de contribution](contributing.md) habituel.
