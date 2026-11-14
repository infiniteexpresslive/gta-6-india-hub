(function () {
  "use strict";
  var G = window.GTA6;
  if (!G) return;
  var cfg = G.config || {};
  var lastText = "";

  function calc() {
    var speed = Number(G.qs("#speed-mbps").value);
    var gb = Number(G.qs("#size-gb").value);
    var eff = Number(G.qs("#efficiency").value) / 100;
    if (!isFinite(speed) || speed <= 0) speed = cfg.defaultSpeedMbps || 50;
    if (!isFinite(gb) || gb <= 0) gb = cfg.defaultInstallSizeGb || 150;
    if (!isFinite(eff) || eff <= 0 || eff > 1) eff = cfg.defaultDownloadEfficiency || 0.8;

    var bits = gb * 8 * 1e9;
    var effectiveMbps = speed * eff;
    var seconds = bits / (effectiveMbps * 1e6);
    var dataGb = gb; /* download payload ≈ install size for planning */

    var timeStr = G.formatDuration(seconds);
    var out = G.qs("#download-result");
    if (out) {
      out.innerHTML =
        '<p class="muted mb-0">Estimated download time</p>' +
        '<p class="big">' +
        timeStr +
        "</p>" +
        "<p>At <strong>" +
        speed +
        " Mbps</strong> with <strong>" +
        Math.round(eff * 100) +
        "%</strong> efficiency → effective <strong>" +
        (Math.round(effectiveMbps * 10) / 10) +
        " Mbps</strong>.</p>" +
        "<p>Data usage ≈ <strong>" +
        gb +
        " GB</strong> <span class=\"badge\">" +
        G.t("badge.unconfirmed", "unconfirmed") +
        "</span> install size assumption.</p>" +
        '<p class="help-text">Limited prepaid plans: one large download can exhaust a monthly data cap. Prefer unlimited Wi‑Fi overnight.</p>';
    }

    lastText =
      (cfg.siteName || "UnlockIST") +
      " download estimate: ~" +
      timeStr +
      " for " +
      gb +
      " GB at " +
      speed +
      " Mbps (" +
      Math.round(eff * 100) +
      "% efficiency). Size unconfirmed.";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var speed = G.qs("#speed-mbps");
    var size = G.qs("#size-gb");
    var eff = G.qs("#efficiency");
    if (speed && !speed.value) speed.value = String(cfg.defaultSpeedMbps || 50);
    if (size && !size.value) size.value = String(cfg.defaultInstallSizeGb || 150);
    if (eff && !eff.value) eff.value = String(Math.round((cfg.defaultDownloadEfficiency || 0.8) * 100));

    ["#speed-mbps", "#size-gb", "#efficiency"].forEach(function (sel) {
      var el = G.qs(sel);
      if (el) el.addEventListener("input", calc);
    });
    var btn = G.qs("#calc-download");
    if (btn) btn.addEventListener("click", calc);
    calc();
    G.wireShareButtons(function () {
      return { title: cfg.siteName || "UnlockIST", text: lastText, url: location.href };
    });
  });
})();
