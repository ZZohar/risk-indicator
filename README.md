# Risk Indicator Mobile Web App (PWA)

Mobile-first web app that shows a **weighted risk score in percent (0–95%)** with a circular gauge and **Hebrew explanation**.
Includes:
1) **Real data integrations** (OSINT-friendly) via server API routes:
   - Weather/visibility: Open-Meteo (no key required)
   - CERT-IL advisories: Gov.il RSS feed
   - Air traffic heuristics: OpenSky (optional; limited without auth) + NOTAM placeholder (requires provider)
   - Home Front Command: pluggable endpoint (official portal exists, but data API is not formally documented; you must validate legality/ToS)
2) **Push notifications** via Web Push (VAPID) + service worker
3) **History** (snapshots) + chart (Recharts)

> ⚠️ Important: This app is an *indicative OSINT dashboard only*. It is NOT a replacement for official guidance.

## Quick start
```bash
npm i
npm run dev
```

Open: http://localhost:3000

## Configure (optional but recommended)

Create `.env.local`:
```bash
# Web Push (required for real push when app is closed)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com

# Iran target point (default is Tehran)
TARGET_LAT=35.6892
TARGET_LON=51.3890

# CERT-IL RSS (Hebrew) - default is set in code
CERT_IL_RSS=https://www.gov.il/he/api/PublicationApi/rss/4bcc13f5-fed6-4b8c-b8ee-7bf4a6bc81c8

# Optional: OpenSky auth (improves rate limits)
OPENSKY_USERNAME=
OPENSKY_PASSWORD=

# Optional: NOTAM provider (you must choose a provider and add adapter)
NOTAM_PROVIDER=
NOTAM_API_KEY=
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

## Deploy & Share
- Deploy to Vercel / Render / your server.
- Add to phone: open site → “Add to Home Screen”.
- Users can enable notifications from the main screen.

## Data sources used
- Open-Meteo weather API docs: https://open-meteo.com/en/docs
- CERT-IL RSS via Gov.il PublicationApi (see repository references in code)
