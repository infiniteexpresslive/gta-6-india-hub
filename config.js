/**
 * GTA 6 Hub — site configuration
 * Edit this file to update launch date, monetization IDs, and affiliate links.
 * Do not invent Rockstar-confirmed facts; mark unknowns clearly.
 */
window.GTA6_CONFIG = {
  /* Site identity */
  siteName: "GTA 6 Hub",
  siteTagline: "Unofficial fan utilities for launch day",
  /* TODO: replace with your live domain (no trailing slash) */
  baseUrl: "https://example.com",

  /* Launch target — Rockstar has announced Thursday, 19 Nov 2026 on PS5 & Xbox Series X|S.
     Exact worldwide unlock clock time is NOT officially confirmed. */
  launchDate: "2026-11-19",
  /* "local-midnight" = treat launch as 00:00 in the visitor's selected timezone
     "fixed-utc" = use launchDateUtc below as a single global instant */
  unlockMode: "local-midnight",
  /* Used only when unlockMode === "fixed-utc". TODO: verify once Rockstar confirms. */
  launchDateUtc: "2026-11-19T00:00:00Z",

  /* Show the "Unlock time not officially confirmed" banner. Set false after Rockstar confirms. */
  showUnlockUnconfirmedNotice: true,

  /* Default timezone hint for India-first audience (auto-detect still preferred) */
  defaultTimezone: "Asia/Kolkata",

  /* Monetization — leave empty until accounts are ready */
  /* TODO: paste your AdSense client id, e.g. "ca-pub-xxxxxxxxxxxxxxxx" */
  adsenseClientId: "",
  /* TODO: paste your analytics measurement id if used */
  analyticsId: "",

  /* TODO: replace placeholders with real affiliate / store URLs */
  affiliateLinks: {
    standard: "https://example.com/affiliate/standard-TODO",
    deluxe: "https://example.com/affiliate/deluxe-TODO",
    collector: "https://example.com/affiliate/collector-TODO",
    digital: "https://example.com/affiliate/digital-TODO",
    physical: "https://example.com/affiliate/physical-TODO"
  },

  /* Signup form — placeholder posts nowhere useful until you set a real endpoint */
  /* TODO: Zapier / Formspree / Google Form / WhatsApp link */
  signupUrl: "https://example.com/signup-TODO",
  signupMethod: "GET", /* or "POST" depending on your form provider */

  /* Contact (shown on about / privacy) */
  contactEmail: "hello@example.com" /* TODO: your real email */
};
