# GTA 6 Hub

Unofficial fan utility site: launch countdown, timezone unlock converter, edition quiz, checklist, and console setup check.

**Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.** Grand Theft Auto is a trademark of its respective owners.

## Stack

- Plain HTML / CSS / vanilla JS
- No framework, no build step, no backend
- Editable config: `config.js`
- Placeholder facts: `data/*.json`

## Open locally

JSON fetch (checklist, quiz, setup table) needs HTTP — `file://` will fail those pages.

```bash
# Python
python -m http.server 8080

# Node
npx --yes serve -p 8080
```

Then open `http://localhost:8080`.

## Deploy (Vercel / Netlify)

1. Set `baseUrl` in `config.js` and replace `https://example.com` in HTML canonical/OG tags, `sitemap.xml`, and `robots.txt`.
2. Drag this folder into the Vercel or Netlify dashboard, or connect a Git repo with publish directory = site root.
3. Point Netlify/Vercel 404 to `404.html` if your host does not auto-detect it.
4. Fill AdSense / analytics / affiliate / signup fields when ready.

## Configure before launch

| Field | File | Notes |
|-------|------|--------|
| `baseUrl` | `config.js` | Live domain, no trailing slash |
| `launchDate` / `unlockMode` / `launchDateUtc` | `config.js` | Unlock clock still unconfirmed |
| `showUnlockUnconfirmedNotice` | `config.js` | Set `false` after Rockstar confirms |
| `adsenseClientId` | `config.js` | Empty = ad slots hidden |
| `analyticsId` | `config.js` | Optional |
| `affiliateLinks` | `config.js` | Replace example URLs |
| `signupUrl` | `config.js` | Formspree / WhatsApp / etc. |
| `contactEmail` | `config.js` | About / privacy |
| Editions & prices | `data/editions.json` | Marked unconfirmed |
| Checklist copy | `data/checklist.json` | Edit freely |
| Console / GTA 6 tech rows | `data/consoles.json` | TODO verify |

## Pages

- `index.html` — home + live countdown + tool cards + signup
- `countdown.html` — countdown, TZ converter, city list, FAQ JSON-LD
- `edition-quiz.html` — quiz → affiliate CTA
- `checklist.html` — localStorage progress
- `setup-check.html` — PS5 / Series X / Series S table
- `privacy.html` / `about.html` / `404.html`

## License / content

Original site code for this fan project. Do not add Rockstar logos, trailers, screenshots, fonts, or music.
