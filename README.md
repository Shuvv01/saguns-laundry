# Sagun's Laundry Launch Site

Node.js/Express site for Sagun's Laundry. The public customer flow is WhatsApp-first: booking, signup requests, contact messages, and order confirmation are handed off to the official WhatsApp number instead of relying on a production database.

## Requirements

- Node.js 18 or newer
- npm, unless the delivered QA zip includes `node_modules`

## Run Locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:3001/
```

If port `3001` is busy:

```powershell
$env:PORT=3002; npm start
```

Then open:

```text
http://localhost:3002/
```

## QA Package Notes

If QA does not have npm, send a zip that includes `node_modules`. If QA has npm, the cleaner zip can omit `node_modules` and QA should run `npm install` once before `npm start`.

To create a QA zip from Windows PowerShell:

```powershell
cd D:\laundry_zip
.\scripts\package-qa.ps1
```

This creates:

```text
D:\saguns-laundry-qa.zip
```

## Public Customer Flow

- Homepage booking buttons open WhatsApp with a prefilled pickup request.
- Register page sends a signup/reference request to WhatsApp.
- Pricing CTA opens WhatsApp.
- Contact form opens WhatsApp with the entered message.
- Pickup and delivery are stated as available up to 3 km from each branch.

Customer login/dashboard routes are not advertised for launch because the launch flow is intentionally WhatsApp-only.

## Local Admin / Demo Data

The app keeps a local JSON data file at:

```text
data/db.json
```

For a fresh setup, set an admin password before first run:

```powershell
$env:ADMIN_PASSWORD="choose-a-strong-password"
npm start
```

If `ADMIN_PASSWORD` is not set on first run, a random local admin password is generated and written to:

```text
data/admin-setup.txt
```

This file is local only and is not served by the app.

## Security Notes

- `logs/` is not served publicly.
- Do not deploy old QA logs or OTP logs.
- Set `SESSION_SECRET` in production.
- Set `ADMIN_PASSWORD` before first production run.
