# Realm management

The `schuly` realm is defined in `realms/schuly-realm.json` and **imported on first
start** (`--import-realm`). It carries the Schuly identity config: the `Student` /
`Teacher` / `Administrator` realm roles and matching groups, OIDC client scopes, the
`schuly` login theme selection, a 2FA browser flow, and a password policy that
references the rockyou blacklist (`passwordBlacklist(rockyou.txt)`).

## Two-factor authentication

2FA is mandatory and **passkey-first**. The `browser-2fa` flow runs username +
password, then a *conditional* MFA step: if the user already has a 2FA credential
they're challenged for it (passkey or OTP — whichever they have). Users with no 2FA
credential are forced to register a **passkey** at next login, driven by the
`webauthn-register-passwordless` required action, which is marked as a *default
action* so it's applied automatically to every new user (including ones created via
the admin API).

OTP / authenticator-app (`CONFIGURE_TOTP`) is enabled but **optional** — users can
add it from the account console, and the login flow accepts it as an alternative to
a passkey.

> Note: Keycloak cannot present a "choose passkey **or** OTP" screen at first-login
> enrollment — a passkey can only be enrolled through the required action, and OTP
> only through the OTP form. The passkey-first model above is the supported way to
> offer both while keeping enrollment mandatory.

### ⚠️ Migration: applying this to a realm that already has users

The MFA step is `CONDITIONAL`, so a user with **no** 2FA credential skips it and
enforcement falls to the `webauthn-register-passwordless` **default action**. Default
actions are auto-assigned only to **new** users. On a fresh `--import-realm` deploy
this is fine (every user is new). But if you apply this flow to an **existing** realm,
any account that was provisioned earlier and has **never enrolled 2FA** would have no
credential *and* no required action — and could log in with **password only (MFA
bypass)**.

Before/at rollout, retroactively assign the required action to every 2FA-less user
(one-time). Example against a running instance (needs `jq`):

```sh
REALM=schuly; BASE=http://localhost:8080
TOK=$(curl -s -X POST "$BASE/realms/master/protocol/openid-connect/token" \
  -d client_id=admin-cli -d username="$KC_ADMIN" -d password="$KC_PASS" \
  -d grant_type=password | jq -r .access_token)

curl -s "$BASE/admin/realms/$REALM/users?max=100000" -H "Authorization: Bearer $TOK" \
  | jq -r '.[].id' | while read -r USERID; do
    HAS=$(curl -s "$BASE/admin/realms/$REALM/users/$USERID/credentials" \
      -H "Authorization: Bearer $TOK" \
      | jq -r '[.[].type] | map(select(. == "otp" or . == "webauthn-passwordless")) | length')
    if [ "$HAS" = "0" ]; then
      # fetch the full user rep, add the action (dedup), then PUT it back
      BODY=$(curl -s "$BASE/admin/realms/$REALM/users/$USERID" -H "Authorization: Bearer $TOK" \
        | jq '.requiredActions = ((.requiredActions // []) + ["webauthn-register-passwordless"] | unique)')
      curl -s -X PUT "$BASE/admin/realms/$REALM/users/$USERID" -H "Authorization: Bearer $TOK" \
        -H "Content-Type: application/json" -d "$BODY"
      echo "enrolled-action: $USERID"
    fi
  done
```

(Users who already have OTP or a passkey are left untouched and keep using it.)

## Editing the realm

Realm changes are made in the **admin console**, then snapshotted back into the
repo so they're version-controlled and baked into the next image.

1. Start the dev stack and open the console — see
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

> The export skips users (`--users skip`) — the realm file is configuration only,
> not user data.

Commit the regenerated `realms/schuly-realm.json` through the normal
[contribution workflow](contributing.md).
