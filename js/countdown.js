/**
 * Countdown page: timezone picker, city list, unlock converter.
 */
(function () {
  "use strict";

  var G = window.GTA6;
  if (!G) return;

  var cfg = G.config || {};

  var MAJOR_CITIES = [
    { city: "Chennai / India", tz: "Asia/Kolkata" },
    { city: "Mumbai / India", tz: "Asia/Kolkata" },
    { city: "Dubai", tz: "Asia/Dubai" },
    { city: "London", tz: "Europe/London" },
    { city: "Berlin", tz: "Europe/Berlin" },
    { city: "New York", tz: "America/New_York" },
    { city: "Chicago", tz: "America/Chicago" },
    { city: "Los Angeles", tz: "America/Los_Angeles" },
    { city: "São Paulo", tz: "America/Sao_Paulo" },
    { city: "Tokyo", tz: "Asia/Tokyo" },
    { city: "Sydney", tz: "Australia/Sydney" },
    { city: "Auckland", tz: "Pacific/Auckland" }
  ];

  /* Common IANA zones for the dropdown */
  var TZ_OPTIONS = [
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Sao_Paulo",
    "UTC"
  ];

  var selectedTz = G.detectTimezone();
  var timerId = null;

  function fillTimezoneSelect(select) {
    var detected = G.detectTimezone();
    var set = {};
    TZ_OPTIONS.forEach(function (z) {
      set[z] = true;
    });
    if (detected) set[detected] = true;
    if (cfg.defaultTimezone) set[cfg.defaultTimezone] = true;

    var zones = Object.keys(set).sort();
    select.innerHTML = "";
    zones.forEach(function (z) {
      var opt = document.createElement("option");
      opt.value = z;
      opt.textContent = z + (z === detected ? " (detected)" : z === "Asia/Kolkata" ? " (IST)" : "");
      select.appendChild(opt);
    });

    if (set[detected]) selectedTz = detected;
    else if (set[cfg.defaultTimezone]) selectedTz = cfg.defaultTimezone;
    else selectedTz = "Asia/Kolkata";
    select.value = selectedTz;
  }

  function updateNotice() {
    var notice = G.qs("#unlock-notice");
    if (!notice) return;
    if (cfg.showUnlockUnconfirmedNotice === false) {
      notice.hidden = true;
    } else {
      notice.hidden = false;
    }
  }

  function updateModeLabel() {
    var el = G.qs("#unlock-mode-label");
    if (!el) return;
    if (cfg.unlockMode === "fixed-utc") {
      el.textContent = "Mode: fixed UTC instant (" + (cfg.launchDateUtc || "see config") + ").";
    } else {
      el.textContent =
        "Mode: local midnight on " +
        (cfg.launchDate || "2026-11-19") +
        " in the selected timezone (default assumption until Rockstar confirms a clock time).";
    }
  }

  function tick() {
    var launch = G.getLaunchDate(selectedTz);
    var parts = G.diffParts(launch, new Date());
    G.renderCountdown(G.qs("#page-countdown"), parts);

    var localEl = G.qs("#converted-time");
    if (localEl) {
      if (parts.released) {
        localEl.textContent = "Launch date reached for this calculation — enjoy the game if it's unlocked in your region.";
      } else {
        localEl.textContent = G.formatInTimezone(launch, selectedTz);
      }
    }

    var status = G.qs("#countdown-status");
    if (status) {
      status.textContent = parts.released
        ? "Status: It's out! (based on current config assumptions)"
        : "Status: counting down";
    }
  }

  function renderCityList() {
    var list = G.qs("#city-times");
    if (!list) return;
    list.innerHTML = "";
    MAJOR_CITIES.forEach(function (row) {
      var launch = G.getLaunchDate(row.tz);
      var li = document.createElement("li");
      var timeStr = G.formatInTimezone(launch, row.tz);
      li.innerHTML =
        '<span class="city">' +
        row.city +
        '</span><span class="time">' +
        timeStr +
        "</span>";
      list.appendChild(li);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateNotice();
    updateModeLabel();

    var select = G.qs("#timezone-select");
    if (select) {
      fillTimezoneSelect(select);
      select.addEventListener("change", function () {
        selectedTz = select.value;
        tick();
        renderCityList();
      });
    }

    tick();
    renderCityList();
    timerId = setInterval(tick, 1000);
  });

  /* Expose for tests */
  window.GTA6_COUNTDOWN = {
    getSelectedTz: function () {
      return selectedTz;
    },
    setTz: function (tz) {
      selectedTz = tz;
      tick();
    },
    MAJOR_CITIES: MAJOR_CITIES
  };
})();
