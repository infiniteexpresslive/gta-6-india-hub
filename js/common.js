/**
 * Shared helpers: nav, ads, footer year, countdown widget for home.
 */
(function () {
  "use strict";

  var cfg = window.GTA6_CONFIG || {};

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* Mobile nav */
  function initNav() {
    var toggle = qs(".nav-toggle");
    var nav = qs("#site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      nav.classList.toggle("is-open", !open);
    });

    /* Close on Escape */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  /* Mark current nav link */
  function markCurrentNav() {
    var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (path === "" || path === "/") path = "index.html";
    qsa('.site-nav a[href]').forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop().toLowerCase();
      if (href === path) a.setAttribute("aria-current", "page");
    });
  }

  /* AdSense readiness — show reserved slots only when client id is set */
  function initAds() {
    if (cfg.adsenseClientId && String(cfg.adsenseClientId).trim()) {
      document.documentElement.classList.add("ads-enabled");
      /* Caller can load adsense script separately when ready */
    }
  }

  /* Analytics placeholder — no-op until analyticsId is set */
  function initAnalytics() {
    if (!cfg.analyticsId || !String(cfg.analyticsId).trim()) return;
    /* TODO: load your analytics snippet when analyticsId is filled */
  }

  /* Signup form → config.signupUrl */
  function initSignup() {
    var form = qs("#signup-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailInput = qs('input[name="email"]', form);
      var email = emailInput ? emailInput.value.trim() : "";
      var url = cfg.signupUrl || "#";
      if (!url || url.indexOf("TODO") !== -1 || url.indexOf("example.com") !== -1) {
        alert("Signup is not configured yet. Set signupUrl in config.js.");
        return;
      }
      if (cfg.signupMethod === "POST") {
        form.action = url;
        form.method = "POST";
        form.submit();
      } else {
        var sep = url.indexOf("?") >= 0 ? "&" : "?";
        location.href = url + sep + "email=" + encodeURIComponent(email);
      }
    });
  }

  /**
   * Resolve launch Date for a given IANA timezone.
   * unlockMode local-midnight → 00:00 on launchDate in that TZ
   * unlockMode fixed-utc → launchDateUtc instant
   */
  function getLaunchDate(timeZone) {
    var mode = cfg.unlockMode || "local-midnight";
    if (mode === "fixed-utc") {
      return new Date(cfg.launchDateUtc || cfg.launchDate + "T00:00:00Z");
    }
    /* local-midnight: find the UTC instant that is 00:00 in target TZ on launchDate */
    return localMidnightAsUtc(cfg.launchDate || "2026-11-19", timeZone || cfg.defaultTimezone || "Asia/Kolkata");
  }

  /**
   * Convert YYYY-MM-DD 00:00 in `timeZone` to a Date (UTC instant).
   * Uses binary search over UTC candidates with Intl.DateTimeFormat.
   */
  function localMidnightAsUtc(ymd, timeZone) {
    var parts = ymd.split("-").map(Number);
    var y = parts[0];
    var m = parts[1];
    var d = parts[2];
    /* Rough UTC guess: treat as UTC midnight then refine */
    var guess = Date.UTC(y, m - 1, d, 0, 0, 0);
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });

    function tzParts(ms) {
      var map = {};
      formatter.formatToParts(new Date(ms)).forEach(function (p) {
        if (p.type !== "literal") map[p.type] = p.value;
      });
      return map;
    }

    /* Search ±36h window around guess */
    var lo = guess - 36 * 3600 * 1000;
    var hi = guess + 36 * 3600 * 1000;
    var found = guess;
    for (var i = 0; i < 48; i++) {
      var mid = Math.floor((lo + hi) / 2);
      var p = tzParts(mid);
      var localY = Number(p.year);
      var localM = Number(p.month);
      var localD = Number(p.day);
      var localH = Number(p.hour);
      var localMin = Number(p.minute);
      var localSec = Number(p.second);
      var cmp =
        localY - y ||
        localM - m ||
        localD - d ||
        localH - 0 ||
        localMin - 0 ||
        localSec - 0;
      if (cmp === 0) {
        found = mid;
        break;
      }
      if (cmp < 0) lo = mid + 1;
      else hi = mid - 1;
      found = mid;
    }
    /* Snap to whole seconds, then subtract leftover local h/m/s to hit 00:00:00 */
    found = Math.floor(found / 1000) * 1000;
    p = tzParts(found);
    var offsetMs =
      (Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second)) * 1000;
    var result = found - offsetMs;
    /* Verify; nudge by seconds if DST/edge left us one second off */
    p = tzParts(result);
    offsetMs =
      (Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second)) * 1000;
    result = result - offsetMs;
    return new Date(result);
  }

  function detectTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || cfg.defaultTimezone || "Asia/Kolkata";
    } catch (e) {
      return cfg.defaultTimezone || "Asia/Kolkata";
    }
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function diffParts(target, now) {
    var ms = target.getTime() - now.getTime();
    if (ms <= 0) return { released: true, days: 0, hours: 0, minutes: 0, seconds: 0, ms: ms };
    var totalSec = Math.floor(ms / 1000);
    var days = Math.floor(totalSec / 86400);
    var hours = Math.floor((totalSec % 86400) / 3600);
    var minutes = Math.floor((totalSec % 3600) / 60);
    var seconds = totalSec % 60;
    return { released: false, days: days, hours: hours, minutes: minutes, seconds: seconds, ms: ms };
  }

  function renderCountdown(el, parts) {
    if (!el) return;
    if (parts.released) {
      el.innerHTML = '<p class="countdown-released" role="status">It\'s out!</p>';
      return;
    }
    el.innerHTML =
      '<div class="countdown" role="timer" aria-live="polite">' +
      unit(parts.days, "Days") +
      unit(parts.hours, "Hours") +
      unit(parts.minutes, "Mins") +
      unit(parts.seconds, "Secs") +
      "</div>";
  }

  function unit(value, label) {
    return (
      '<div class="countdown-unit">' +
      '<span class="countdown-value">' +
      pad2(value) +
      "</span>" +
      '<span class="countdown-label">' +
      label +
      "</span></div>"
    );
  }

  function startHomeCountdown() {
    var el = qs("#home-countdown");
    if (!el) return;
    var tz = detectTimezone();
    var launch = getLaunchDate(tz);

    function tick() {
      renderCountdown(el, diffParts(launch, new Date()));
    }
    tick();
    setInterval(tick, 1000);

    var meta = qs("#home-countdown-meta");
    if (meta) {
      meta.textContent =
        "Counting to " +
        (cfg.launchDate || "2026-11-19") +
        " (" +
        (cfg.unlockMode === "fixed-utc" ? "fixed UTC" : "local midnight in " + tz) +
        "). Unlock clock time is unconfirmed.";
    }
  }

  function formatInTimezone(date, timeZone, options) {
    return new Intl.DateTimeFormat(
      "en-GB",
      Object.assign(
        {
          timeZone: timeZone,
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
          timeZoneName: "short"
        },
        options || {}
      )
    ).format(date);
  }

  /* Expose for page scripts */
  window.GTA6 = {
    config: cfg,
    qs: qs,
    qsa: qsa,
    getLaunchDate: getLaunchDate,
    localMidnightAsUtc: localMidnightAsUtc,
    detectTimezone: detectTimezone,
    diffParts: diffParts,
    renderCountdown: renderCountdown,
    formatInTimezone: formatInTimezone,
    pad2: pad2
  };

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    markCurrentNav();
    initAds();
    initAnalytics();
    initSignup();
    startHomeCountdown();
  });
})();
