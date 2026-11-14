/**
 * UnlockIST shared helpers: i18n, nav, ads, share, countdown math.
 */
(function () {
  "use strict";

  var cfg = window.GTA6_CONFIG || {};
  var strings = {};

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function t(key, fallback) {
    if (strings[key] != null && strings[key] !== "") return strings[key];
    return fallback != null ? fallback : key;
  }

  function applyI18n() {
    qsa("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = t(key, el.textContent);
      el.textContent = val;
    });
    qsa("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder"), el.getAttribute("placeholder")));
    });
    /* Brand name from config */
    qsa("[data-brand]").forEach(function (el) {
      el.textContent = cfg.siteName || "UnlockIST";
    });
    var disc = qs("[data-disclaimer]");
    if (disc) disc.textContent = t("disclaimer", disc.textContent);
  }

  function loadI18n() {
    var locale = cfg.i18nLocale || "en";
    return fetch("i18n/" + locale + ".json")
      .then(function (r) {
        if (!r.ok) throw new Error("i18n");
        return r.json();
      })
      .then(function (data) {
        strings = data || {};
        applyI18n();
      })
      .catch(function () {
        applyI18n();
      });
  }

  function initNav() {
    var toggle = qs(".nav-toggle");
    var nav = qs("#site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      nav.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  function markCurrentNav() {
    var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!path || path === "/") path = "index.html";
    qsa(".site-nav a[href]").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop().toLowerCase();
      if (href === path) a.setAttribute("aria-current", "page");
    });
  }

  function initAds() {
    if (cfg.adsenseClientId && String(cfg.adsenseClientId).trim()) {
      document.documentElement.classList.add("ads-enabled");
    }
  }

  function initSignup() {
    var form = qs("#signup-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailInput = qs('input[name="email"]', form);
      var email = emailInput ? emailInput.value.trim() : "";
      var url = cfg.signupUrl || "#";
      if (!url || url.indexOf("TODO") !== -1 || url.indexOf("example.com") !== -1) {
        alert("Signup is not available yet. Please check back later.");
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

  /** Share result: Web Share API + clipboard fallback */
  function shareResult(opts) {
    var title = (opts && opts.title) || (cfg.siteName || "UnlockIST");
    var text = (opts && opts.text) || "";
    var url = (opts && opts.url) || location.href;
    var statusEl = (opts && opts.statusEl) || qs("#share-status");
    var payload = text + (url ? "\n" + url : "");

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg;
    }

    function copyFallback() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(payload).then(function () {
          setStatus(t("share.fallback", "Result copied to clipboard."));
        });
      }
      var ta = document.createElement("textarea");
      ta.value = payload;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setStatus(t("share.fallback", "Result copied to clipboard."));
      } catch (err) {
        setStatus(t("share.unsupported", "Copy this text manually:") + " " + payload);
      }
      document.body.removeChild(ta);
      return Promise.resolve();
    }

    if (navigator.share) {
      return navigator
        .share({ title: title, text: text, url: url })
        .then(function () {
          setStatus("Shared.");
        })
        .catch(function (err) {
          if (err && err.name === "AbortError") return;
          return copyFallback();
        });
    }
    return copyFallback();
  }

  function wireShareButtons(getPayload) {
    qsa("[data-share]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var payload = typeof getPayload === "function" ? getPayload() : getPayload || {};
        shareResult(payload);
      });
    });
    qsa("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var payload = typeof getPayload === "function" ? getPayload() : getPayload || {};
        var text = (payload.text || "") + (payload.url ? "\n" + payload.url : "");
        var statusEl = qs("#share-status");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            if (statusEl) statusEl.textContent = t("cta.copied", "Copied!");
          });
        } else {
          shareResult(payload);
        }
      });
    });
  }

  function localMidnightAsUtc(ymd, timeZone) {
    var parts = ymd.split("-").map(Number);
    var y = parts[0];
    var m = parts[1];
    var d = parts[2];
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
    var lo = guess - 36 * 3600 * 1000;
    var hi = guess + 36 * 3600 * 1000;
    var found = guess;
    for (var i = 0; i < 48; i++) {
      var mid = Math.floor((lo + hi) / 2);
      var p = tzParts(mid);
      var cmp =
        Number(p.year) - y ||
        Number(p.month) - m ||
        Number(p.day) - d ||
        Number(p.hour) - 0 ||
        Number(p.minute) - 0 ||
        Number(p.second) - 0;
      if (cmp === 0) {
        found = mid;
        break;
      }
      if (cmp < 0) lo = mid + 1;
      else hi = mid - 1;
      found = mid;
    }
    found = Math.floor(found / 1000) * 1000;
    p = tzParts(found);
    var offsetMs =
      (Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second)) * 1000;
    var result = found - offsetMs;
    p = tzParts(result);
    offsetMs =
      (Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second)) * 1000;
    return new Date(result - offsetMs);
  }

  function getLaunchDate(timeZone) {
    var mode = cfg.unlockMode || "local-midnight";
    if (mode === "fixed-utc") {
      return new Date(cfg.launchDateUtc || cfg.launchDate + "T00:00:00Z");
    }
    return localMidnightAsUtc(cfg.launchDate || "2026-11-19", timeZone || cfg.defaultTimezone || "Asia/Kolkata");
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
    return {
      released: false,
      days: Math.floor(totalSec / 86400),
      hours: Math.floor((totalSec % 86400) / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: totalSec % 60,
      ms: ms
    };
  }

  function renderCountdown(el, parts) {
    if (!el) return;
    if (parts.released) {
      el.innerHTML =
        '<p class="countdown-released" role="status">' +
        t("countdown.released", "It's out!") +
        "</p>";
      return;
    }
    function unit(value, label) {
      return (
        '<div class="countdown-unit"><span class="countdown-value">' +
        pad2(value) +
        '</span><span class="countdown-label">' +
        label +
        "</span></div>"
      );
    }
    el.innerHTML =
      '<div class="countdown" role="timer" aria-live="polite">' +
      unit(parts.days, "Days") +
      unit(parts.hours, "Hours") +
      unit(parts.minutes, "Mins") +
      unit(parts.seconds, "Secs") +
      "</div>";
  }

  function formatInTimezone(date, timeZone, options) {
    return new Intl.DateTimeFormat(
      "en-IN",
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

  function formatDuration(totalSeconds) {
    if (!isFinite(totalSeconds) || totalSeconds < 0) return "—";
    var s = Math.ceil(totalSeconds);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0) return h + "h " + m + "m " + sec + "s";
    if (m > 0) return m + "m " + sec + "s";
    return sec + "s";
  }

  function formatInr(n) {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(n);
    } catch (e) {
      return "₹" + Math.round(n).toLocaleString("en-IN");
    }
  }

  function startHomeCountdown() {
    var el = qs("#home-countdown");
    if (!el) return;
    var tz = detectTimezone();
    if (tz.indexOf("Kolkata") === -1 && cfg.defaultTimezone) {
      /* India-first home widget still prefers detected TZ; meta mentions IST */
    }
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
        "). Unlock clock time unconfirmed.";
    }
  }

  window.GTA6 = {
    config: cfg,
    qs: qs,
    qsa: qsa,
    t: t,
    loadI18n: loadI18n,
    shareResult: shareResult,
    wireShareButtons: wireShareButtons,
    getLaunchDate: getLaunchDate,
    localMidnightAsUtc: localMidnightAsUtc,
    detectTimezone: detectTimezone,
    diffParts: diffParts,
    renderCountdown: renderCountdown,
    formatInTimezone: formatInTimezone,
    formatDuration: formatDuration,
    formatInr: formatInr,
    pad2: pad2
  };

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    markCurrentNav();
    initAds();
    initSignup();
    loadI18n().then(function () {
      startHomeCountdown();
    });
  });
})();
