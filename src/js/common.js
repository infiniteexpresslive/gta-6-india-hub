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
    return fetch("/i18n/" + locale + ".json")
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
    function norm(p) {
      p = String(p || "/").split("?")[0].split("#")[0];
      p = p.replace(/\.html$/i, "");
      if (!p || p === "/" || p === "/index") return "/";
      return p.replace(/\/+$/, "") || "/";
    }
    var path = norm(location.pathname);
    qsa(".site-nav a[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (/^(https?:|mailto:|#)/i.test(href)) return;
      if (norm(href) === path) a.setAttribute("aria-current", "page");
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

  /** Show support UI when Buy Me a Coffee URL is set in config. */
  function hasSupportLinks() {
    return !!trimStr(getSupportLinks().buyMeACoffeeUrl);
  }

  function supportBmcUrl() {
    return trimStr(getSupportLinks().buyMeACoffeeUrl);
  }

  function supportQrPath() {
    return trimStr(getSupportLinks().buyMeACoffeeQr);
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
      '<div class="support-qr-wrap" id="support-qr-wrap" hidden></div>' +
      '<p class="support-url-text" id="support-url-text"></p>' +
      '<div class="support-modal-actions" id="support-modal-actions"></div>' +
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
    var bmc = supportBmcUrl();
    var qr = supportQrPath();
    var qrWrap = qs("#support-qr-wrap");
    var urlEl = qs("#support-url-text");
    var actions = qs("#support-modal-actions");
    if (!actions) return;

    if (urlEl) urlEl.textContent = bmc;

    if (qrWrap) {
      qrWrap.innerHTML = "";
      if (qr) {
        qrWrap.hidden = false;
        var img = document.createElement("img");
        img.src = qr;
        img.alt = t("support.qrAlt", "Scan to support Game Day Tools");
        img.width = 220;
        img.height = 220;
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", function () {
          qrWrap.hidden = true;
          qrWrap.innerHTML = "";
        });
        qrWrap.appendChild(img);
      } else {
        qrWrap.hidden = true;
      }
    }

    actions.innerHTML = "";
    if (bmc) {
      actions.appendChild(makeBmcLink());

      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-secondary";
      copyBtn.textContent = t("support.copyLink", "Copy link");
      copyBtn.addEventListener("click", function () {
        copyText(bmc, qs("#support-modal-status"), t("support.copiedLink", "Link copied"));
      });
      actions.appendChild(copyBtn);
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
    if (!hasSupportLinks()) return;
    ensureSupportModal();
    fillSupportModalBody();
    supportLastFocus = trigger || document.activeElement;
    supportModalEl.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    var dialog = qs(".support-modal-dialog", supportModalEl);
    var firstBtn =
      qs("a.btn, button:not(.support-modal-close)", dialog) || qs(".support-modal-close", dialog);
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

  function makeBmcLink() {
    var a = document.createElement("a");
    a.className = "bmc-btn-link";
    a.href = supportBmcUrl();
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", t("support.bmc", "Buy Me a Coffee"));
    var img = document.createElement("img");
    img.src = "/assets/bmc/yellow-button.png";
    img.alt = t("support.bmc", "Buy me a coffee");
    img.width = 200;
    img.height = 56;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", function () {
      /* Fallback text button if brand asset missing */
      a.className = "btn btn-support";
      a.textContent = t("support.cta", "☕ Support this site");
      a.removeChild(img);
    });
    a.appendChild(img);
    return a;
  }

  function ensureBrandIcons() {
    var mark = "/assets/unlockist-mark.png?v=3";
    var icoHref = "/assets/favicon.ico?v=3";
    function upsertIcon(rel, href, type, sizes) {
      var nodes = document.querySelectorAll('link[rel="' + rel + '"]');
      var el = nodes[0];
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
      if (type) el.type = type;
      if (sizes) el.setAttribute("sizes", sizes);
      /* Drop any leftover BMC / old favicon links */
      for (var i = 1; i < nodes.length; i++) {
        if (nodes[i].getAttribute("sizes") === "any") continue;
        nodes[i].parentNode.removeChild(nodes[i]);
      }
    }
    upsertIcon("icon", mark, "image/png", null);
    var icoLink = document.querySelector('link[rel="icon"][sizes="any"]');
    if (!icoLink) {
      icoLink = document.createElement("link");
      icoLink.rel = "icon";
      icoLink.setAttribute("sizes", "any");
      document.head.appendChild(icoLink);
    }
    icoLink.href = icoHref;
    upsertIcon("shortcut icon", mark, "image/png", null);
    upsertIcon("apple-touch-icon", mark, null, null);
    /* Force header brand mark off any BMC cup */
    qsa("img.logo-mark").forEach(function (img) {
      img.src = mark;
      img.removeAttribute("srcset");
    });
  }

  function makeShowQrButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-ghost";
    btn.textContent = t("support.showQr", "Show QR");
    btn.setAttribute("aria-haspopup", "dialog");
    btn.addEventListener("click", function () {
      openSupportModal(btn);
    });
    return btn;
  }

  function fillSupportSlot(slot, kind) {
    if (!slot) return;
    if (!hasSupportLinks()) {
      slot.innerHTML = "";
      slot.classList.add("is-empty");
      slot.hidden = true;
      return;
    }
    slot.hidden = false;
    slot.classList.remove("is-empty");
    slot.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "support-inline";

    if (kind === "result") {
      var blurb = document.createElement("p");
      blurb.className = "support-blurb";
      blurb.textContent = t(
        "support.resultBlurb",
        "Found this useful? Help cover hosting and new tools."
      );
      wrap.appendChild(blurb);
      var row = document.createElement("div");
      row.className = "btn-row support-btn-row";
      row.appendChild(makeBmcLink());
      if (supportQrPath()) row.appendChild(makeShowQrButton());
      wrap.appendChild(row);
    } else if (kind === "footer") {
      var footBlurb = document.createElement("p");
      footBlurb.className = "support-blurb";
      footBlurb.textContent = t("support.footerBlurb", "Help cover hosting and new tools");
      wrap.appendChild(footBlurb);
      var footRow = document.createElement("div");
      footRow.className = "btn-row support-btn-row";
      footRow.appendChild(makeBmcLink());
      if (supportQrPath()) footRow.appendChild(makeShowQrButton());
      wrap.appendChild(footRow);
    } else {
      wrap.appendChild(makeBmcLink());
      if (supportQrPath()) wrap.appendChild(makeShowQrButton());
    }

    slot.appendChild(wrap);
  }

  function ensureResultSupportSlots() {
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

  function mountSupportPage() {
    var root = qs("#support-page");
    if (!root) return;
    if (!hasSupportLinks()) {
      root.innerHTML =
        '<p class="notice">Support links are not configured right now. Check back later.</p>';
      return;
    }
    var bmc = supportBmcUrl();
    var qr = supportQrPath();
    var qrBlock = "";
    if (qr) {
      qrBlock =
        '<div class="support-qr-wrap support-page-qr">' +
        '<img id="support-page-qr-img" src="' +
        qr.replace(/"/g, "") +
        '" alt="' +
        t("support.qrAlt", "Scan to support Game Day Tools") +
        '" width="220" height="220" loading="lazy" decoding="async">' +
        "</div>";
    }
    root.innerHTML =
      '<img class="support-brand-logo" src="/assets/bmc/bmc-full-logo.png" width="280" height="120" alt="Buy Me a Coffee" loading="lazy" decoding="async">' +
      qrBlock +
      '<p class="support-url-text">' +
      bmc.replace(/</g, "&lt;") +
      "</p>" +
      '<div class="btn-row" id="support-page-actions"></div>';
    var actions = qs("#support-page-actions", root);
    if (actions) {
      actions.appendChild(makeBmcLink());
      if (qr) {
        var showQr = makeShowQrButton();
        showQr.id = "support-page-show-qr";
        actions.appendChild(showQr);
      }
    }
    var pageImg = qs("#support-page-qr-img");
    if (pageImg) {
      pageImg.addEventListener("error", function () {
        var wrap = pageImg.parentNode;
        if (wrap) wrap.hidden = true;
      });
    }
    var brandLogo = qs(".support-brand-logo", root);
    if (brandLogo) {
      brandLogo.addEventListener("error", function () {
        brandLogo.hidden = true;
      });
    }
  }

  function mountSupportUI() {
    ensureBrandIcons();
    ensureFooterSupportSlot();
    ensureResultSupportSlots();
    qsa("[data-support-slot]").forEach(function (slot) {
      fillSupportSlot(slot, slot.getAttribute("data-support-slot") || "footer");
    });
    mountSupportPage();
  }

  function signupEndpoint() {
    var url = trimStr(cfg.signupUrl) || "/api/signup";
    if (
      !url ||
      url === "#" ||
      url.indexOf("TODO") !== -1 ||
      /example\.com/i.test(url)
    ) {
      return "/api/signup";
    }
    return url;
  }

  function initSignup() {
    var form = qs("#signup-form");
    if (!form) return;
    var statusEl = qs("#signup-status");
    var btn = qs('button[type="submit"]', form);

    function setStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.classList.toggle("is-error", !!isError);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailInput = qs('input[name="email"], #signup-email', form);
      var email = emailInput ? emailInput.value.trim() : "";
      var honey = qs('input[name="company"]', form);
      if (honey && honey.value) {
        setStatus("Thanks — you’re on the list.", false);
        form.reset();
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus("Enter a valid email address.", true);
        if (emailInput) emailInput.focus();
        return;
      }

      var endpoint = signupEndpoint();
      var method = String(cfg.signupMethod || "POST").toUpperCase();

      /* Legacy external Formspree/Google Form GET redirect */
      if (method === "GET" && endpoint.indexOf("/api/") !== 0) {
        var sep = endpoint.indexOf("?") >= 0 ? "&" : "?";
        location.href = endpoint + sep + "email=" + encodeURIComponent(email);
        return;
      }

      if (btn) btn.disabled = true;
      setStatus("Sending…", false);

      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          email: email,
          source: "unlockist-home"
        })
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, status: r.status, data: data || {} };
          }).catch(function () {
            return { ok: r.ok, status: r.status, data: {} };
          });
        })
        .then(function (res) {
          if (res.ok && res.data.ok !== false) {
            setStatus("Thanks — we’ll email launch reminders to that address.", false);
            form.reset();
            return;
          }
          if (res.status === 503) {
            setStatus(
              "Signup isn’t configured on this deploy yet. Email " +
                (cfg.contactEmail || "gamedaytools@gmail.com") +
                " to get reminders.",
              true
            );
            return;
          }
          setStatus(
            res.data.error || "Could not save your email. Try again later.",
            true
          );
        })
        .catch(function () {
          setStatus("Network error — try again in a moment.", true);
        })
        .finally(function () {
          if (btn) btn.disabled = false;
        });
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
