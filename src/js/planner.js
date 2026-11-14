(function () {
  "use strict";
  var G = window.GTA6;
  if (!G) return;
  var cfg = G.config || {};
  var lastText = "";

  function parseHHMM(str) {
    var p = String(str || "09:00").split(":");
    return { h: Number(p[0]) || 0, m: Number(p[1]) || 0 };
  }

  function atLocalOnLaunch(tz, hhmm) {
    var launchMidnight = G.getLaunchDate(tz);
    var t = parseHHMM(hhmm);
    return new Date(launchMidnight.getTime() + (t.h * 60 + t.m) * 60 * 1000);
  }

  function build() {
    var tz = (G.qs("#planner-tz") && G.qs("#planner-tz").value) || "Asia/Kolkata";
    var workStart = (G.qs("#work-start") && G.qs("#work-start").value) || "09:00";
    var workEnd = (G.qs("#work-end") && G.qs("#work-end").value) || "18:00";
    var sleepStart = (G.qs("#sleep-start") && G.qs("#sleep-start").value) || "23:00";
    var sleepEnd = (G.qs("#sleep-end") && G.qs("#sleep-end").value) || "07:00";
    var preloaded = G.qs("#preloaded") && G.qs("#preloaded").checked;

    var unlock = G.getLaunchDate(tz);
    var events = [];

    events.push({
      when: unlock,
      label: "Assumed unlock (local midnight / config) — unconfirmed"
    });

    if (preloaded) {
      events.push({
        when: new Date(unlock.getTime() - 2 * 3600 * 1000),
        label: "Pre-load already done — verify install finished & patch queue"
      });
    } else {
      events.push({
        when: new Date(unlock.getTime() - 12 * 3600 * 1000),
        label: "Start download / leave console on strong Wi‑Fi (size unconfirmed)"
      });
    }

    events.push({
      when: atLocalOnLaunch(tz, workStart),
      label: "Work / college block starts (" + workStart + ")"
    });
    events.push({
      when: atLocalOnLaunch(tz, workEnd),
      label: "Work / college block ends (" + workEnd + ") — possible play window"
    });
    events.push({
      when: atLocalOnLaunch(tz, sleepStart),
      label: "Sleep target (" + sleepStart + ")"
    });
    events.push({
      when: atLocalOnLaunch(tz, sleepEnd),
      label: "Wake (" + sleepEnd + ") — morning session if unlocked"
    });

    events.sort(function (a, b) {
      return a.when - b.when;
    });

    var list = G.qs("#planner-timeline");
    if (list) {
      list.innerHTML = "";
      events.forEach(function (ev) {
        var li = document.createElement("li");
        li.innerHTML =
          '<span class="when">' +
          G.formatInTimezone(ev.when, tz) +
          '</span><span class="what">' +
          ev.label +
          "</span>";
        list.appendChild(li);
      });
    }

    var lines = events.map(function (ev) {
      return G.formatInTimezone(ev.when, tz) + " — " + ev.label;
    });
    lastText =
      (cfg.siteName || "UnlockIST") +
      " launch plan (" +
      tz +
      "):\n" +
      lines.join("\n");

    var pre = G.qs("#planner-copy-text");
    if (pre) pre.textContent = lastText;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var tzSel = G.qs("#planner-tz");
    if (tzSel) {
      var detected = G.detectTimezone();
      var opts = ["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York", "UTC"];
      if (opts.indexOf(detected) === -1) opts.unshift(detected);
      tzSel.innerHTML = opts
        .map(function (z) {
          return (
            '<option value="' +
            z +
            '">' +
            z +
            (z === "Asia/Kolkata" ? " (IST)" : "") +
            "</option>"
          );
        })
        .join("");
      tzSel.value = detected.indexOf("Kolkata") >= 0 || !detected ? "Asia/Kolkata" : detected;
      if (opts.indexOf(tzSel.value) === -1) tzSel.value = "Asia/Kolkata";
    }

    ["#planner-tz", "#work-start", "#work-end", "#sleep-start", "#sleep-end", "#preloaded"].forEach(
      function (sel) {
        var el = G.qs(sel);
        if (el) el.addEventListener("change", build);
        if (el) el.addEventListener("input", build);
      }
    );

    var printBtn = G.qs("#planner-print");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        window.print();
      });
    }

    build();
    G.wireShareButtons(function () {
      return { title: cfg.siteName || "UnlockIST", text: lastText, url: location.href };
    });
  });
})();
