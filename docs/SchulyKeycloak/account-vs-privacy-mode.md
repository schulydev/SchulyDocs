# Account vs. privacy mode

Schuly can be used in two ways. This page explains the trade-offs so you can choose
how to sign in.

## Account mode (recommended)

Sign in with a **Schuly account** — the cloud identity backed by this Keycloak. Your
profile and data live with Schuly and follow you across devices.

- **Pros**
  - **Push notifications** — get notified about changes (timetable, grades, messages).
  - **Web support** — use Schuly in the browser, not just the app.
  - **Cross-device sync** — sign in anywhere and pick up where you left off.
  - Protected by mandatory 2FA (passkey, with an authenticator app as an option) — see
    [Realm management](realm-management.md).
- **Cons**
  - Requires creating and signing in to an account.
  - Your data is stored in the Schuly cloud (secured, but not local-only).
  - Depends on the Schuly identity service being reachable.

## Privacy mode

Use the app **without a Schuly account** — it talks to your school portal directly and
keeps your credentials and data on the device.

- **Pros**
  - Maximum privacy — nothing is stored in the Schuly cloud.
  - No account to create; data stays on your device.
- **Cons**
  - **No push notifications and no web support** — both require a Schuly account, so
    in privacy mode you won't get notifications and can only use the app on the device.
  - No cross-device sync — each device is configured independently.

## Which should I pick?

Choose **account mode** if you want notifications, the web app, and your data synced
across devices — the everyday experience for most users. Choose **privacy mode** if you
prefer to keep everything on your device and don't need notifications, the web app, or
sync.
