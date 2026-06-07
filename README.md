# Sagun's Laundry Launch Site

Node.js/Express public site for Sagun's Laundry. The customer flow is WhatsApp-first: booking, signup requests, contact messages, and order confirmation are handed off to the official WhatsApp number. There is no admin panel, customer dashboard, database, or backend order system in this launch build.

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

Customer login, dashboard, admin, and `/php/*` API routes are disabled.

## Security Notes

- `logs/`, `data/`, admin views, and backend datastore files are not part of the launch build.
- The app sends security headers including CSP, frame deny, `nosniff`, referrer policy, and permissions policy.
- No customer passwords, OTPs, admin credentials, or order records are collected by this app.
