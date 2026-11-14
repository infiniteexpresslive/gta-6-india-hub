/**
 * UnlockIST — GTA 6 India Launch Hub configuration
 * Edit freely. Do not invent Rockstar-confirmed facts.
 */
window.GTA6_CONFIG = {
  /* Brand: "UnlockIST" | "Ready for VI" | "GTA6 Prep India" */
  siteName: "UnlockIST",
  siteTagline: "GTA 6 India launch prep — IST, ₹, practical tools",
  /* TODO: replace with your live domain (no trailing slash) */
  baseUrl: "https://example.com",

  /* Announced calendar date: Thu 19 Nov 2026, PS5 & Xbox Series X|S.
     Exact worldwide unlock clock time is NOT officially confirmed. */
  launchDate: "2026-11-19",
  /* "local-midnight" (default) or "fixed-utc" */
  unlockMode: "local-midnight",
  /* Used only when unlockMode === "fixed-utc". TODO: verify once Rockstar confirms. */
  launchDateUtc: "2026-11-19T00:00:00Z",
  showUnlockUnconfirmedNotice: true,
  defaultTimezone: "Asia/Kolkata",

  /* Download calculator defaults — install size unconfirmed */
  /* TODO: verify install size (GB) on official store */
  defaultInstallSizeGb: 150,
  defaultDownloadEfficiency: 0.8,
  defaultSpeedMbps: 50,

  /* Monetization */
  /* TODO: AdSense client id e.g. "ca-pub-xxxxxxxxxxxxxxxx" */
  adsenseClientId: "",
  /* TODO: analytics measurement id */
  analyticsId: "",

  /* TODO: real affiliate / store URLs (India-friendly where possible) */
  affiliateLinks: {
    standard: "https://example.com/affiliate/standard-TODO",
    deluxe: "https://example.com/affiliate/deluxe-TODO",
    collector: "https://example.com/affiliate/collector-TODO",
    digital: "https://example.com/affiliate/digital-TODO",
    physical: "https://example.com/affiliate/physical-TODO",
    game: "https://example.com/affiliate/game-TODO"
  },

  /* TODO: Formspree / Google Form / WhatsApp link */
  signupUrl: "https://example.com/signup-TODO",
  signupMethod: "GET",

  /* TODO: your real email */
  contactEmail: "hello@example.com",

  currency: "INR",
  currencySymbol: "₹",
  i18nLocale: "en"
};
