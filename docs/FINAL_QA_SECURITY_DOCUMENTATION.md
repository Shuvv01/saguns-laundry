# Sagun's Laundry Launch Build - Final QA and Security Documentation

Date: 2026-06-07  
Environment: Local QA at `http://127.0.0.1:3001`  
Build Type: Public WhatsApp-first website  
Status: Passed final QA/security review for public launch testing

## 1. Executive Summary

Sagun's Laundry was finalized as a public marketing and booking website. Earlier backend, customer dashboard, admin panel, OTP, password, order API, and local JSON database features were removed from the launch build because the required business flow is WhatsApp-first.

The current website does not collect customer passwords, OTPs, admin credentials, online payments, or stored order records. Customers can view services/pricing, call the laundry, open the Imadol main branch location on Google Maps, and continue booking/signup/contact flows through WhatsApp.

Final automated and manual QA checks passed.

## 2. Current System Scope

Included:

- Homepage: `/` and `/index.php`
- Pricing page: `/pricing.php`
- WhatsApp signup/contact page: `/register.php`
- Static assets under `/assets`, `/css`, and `/js`
- WhatsApp booking links using `9779851332353`
- Phone links using `+977 9851332353`
- Imadol Main Branch Google Maps link
- Security headers for public pages

Disabled or removed:

- Admin panel
- Customer dashboard
- Login and forgot-password pages
- Backend `/php/*` APIs
- Order database/API
- OTP and password handling
- Local JSON datastore
- `bcryptjs` and `express-session` dependencies

## 3. Final Contact and Location Configuration

Mobile and WhatsApp number:

```text
+977 9851332353
```

WhatsApp number format used in links:

```text
9779851332353
```

Imadol Main Branch map:

```text
https://www.google.com/maps/place/Sagun%E2%80%99s+Laundry+(Imadole+Branch)/@27.6535661,85.2990485,14z/data=!4m10!1m2!2m1!1ssagun+laundry+imadol+branch!3m6!1s0x39eb17003e6c4097:0xfcb8501b58837524!8m2!3d27.6535661!4d85.3371573!15sChtzYWd1biBsYXVuZHJ5IGltYWRvbCBicmFuY2haHSIbc2FndW4gbGF1bmRyeSBpbWFkb2wgYnJhbmNokgEPbGF1bmRyeV9zZXJ2aWNlmgFEQ2k5RFFVbFJRVU52WkVOb2RIbGpSamx2VDJ4U00xUlZWWGhVYmxKTVkyNUZlbVJ0Um5saVYxWndWVEJuTW1SVlJSQULgAQD6AQQIABAT!16s%2Fg%2F11m754jd9x?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D
```

## 4. Architecture Overview

Runtime:

- Node.js
- Express
- EJS templates
- Static CSS/JS/assets

Dependencies:

```text
ejs
express
```

Pages:

- `views/index.ejs`
- `views/pricing.ejs`
- `views/register.ejs`

Main client script:

- `js/main.js`

Server:

- `server.js`

Packaging script:

- `scripts/package-qa.ps1`

## 5. Security Controls Implemented

HTTP security headers:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy`
- `Permissions-Policy`

Surface reduction:

- Removed admin authentication surface.
- Removed customer authentication surface.
- Removed backend mutation APIs.
- Removed local database files from the launch build.
- Removed session and password hashing dependencies.
- Disabled `/admin/*`, `/php/*`, and `/dashboard.php`.

Static file protection:

- Static assets are served only from intended public folders.
- Root-level asset fallback is restricted to file names inside `/assets`.
- `/data/db.json` returns `404`.

Data minimization:

- No passwords collected.
- No OTPs collected.
- No payment data collected.
- No customer records stored.
- Booking/contact details are handed off to WhatsApp by the user's browser.

## 6. OWASP Top 10 Review

| OWASP Area | Result | Notes |
|---|---:|---|
| Broken Access Control | Passed | Admin, dashboard, and backend API routes return `404`. No protected app surface remains. |
| Cryptographic Failures | Passed | No passwords, sessions, OTPs, or sensitive stored data remain in the launch build. |
| Injection | Passed | No database/API input processing remains. EJS output uses normal escaping for dynamic values. |
| Insecure Design | Improved | Design simplified to WhatsApp-first public website with minimal attack surface. |
| Security Misconfiguration | Passed | Security headers present; Express fingerprint disabled. |
| Vulnerable Components | Passed | `npm audit --audit-level=moderate` reported `0 vulnerabilities`. |
| Identification/Auth Failures | Not Applicable | Authentication has been removed from the launch build. |
| Software/Data Integrity Failures | Passed | Minimal dependency set and lockfile retained. |
| Logging/Monitoring Failures | Not Applicable | No backend transactions are stored or processed. Hosting logs should be handled by deployment platform. |
| SSRF | Not Applicable | App does not make server-side outbound requests based on user input. |

## 7. Automated QA Results

Automated suite executed against local server at:

```text
http://127.0.0.1:3001
```

Route checks:

| Route | Expected | Result |
|---|---:|---:|
| `/` | 200 | 200 |
| `/index.php` | 200 | 200 |
| `/pricing.php` | 200 | 200 |
| `/register.php` | 200 | 200 |
| `/admin` | 404 | 404 |
| `/admin/login.php` | 404 | 404 |
| `/php/admin_api.php` | 404 | 404 |
| `/php/auth.php` | 404 | 404 |
| `/php/orders.php` | 404 | 404 |
| `/dashboard.php` | 404 | 404 |
| `/data/db.json` | 404 | 404 |

Automated content checks:

| Check | Result |
|---|---:|
| Correct phone number visible on homepage | Passed |
| Correct `tel:+9779851332353` links present | Passed |
| Correct `https://wa.me/9779851332353` links present | Passed |
| Old `9851302350` number absent from homepage | Passed |
| Correct phone number visible on pricing page | Passed |
| Old `9851302350` number absent from pricing page | Passed |
| Imadol Main Branch Google Maps link present | Passed |
| Homepage does not expose admin API links | Passed |
| Register page remains WhatsApp-first | Passed |

Security header checks:

| Header | Result |
|---|---:|
| `Content-Security-Policy` | Present |
| `X-Content-Type-Options` | Present, `nosniff` |
| `X-Frame-Options` | Present, `DENY` |
| `Referrer-Policy` | Present |
| `Permissions-Policy` | Present |

Dependency and syntax checks:

| Command | Result |
|---|---:|
| `node --check server.js` | Passed |
| `npm audit --audit-level=moderate` | Passed, `0 vulnerabilities` |
| `npm ls --depth=0` | Passed, only `ejs` and `express` |
| Static scan for old number/backend/admin/datastore references | Passed |

## 8. Manual Browser QA Results

Manual QA was performed in the in-app browser against:

```text
http://127.0.0.1:3001/index.php
```

Homepage:

- Page title rendered correctly.
- Hero content rendered correctly.
- Correct phone number `+977 9851332353` visible.
- Old phone number `9851302350` not visible.
- WhatsApp booking links present.
- Imadol map links present.
- No broken images detected.
- Branch cards visible.
- Contact section visible.

Pricing:

- Page title rendered correctly.
- Correct phone number visible.
- Old phone number not visible.
- Five pricing service cards present.
- Seven FAQ items present.
- WhatsApp booking links present.

Register:

- Page title rendered correctly.
- Signup form present.
- Flow clearly continues on WhatsApp.
- Old phone number not visible.

Disabled surfaces:

- `/admin/login.php` displays `Not found`.
- Backend/admin functionality is not available through the browser.

Manual browser state captured:

```json
{
  "home": {
    "brokenImages": 0,
    "imadolMapLinks": 3,
    "telLinks": 5,
    "whatsappLinks": 4
  },
  "pricing": {
    "serviceCards": 5,
    "faqItems": 7,
    "whatsappLinks": 3
  },
  "adminLogin": "Not found"
}
```

## 9. Functional Flow Summary

Booking:

1. Customer clicks `Book Pickup`.
2. Browser opens WhatsApp link to `9779851332353`.
3. WhatsApp message is prefilled with pickup request.
4. Sagun's Laundry confirms pickup/delivery manually on WhatsApp.

Contact:

1. Customer enters name, phone, and message.
2. Browser opens WhatsApp with customer details in the message.
3. No backend storage occurs.

Signup/request:

1. Customer opens `/register.php`.
2. Customer fills signup request form.
3. Browser opens WhatsApp with signup details and local reference.
4. Account verification, if needed, is handled manually on WhatsApp.

Location:

1. Customer clicks Imadol Main Branch map link.
2. Google Maps opens in a new tab.

Calling:

1. Customer clicks call link.
2. Device dialer opens `+9779851332353`.

## 10. Files Changed During Finalization

Core:

- `server.js`
- `package.json`
- `package-lock.json`
- `README.md`

Public pages:

- `views/index.ejs`
- `views/pricing.ejs`
- `views/register.ejs`

Frontend:

- `js/main.js`
- `css/style.css`

Scripts:

- `scripts/package-qa.ps1`

Removed:

- Admin views
- Customer login/dashboard views
- Forgot-password view
- Local datastore code
- Conversion script containing old backend references
- Local data/log artifacts from QA

Added:

- `docs/FINAL_QA_SECURITY_DOCUMENTATION.md`

## 11. Launch Checklist

Before public hosting:

- Confirm final mobile number is `+977 9851332353`.
- Confirm WhatsApp business/device is active for `9779851332353`.
- Confirm Imadol Google Maps link opens the correct branch.
- Confirm branch hours are correct.
- Confirm pricing values are final.
- Confirm pickup/delivery radius statement is still `within 3 km`.
- Run `npm install --omit=dev` on deployment if needed.
- Run `npm start` or equivalent process manager command.
- Test public URL after deployment.

Recommended hosting checks:

- Force HTTPS at hosting/proxy level.
- Keep `node_modules`, logs, and internal files out of public static hosting.
- Use a process manager for Node if deployed as a server app.
- Keep the app public-only unless a future backend is intentionally designed and tested.

## 12. Known Limitations

- This launch build does not store orders.
- This launch build does not include an admin dashboard.
- This launch build does not provide online payment.
- This launch build does not provide automatic WhatsApp Business API messages.
- WhatsApp handoff depends on the user's browser/device and WhatsApp availability.

These limitations are intentional for the current launch scope.

## 13. Final QA Decision

Decision: Passed for public WhatsApp-first launch testing.

Rationale:

- Public pages render successfully.
- Backend/admin surfaces are disabled.
- Security headers are present.
- No vulnerable dependencies were detected at moderate level or above.
- Correct phone and WhatsApp number are used.
- Imadol Main Branch Google Maps link is present.
- No broken homepage images were detected.
- Old backend/datastore/admin references were removed from active app code.
