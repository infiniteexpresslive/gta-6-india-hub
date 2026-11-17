# UnlockIST — GTA 6 India Launch Hub

India-first unofficial fan utilities: **IST countdown**, **download time**, **cost in ₹**, **launch planner**, **edition quiz**.

**Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.** Grand Theft Auto is a trademark of its respective owners.

## Stack

- **Vite multi-page app (MPA)** — each tool is its own HTML entry (crawlable, not a client-only SPA)
- Vanilla JS + shared CSS (`src/js`, `src/css`)
- Editable runtime files in `public/`: `config.js`, `data/*.json`, `i18n/`, `assets/`
- Neon-sunset UI + UnlockIST joystick mark; Buy Me a Coffee assets for support CTAs only

## Project layout

```
├── index.html, countdown.html, …, 404.html   # Vite HTML entries (SEO meta per page)
├── src/
│   ├── css/styles.css
│   └── js/                  # common + tools + entries/*
├── public/
│   ├── config.js            # edit brand, dates, affiliate, BMC
│   ├── data/                # prices.json, editions.json
│   ├── i18n/en.json
│   ├── assets/              # unlockist-mark, favicon, bmc/*
│   ├── robots.txt
│   └── sitemap.xml
├── vite.config.js           # MPA inputs → dist/ + clean URLs
└── vercel.json              # outputDirectory: dist, cleanUrls
```

## Run locally

```bash
cd "H:/DEV/GTA 6 HUB"
npm install
npm run dev
```

Open `http://localhost:8080`. Hot-reloads HTML/JS/CSS. `public/` files are served as-is.

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

`vercel.json` sets `framework: null`, `buildCommand: npm run build`, `outputDirectory: dist`, `cleanUrls: true`, `trailingSlash: false`.

Do **not** set Output Directory to `public` in the dashboard. Pretty paths: `/countdown`, `/cost-calculator`, `/support` (not `.html`).

Production Branch should be **`main`**.

Before go-live: replace `https://example.com` in `public/config.js` (`baseUrl`), HTML canonical/OG tags, `public/sitemap.xml`, and `public/robots.txt`.

## Configure

| Field | Where | Notes |
|-------|--------|--------|
| `siteName` | `public/config.js` | Brand string |
| `baseUrl` | `public/config.js` | Live domain |
| `contactEmail` | `public/config.js` | `gamedaytools@gmail.com` |
| `launchDate` / unlock modes | `public/config.js` | Unlock clock unconfirmed |
| `defaultInstallSizeGb` | `public/config.js` | Download calc — TODO verify |
| `adsenseClientId` / `analyticsId` | `public/config.js` | Empty = ads hidden |
| `affiliateLinks` | `public/config.js` | Replace example URLs |
| `supportLinks.buyMeACoffeeUrl` | `public/config.js` | Empty hides support UI |
| INR line items | `public/data/prices.json` | Unconfirmed |
| Editions | `public/data/editions.json` | Unconfirmed |

## Brand / favicon

Header + document icons use `/assets/unlockist-mark.png` (and `/assets/favicon.ico`). BMC cup/full logo/yellow button stay under `/assets/bmc/` for support CTAs only.
