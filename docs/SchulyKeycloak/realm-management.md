# Realm management

The `schuly` realm is defined in `realms/schuly-realm.json` and **imported on first
start** (`--import-realm`). It carries the Schuly identity config: the `Student` /
`Teacher` / `Administrator` realm roles and matching groups, OIDC client scopes
(`profile`, `email`, `groups`, `picture`), the `schuly` login theme selection, a 2FA
browser flow, self-service registration, and a password policy that references the
rockyou blacklist (`passwordBlacklist(rockyou.txt)`).

## Self-registration

User self-registration is **enabled** (`registrationAllowed`), so the login page shows
a **Register** link and visitors can create their own account. The form is kept minimal
via a declarative user profile - just **username, email and password** (no first/last
name). Email verification is off by default (no SMTP is configured out of the box) -
wire up SMTP in the realm if you want verified emails or self-service password reset to
actually deliver.

## Two-factor authentication

2FA is **passkey-first but optional**. The `browser-2fa` flow runs username + password,
then a *conditional* MFA step: if the user already has a 2FA credential they're
challenged for it (passkey or OTP - whichever they have). Enrollment is **offered, not
forced**: `webauthn-register-passwordless` and `CONFIGURE_TOTP` are enabled but **not**
default actions, so no one is blocked by a mandatory enrollment step at first login.

This matters for **brokered logins** (an external IdP such as Pocket ID): those users
already authenticated with a passkey at the source, so a forced Keycloak passkey step
would be redundant - and, because Keycloak applies default required actions to brokered
users too, it would block them. Keeping enrollment optional avoids that.

OTP / authenticator-app (`CONFIGURE_TOTP`) and passkeys can both be added from the
account console, and the login flow accepts either as the 2FA step.

### Choosing a sign-in method

Either method satisfies the 2FA step. You can add a passkey, an authenticator app, or
both; the trade-offs:

**Passkey** (default) - a credential bound to the device, unlocked with biometrics or
the device PIN.

- **Pros**
  - Phishing-resistant - nothing to type, copy, or leak; the secret never leaves the device.
  - Fast - one biometric/PIN tap, no codes to read.
  - No shared secret to store or transcribe.
- **Cons**
  - **No push notifications and no web support** - the passkey lives on the phone it
    was set up on, so sign-in happens there: no desktop/web login and no
    push-to-approve flow.
  - Tied to that device - losing it means re-enrolling (recovery needed).
  - Requires a device with biometric / WebAuthn support.

**Authenticator app (TOTP)** - a 6-digit time-based code from an app like Google
Authenticator, Authy, or 1Password.

- **Pros**
  - Works anywhere, including the web, and across multiple devices.
  - Portable - the seed can be backed up or moved between devices.
  - Familiar and widely supported.
- **Cons**
  - You type a 6-digit code on every sign-in.
  - Relies on a shared secret (the seed), which is phishable and must be kept safe.
  - Codes fail if the device clock drifts out of sync.

> Note: Keycloak can't present a single "choose passkey **or** OTP" enrollment screen -
> a passkey is enrolled through its required action and OTP through the OTP form. Since
> enrollment is optional, users just add whichever they prefer from the account console.

### Enrollment is optional (no forced migration)

The MFA step is `CONDITIONAL`: a user **with** a 2FA credential is challenged for it; a
user **without** one signs in with their password (no forced enrollment). Because
`webauthn-register-passwordless` / `CONFIGURE_TOTP` are **not** default actions, there's
nothing to retro-assign when importing this realm onto an existing user base.

If you *want* to hard-require 2FA, mark `webauthn-register-passwordless` (and/or
`CONFIGURE_TOTP`) as a **default action** in the realm - but be aware Keycloak applies
default actions to **brokered IdP users too**, which blocks external-IdP (e.g. Pocket ID)
logins behind a redundant enrollment step. That's exactly why it's left optional here.

(Users who already have OTP or a passkey are left untouched and keep using it.)

## Editing the realm

Realm changes are made in the **admin console**, then snapshotted back into the
repo so they're version-controlled and baked into the next image.

1. Start the dev stack and open the console - see
   [Development setup](setup/development.md).
2. Make your changes in the `schuly` realm via the UI.
3. Snapshot the realm back into `realms/`:

   ```sh
   ./scripts/keycloak-export.sh        # bash / macOS / Linux
   ```

   Windows variants:

   ```powershell
   .\scripts\keycloak-export.ps1       # PowerShell
   ```

   ```bat
   scripts\keycloak-export.bat         REM cmd.exe (wraps the .ps1)
   ```

The export script stops the running container, runs Keycloak's `export` command
against the `realms/` folder (mounted at `/export`, `--users skip`), then brings the
container back up. The updated `realms/schuly-realm.json` is what you commit.

> The export skips users (`--users skip`) - the realm file is configuration only,
> not user data.

Commit the regenerated `realms/schuly-realm.json` through the normal
[contribution workflow](contributing.md).
