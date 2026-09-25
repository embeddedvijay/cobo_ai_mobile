# Cobo AI Mobile

Separate Capacitor Android client for the cloud-hosted Cobo service. It does not change or bundle the Electron desktop app.

## Screens

- Token-based login
- Dashboard
- Configuration
- Transactions
- Hisab
- Run Final
- Cloud Start/Stop status

## Build Android APK

```bash
cd mobile
cp .env.example .env
# Set VITE_COBO_API_URL to the HTTPS cloud API domain
npm install
npx cap add android
npm run android:sync
npx cap open android
```

The cloud API must provide the `/mobile/*` endpoints declared in `src/api.js`. The app never connects directly to MongoDB or to the WhatsApp session.
