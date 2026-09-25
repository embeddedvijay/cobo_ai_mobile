# Cobo AI Mobile

Separate Capacitor + React Android control/monitoring client for Cobo AI.

> This repository is the Android client only. Do not move or duplicate the Electron desktop/Baileys bot into this app. The bot, WhatsApp session, processing, scheduler, outbox and MongoDB stay on the server.

## Architecture

```text
Android / Genymotion
        |
        | HTTP for local testing / HTTPS in cloud
        | Bearer token
        v
Cobo server API
        |
        +-- /mobile/* API
        +-- client_id authenticated workspace
        +-- existing bot/runtime
        +-- MongoDB
```

The Android app never connects directly to MongoDB and never stores a MongoDB connection string. Existing Cobo records already use `client_id`; the mobile API must resolve the authenticated customer's `client_id` from the login/token and scope all reads/writes to it.

## Current local test setup

Current development host:

```text
192.168.0.106
```

Existing Cobo npm/server service:

```text
http://192.168.0.106:8015
```

Create `.env` in this repository:

```bash
cp .env.example .env
```

For the current Genymotion/local-network test use:

```env
VITE_COBO_API_URL=http://192.168.0.106:8015
```

Later, for cloud deployment, only change this value to the HTTPS API domain, for example:

```env
VITE_COBO_API_URL=https://api.example.com
```

## Required /mobile API

The Android UI in `src/api.js` currently expects:

```text
POST /mobile/auth/login
GET  /mobile/me

GET  /mobile/dashboard?date=YY-MM-DD

GET  /mobile/config
PUT  /mobile/config

GET  /mobile/transactions?date=YY-MM-DD
GET  /mobile/hisab?date=YY-MM-DD

GET  /mobile/final-options
POST /mobile/run-final

GET  /mobile/service/status
POST /mobile/service/start
POST /mobile/service/stop
```

The WhatsApp screen/backend phase also requires:

```text
GET  /mobile/whatsapp/status
GET  /mobile/whatsapp/qr
POST /mobile/whatsapp/logout
```

These routes belong on the server side. They are not implemented by the Android APK itself. Except for login, protected endpoints should use:

```http
Authorization: Bearer <token>
```

The server must derive `client_id` from the authenticated token/session. Do not trust a client-supplied `client_id` to select another customer's data.

## Screens

Target Android screens:

1. Login
2. WhatsApp QR login/logout
3. Dashboard + live accepted messages
4. Configuration: input groups, LD, Instant, overflow/output, OK toggles, market timings/Dynamic Timing
5. Transactions + reject/correction
6. Results & markets
7. Hisab date/customer-wise
8. Run Final
9. Start/Stop service status + debug logs

## Install dependencies

From the cloned repository:

```bash
cd ~/cobo_ai_mobile
npm install
```

## Build web assets

```bash
npm run build
```

## Prepare Android

If the repository already contains an `android/` directory:

```bash
npx cap sync android
```

If `android/` does not exist yet:

```bash
npx cap add android
npx cap sync android
```

Whenever React/API code or `.env` changes, run the sync again before rebuilding the APK:

```bash
npm run build
npx cap sync android
```

## Genymotion test

Start the existing Genymotion device and verify ADB:

```bash
adb devices
```

Before debugging the APK, verify that the emulator can reach the Cobo host/service at:

```text
http://192.168.0.106:8015
```

The server must listen on an interface reachable from the emulator, not only on `127.0.0.1`.

Build the debug APK:

```bash
cd android
./gradlew assembleDebug
```

Install/reinstall it:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Then open Cobo AI Mobile in Genymotion.

## One-command local rebuild sequence

```bash
cd ~/cobo_ai_mobile
npm install
printf 'VITE_COBO_API_URL=http://192.168.0.106:8015\n' > .env
npm run build
npx cap sync android
adb devices
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Server-side rules that must remain intact

The mobile API is a control/monitoring layer. It must not bypass the existing Cobo safety/business flow:

- Existing `client_id` isolation for every customer's data.
- Raw message/message-id durability and dedupe.
- Durable outbox.
- Uncertain WhatsApp sends are never blindly retried.
- Reconnect stabilization and network-flap send pause remain server-side.
- Business date rolls over at 04:00.
- Instant sends only the LD-cut table, never raw input.
- Normal valid games remain scheduled/final.
- Only unparsed Fast-forward messages go directly to the configured output.
- LD 100% overflow sends only the category excess instantly; base remains scheduled.
- Ambiguous group names block routing.
- Normal chat with no numeric digit is ignored.
- Run Final processes selected output groups first, then input groups, with date-wise final/progressive play summary.

## Subscription/cloud phase

Each customer will use a separate authenticated `client_id` workspace with its own WhatsApp auth/session, config/groups, transactions, Hisab and outbox.

Monthly rental state will support active/expired status. Expiry must pause safely without deleting the WhatsApp auth state or creating duplicate/false sends. Renewal should resume the existing session/data; a new QR should only be required after an actual WhatsApp logout/session invalidation.

## Important

The existing desktop Electron app and desktop workflow are not part of this mobile repository and must not be changed just to make the Android client work.


## Local backend adapter status

For local Android testing, `embeddedvijay/cobo_ai` now exposes an additive `/mobile/*` adapter from the existing FastAPI process. It reuses the final desktop dashboard, transactions, Hisab, results and Run Final services instead of duplicating business logic.

Local-test safeguards:

- Desktop `/desktop/*` routes are unchanged.
- Android resolves the currently configured runtime client on the server; it does not send a trusted Mongo/client selector.
- `GET /mobile/config` is read-only in local test mode.
- `PUT /mobile/config` is intentionally blocked so Android cannot overwrite the desktop-generated runtime configuration.
- Android Stop Service is intentionally blocked while the process is desktop-owned; the backend must never kill/spawn a duplicate copy of itself.
- Cloud deployment will replace the local client resolver with authenticated token -> client mapping and tenant-owned runtime controls.

Current local test endpoints available from the existing port 8015 include dashboard, transactions, Hisab, results, final options, Run Final, config read and service status.
