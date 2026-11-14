(function () {
  "use strict";
  var G = window.GTA6;
  if (!G) return;
  var cfg = G.config || {};

  var MAJOR_CITIES = [
    { city: "Chennai", tz: "Asia/Kolkata" },
    { city: "Mumbai", tz: "Asia/Kolkata" },
    { city: "Delhi", tz: "Asia/Kolkata" },
    { city: "Bengaluru", tz: "Asia/Kolkata" },
    { city: "Dubai", tz: "Asia/Dubai" },
    { city: "London", tz: "Europe/London" },
    { city: "New York", tz: "America/New_York" },
    { city: "Los Angeles", tz: "America/Los_Angeles" },
    { city: "São Paulo", tz: "America/Sao_Paulo" },
    { city: "Tokyo", tz: "Asia/Tokyo" },
    { city: "Sydney", tz: "Australia/Sydney" },
    { city: "Auckland", tz: "Pacific/Auckland" }
  ];

  var TZ_OPTIONS = [
    "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
    "Australia/Sydney", "Pacific/Auckland", "Europe/London", "Europe/Berlin",
    "America/New_York", "America/Chicago", "America/Los_Angeles",
    "America/Sao_Paulo", "UTC"
  ];

  var selectedTz = "Asia/Kolkata";

  function fillSelect(select) {
    var detected = G.detectTimezone();
    var set = {};
    TZ_OPTIONS.forEach(function (z) { set[z] = true; });
    if (detected) set[detected] = true;
    if (cfg.defaultTimezone) set[cfg.defaultTimezone] = true;
    var zones = Object.keys(set).sort();
    select.innerHTML = "";
    zones.forEach(function (z) {
      var opt = document.createElement("option");
      opt.value = z;
      opt.textContent =
        z +
        (z === "Asia/Kolkata" ? " (IST)" : "") +
        (z === detected ? " — detected" : "");
      select.appendChild(opt);
    });
    selectedTz = set[detected] ? detected : cfg.defaultTimezone || "Asia/Kolkata";
    select.value = selectedTz;
  }

  function sharePayload() {
    var launch = G.getLaunchDate(selectedTz);
    var parts = G.diffParts(launch, new Date());
    var text;
    if (parts.released) {
      text = (cfg.siteName || "UnlockIST") + ": GTA 6 launch date reached (" + selectedTz + ").";
    } else {
      text =
        (cfg.siteName || "UnlockIST") +
        " countdown: " +
        parts.days +
        "d " +
        parts.hours +
        "h " +
        parts.minutes +
        "m left. Assumed unlock in " +
        selectedTz +
        ": " +
        G.formatInTimezone(launch, selectedTz) +
        " (unconfirmed).";
    }
    return { title: cfg.siteName || "UnlockIST", text: text, url: location.href };
  }

  function tick() {
    var launch = G.getLaunchDate(selectedTz);
    var parts = G.diffParts(launch, new Date());
    G.renderCountdown(G.qs("#page-countdown"), parts);
    var localEl = G.qs("#converted-time");
    if (localEl) {
      localEl.textContent = parts.released
        ? "Launch date reached for this calculation — store unlock may still vary."
        : G.formatInTimezone(launch, selectedTz);
    }
    var status = G.qs("#countdown-status");
    if (status) {
      status.textContent = parts.released
        ? "Status: " + G.t("countdown.released", "It's out!")
        : "Status: " + G.t("countdown.counting", "Counting down");
    }
  }

  function renderCities() {
    var list = G.qs("#city-times");
    if (!list) return;
    list.innerHTML = "";
    MAJOR_CITIES.forEach(function (row) {
      var launch = G.getLaunchDate(row.tz);
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="city">' +
        row.city +
        ' <span class="muted" style="font-weight:400">(' +
        row.tz +
        ')</span></span><span class="time">' +
        G.formatInTimezone(launch, row.tz) +
        "</span>";
      list.appendChild(li);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var notice = G.qs("#unlock-notice");
    if (notice && cfg.showUnlockUnconfirmedNotice === false) notice.hidden = true;

    var modeEl = G.qs("#unlock-mode-label");
    if (modeEl) {
      modeEl.textContent =
        cfg.unlockMode === "fixed-utc"
          ? "Using one shared unlock moment worldwide (until stores say otherwise)."
          : "Using local midnight on " +
            (cfg.launchDate || "2026-11-19") +
            " in your selected timezone as a planning assumption until Rockstar confirms.";
    }

    var select = G.qs("#timezone-select");
    if (select) {
      fillSelect(select);
      select.addEventListener("change", function () {
        selectedTz = select.value;
        tick();
        renderCities();
      });
    }
    tick();
    renderCities();
    setInterval(tick, 1000);
    G.wireShareButtons(sharePayload);
  });
})();
