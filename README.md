# UnlockIST — GTA 6 India Launch Hub

India-first unofficial fan utilities: **IST countdown**, **download time**, **cost in ₹**, **launch planner**, **edition quiz**.

**Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.** Grand Theft Auto is a trademark of its respective owners.

## Stack

- Plain HTML / CSS / vanilla JS
- **Readable sources:** `src/` (edit here)
- **Deploy root:** minified HTML/CSS/JS at repo root (harder for casual reading)
- **Always editable at root:** `config.js`, `data/*.json`, `i18n/en.json`, `assets/`
- Rebuild after editing `src/`: `npm install` then `npm run build`

Brand placeholder in `config.js` → `siteName`: `UnlockIST` | `Ready for VI` | `GTA6 Prep India`.

Backup branch with pre-minify tree: `backup/readable-pre-minify`.

## Open locally

JSON / i18n fetch needs HTTP:

```bash
cd "H:/DEV/GTA 6 HUB"
python -m http.server 8080
```

Open `http://localhost:8080` (serves minified root + readable config/data).

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
| `supportLinks.buyMeACoffeeUrl` | config.js | BMC page URL — empty hides all support UI |
| `supportLinks.buyMeACoffeeQr` | config.js | Path to QR image (default `/assets/bmc-qr.png`) |
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
| `support.html` | Buy Me a Coffee + QR |
| `privacy.html` / `about.html` / `404.html` | Legal / meta |

## Support (Buy Me a Coffee)

1. Set `supportLinks.buyMeACoffeeUrl` in `config.js` (e.g. `https://buymeacoffee.com/gamedaytools`). Leave empty to hide every support CTA.
2. Replace `assets/bmc-qr.png` with your QR image, and keep `supportLinks.buyMeACoffeeQr` pointing at it (default `/assets/bmc-qr.png`).
3. Brand kit copies live under `assets/bmc/` (from `bmcbrand/`): cup logo, full logo, yellow CTA button — **support CTAs only**. Site header + favicon use `assets/unlockist-mark.png` (neon controller).
4. No third-party BMC widgets — official button image + optional QR modal only.
