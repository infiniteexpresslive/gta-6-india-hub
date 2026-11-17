(function () {
  "use strict";
  var G = window.GTA6;
  if (!G) return;
  var cfg = G.config || {};
  var items = [];
  var lastText = "";

  function render(data) {
    items = data.items || [];
    var root = G.qs("#cost-list");
    if (!root) return;
    root.innerHTML = "";
    items.forEach(function (item) {
      var li = document.createElement("li");
      var id = "cost-" + item.id;
      var badge = item.unconfirmed
        ? ' <span class="badge">' + G.t("badge.unconfirmed", "unconfirmed") + "</span>"
        : "";
      li.innerHTML =
        '<input type="checkbox" id="' +
        id +
        '" data-id="' +
        item.id +
        '" ' +
        (item.defaultChecked ? "checked" : "") +
        ">" +
        '<label for="' +
        id +
        '">' +
        item.label +
        badge +
        "</label>" +
        '<span class="amount">' +
        G.formatInr(item.amountInr) +
        "</span>";
      root.appendChild(li);
    });
    G.qsa("#cost-list input").forEach(function (inp) {
      inp.addEventListener("change", updateTotal);
    });
    var tips = G.qs("#cost-tips");
    if (tips && data.tips) {
      tips.innerHTML = data.tips
        .map(function (t) {
          return "<li>" + t + "</li>";
        })
        .join("");
    }
    updateTotal();
  }

  function selected() {
    var ids = {};
    G.qsa("#cost-list input:checked").forEach(function (inp) {
      ids[inp.getAttribute("data-id")] = true;
    });
    return items.filter(function (it) {
      return ids[it.id];
    });
  }

  function updateTotal() {
    var sel = selected();
    var total = sel.reduce(function (sum, it) {
      return sum + (Number(it.amountInr) || 0);
    }, 0);
    var el = G.qs("#cost-total");
    if (el) el.textContent = G.formatInr(total);

    var tipEl = G.qs("#cheapest-tip");
    if (tipEl) {
      var gameItems = items.filter(function (i) {
        return i.group === "game";
      });
      var cheapestGame = gameItems.slice().sort(function (a, b) {
        return a.amountInr - b.amountInr;
      })[0];
      tipEl.textContent = cheapestGame
        ? "Cheapest listed game line item: " +
          cheapestGame.label +
          " (" +
          G.formatInr(cheapestGame.amountInr) +
          ") — still unconfirmed."
        : "";
    }

    lastText =
      (cfg.siteName || "UnlockIST") +
      " launch cost estimate: " +
      G.formatInr(total) +
      " for " +
      sel.length +
      " items (placeholder ₹ — verify stores).";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var aff = G.qs("#affiliate-game");
    if (aff && cfg.affiliateLinks) {
      aff.href = cfg.affiliateLinks.game || cfg.affiliateLinks.standard || "#";
      aff.setAttribute("rel", "sponsored noopener");
      aff.setAttribute("target", "_blank");
    }
    fetch("/data/prices.json")
      .then(function (r) {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then(render)
      .catch(function () {
        var root = G.qs("#cost-list");
        if (root) {
          root.innerHTML =
            "<li>Could not load price list. Please refresh or try again later.</li>";
        }
      });
    G.wireShareButtons(function () {
      return { title: cfg.siteName || "UnlockIST", text: lastText, url: location.href };
    });
  });
})();
