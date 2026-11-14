# UnlockIST — GTA 6 India Launch Hub

India-first unofficial fan utilities: **IST countdown**, **download time**, **cost in ₹**, **launch planner**, **edition quiz**.

**Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.** Grand Theft Auto is a trademark of its respective owners.

## Stack

- Plain HTML / CSS / vanilla JS (no build step)
- Strings: `i18n/en.json` (ready for `ta` / `hi` later)
- Facts: `config.js` + `data/*.json`

Brand placeholder in `config.js` → `siteName`: `UnlockIST` | `Ready for VI` | `GTA6 Prep India`.

## Open locally

JSON / i18n fetch needs HTTP:

```bash
cd "H:/DEV/GTA 6 HUB"
python -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy

1. Replace `https://example.com` in `config.js` `baseUrl`, HTML canonical/OG tags, `sitemap.xml`, `robots.txt`.
2. Drag this folder to Vercel or Netlify (publish = site root).
3. Map 404 → `404.html` if the host does not auto-detect it.
4. Fill AdSense / analytics / affiliate / signup when ready.

## Configure

| Field | Where | Notes |
|-------|--------|--------|
| `siteName` | config.js | Brand string |
| `baseUrl` | config.js | Live domain |
| `launchDate` / `unlockMode` / `launchDateUtc` | config.js | Unlock clock unconfirmed |
| `defaultInstallSizeGb` | config.js | Download calc — TODO verify |
| `adsenseClientId` / `analyticsId` | config.js | Empty = ads hidden |
| `affiliateLinks` | config.js | Replace example URLs |
| `signupUrl` / `contactEmail` | config.js | |
| INR line items | `data/prices.json` | Unconfirmed |
| Editions | `data/editions.json` | Unconfirmed |

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home + countdown |
| `countdown.html` | IST unlock converter |
| `download-calculator.html` | Mbps → time |
| `cost-calculator.html` | ₹ checklist |
| `launch-planner.html` | Day timeline |
| `edition-quiz.html` | Edition scores |
| `privacy.html` / `about.html` / `404.html` | Legal / meta |
