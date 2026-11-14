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

  function trimStr(v) {
    return v == null ? "" : String(v).trim();
  }

  function getSupportLinks() {
    return cfg.supportLinks || {};
  }

  /** Show CTA when BMC URL or UPI ID is set (QR is optional with UPI). */
  function hasSupportLinks() {
    var s = getSupportLinks();
    return !!(trimStr(s.buyMeACoffeeUrl) || trimStr(s.upiId));
  }

  var supportModalEl = null;
  var supportLastFocus = null;

  function ensureSupportModal() {
    if (supportModalEl) return supportModalEl;
    var wrap = document.createElement("div");
    wrap.className = "support-modal";
    wrap.id = "support-modal";
    wrap.setAttribute("hidden", "");
    wrap.setAttribute("role", "presentation");
    wrap.innerHTML =
      '<div class="support-modal-backdrop" data-support-close tabindex="-1"></div>' +
      '<div class="support-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="support-modal-title" tabindex="-1">' +
      '<button type="button" class="support-modal-close" data-support-close aria-label="' +
      t("support.close", "Close") +
      '">×</button>' +
      '<h2 id="support-modal-title">' +
      t("support.dialogTitle", "Support this site") +
      "</h2>" +
      '<p class="muted">' +
      t("support.blurb", "Help cover hosting and updates") +
      "</p>" +
      '<div class="support-modal-actions" id="support-modal-actions"></div>' +
      '<div class="support-upi-box" id="support-upi-box" hidden></div>' +
      '<p class="share-status" id="support-modal-status" aria-live="polite"></p>' +
      "</div>";
    document.body.appendChild(wrap);
    supportModalEl = wrap;

    wrap.addEventListener("click", function (e) {
      if (e.target && e.target.getAttribute("data-support-close") != null) {
        closeSupportModal();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!supportModalEl || supportModalEl.hasAttribute("hidden")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeSupportModal();
        return;
      }
      if (e.key === "Tab") {
        trapFocus(supportModalEl.querySelector(".support-modal-dialog"), e);
      }
    });
    return wrap;
  }

  function trapFocus(dialog, e) {
    var focusables = qsa(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      dialog
    ).filter(function (el) {
      return !el.hasAttribute("hidden") && el.offsetParent !== null;
    });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function fillSupportModalBody() {
    var s = getSupportLinks();
    var bmc = trimStr(s.buyMeACoffeeUrl);
    var upi = trimStr(s.upiId);
    var qr = trimStr(s.upiQrImage);
    var actions = qs("#support-modal-actions");
    var upiBox = qs("#support-upi-box");
    if (!actions || !upiBox) return;

    actions.innerHTML = "";
    if (bmc) {
      var a = document.createElement("a");
      a.className = "btn btn-primary";
      a.href = bmc;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = t("support.bmc", "Buy Me a Coffee");
      actions.appendChild(a);
    }

    if (upi) {
      upiBox.hidden = false;
      var qrHtml = qr
        ? '<img src="' +
          qr.replace(/"/g, "") +
          '" alt="UPI QR code" width="220" height="220" loading="lazy">'
        : "";
      upiBox.innerHTML =
        "<p class=\"mb-0\"><strong>" +
        t("support.upi", "Pay via UPI") +
        "</strong></p>" +
        qrHtml +
        '<p class="help-text mt-0">' +
        t("support.upiIdLabel", "UPI ID") +
        '</p><p class="support-upi-id" id="support-upi-id-text">' +
        upi.replace(/</g, "&lt;") +
        '</p><button type="button" class="btn btn-secondary" id="support-copy-upi">' +
        t("support.copyUpi", "Copy UPI ID") +
        "</button>";
      var copyBtn = qs("#support-copy-upi", upiBox);
      if (copyBtn) {
        copyBtn.addEventListener("click", function () {
          copyText(upi, qs("#support-modal-status"), t("support.copiedUpi", "UPI ID copied"));
        });
      }
    } else {
      upiBox.hidden = true;
      upiBox.innerHTML = "";
    }
  }

  function copyText(text, statusEl, okMsg) {
    function done() {
      if (statusEl) statusEl.textContent = okMsg;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text, done);
      });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      if (done) done();
    } catch (err) {
      /* ignore */
    }
    document.body.removeChild(ta);
  }

  function openSupportModal(trigger) {
    ensureSupportModal();
    fillSupportModalBody();
    supportLastFocus = trigger || document.activeElement;
    supportModalEl.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    var dialog = qs(".support-modal-dialog", supportModalEl);
    var firstBtn = qs("a.btn, button:not(.support-modal-close)", dialog) || qs(".support-modal-close", dialog);
    if (firstBtn) firstBtn.focus();
    else if (dialog) dialog.focus();
  }

  function closeSupportModal() {
    if (!supportModalEl || supportModalEl.hasAttribute("hidden")) return;
    supportModalEl.setAttribute("hidden", "");
    document.body.style.overflow = "";
    if (supportLastFocus && supportLastFocus.focus) supportLastFocus.focus();
    supportLastFocus = null;
  }

  function makeSupportButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-support";
    btn.textContent = t("support.cta", "Support this site");
    btn.setAttribute("aria-haspopup", "dialog");
    btn.addEventListener("click", function () {
      var s = getSupportLinks();
      var bmc = trimStr(s.buyMeACoffeeUrl);
      var upi = trimStr(s.upiId);
      /* BMC only → open external link; otherwise modal (UPI / both) */
      if (bmc && !upi) {
        var link = document.createElement("a");
        link.href = bmc;
        link.target = "_blank";
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      openSupportModal(btn);
    });
    return btn;
  }

  function fillSupportSlot(slot, opts) {
    if (!slot) return;
    if (!hasSupportLinks()) {
      slot.innerHTML = "";
      slot.classList.add("is-empty");
      slot.hidden = true;
      return;
    }
    slot.hidden = false;
    slot.classList.remove("is-empty");
    var compact = opts && opts.compact;
    slot.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "support-inline";
    if (!compact) {
      var blurb = document.createElement("p");
      blurb.className = "support-blurb";
      blurb.textContent = t("support.blurb", "Help cover hosting and updates");
      wrap.appendChild(blurb);
    }
    wrap.appendChild(makeSupportButton());
    slot.appendChild(wrap);
  }

  function ensureResultSupportSlots() {
    /* Prefer one slot under each tool share bar (result CTAs). */
    qsa(".share-bar").forEach(function (bar) {
      var parent = bar.parentNode;
      if (!parent) return;
      if (parent.querySelector("[data-support-slot=result]")) return;
      var slot = document.createElement("div");
      slot.setAttribute("data-support-slot", "result");
      slot.className = "support-slot support-slot-result";
      if (bar.nextSibling) parent.insertBefore(slot, bar.nextSibling);
      else parent.appendChild(slot);
    });
    /* Result boxes without a share-bar sibling still get a slot */
    qsa(".result-box").forEach(function (box) {
      if (box.querySelector("[data-support-slot]")) return;
      if (box.querySelector(".share-bar")) return;
      var slot = document.createElement("div");
      slot.setAttribute("data-support-slot", "result");
      slot.className = "support-slot support-slot-result";
      box.appendChild(slot);
    });
  }

  function ensureFooterSupportSlot() {
    qsa(".footer-inner").forEach(function (inner) {
      if (inner.querySelector("[data-support-slot=footer]")) return;
      var slot = document.createElement("div");
      slot.setAttribute("data-support-slot", "footer");
      slot.className = "support-slot footer-support";
      var disc = inner.querySelector(".disclaimer");
      if (disc) inner.insertBefore(slot, disc);
      else inner.appendChild(slot);
    });
  }

  function mountSupportUI() {
    ensureFooterSupportSlot();
    ensureResultSupportSlots();
    qsa("[data-support-slot]").forEach(function (slot) {
      fillSupportSlot(slot, { compact: slot.getAttribute("data-support-slot") === "result" });
    });
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
    hasSupportLinks: hasSupportLinks,
    mountSupportUI: mountSupportUI,
    openSupportModal: openSupportModal,
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
      mountSupportUI();
    });
  });
})();
