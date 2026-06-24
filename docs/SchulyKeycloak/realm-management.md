# Realm management

The `schuly` realm is defined in `realms/schuly-realm.json` and **imported on first
start** (`--import-realm`). It carries the Schuly identity config: the `Student` /
`Teacher` / `Administrator` realm roles and matching groups, OIDC client scopes, the
`schuly` login theme selection, a 2FA browser flow, and a password policy that
references the rockyou blacklist (`passwordBlacklist(rockyou.txt)`).

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
