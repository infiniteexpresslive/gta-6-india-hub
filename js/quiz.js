(function () {
  "use strict";
  var G = window.GTA6;
  if (!G) return;
  var cfg = G.config || {};
  var lastText = "";

  function renderQuestions(data) {
    var form = G.qs("#quiz-form");
    if (!form) return;
    form.innerHTML = "";
    (data.questions || []).forEach(function (q, index) {
      var fieldset = document.createElement("fieldset");
      fieldset.className = "quiz-q card";
      var legend = document.createElement("legend");
      legend.innerHTML = "<strong>Q" + (index + 1) + ".</strong> " + q.text;
      fieldset.appendChild(legend);
      var wrap = document.createElement("div");
      wrap.className = "quiz-options";
      (q.options || []).forEach(function (opt) {
        var label = document.createElement("label");
        label.className = "quiz-option";
        label.innerHTML =
          '<input type="radio" name="' +
          q.id +
          '" value="' +
          opt.id +
          '" required> <span>' +
          opt.label +
          "</span>";
        wrap.appendChild(label);
      });
      fieldset.appendChild(wrap);
      form.appendChild(fieldset);
    });
    var actions = document.createElement("div");
    actions.className = "btn-row";
    actions.innerHTML =
      '<button class="btn btn-primary" type="submit">See recommendation</button>' +
      '<button class="btn btn-ghost" type="reset">Reset</button>';
    form.appendChild(actions);
  }

  function scoreAnswers(data, form) {
    var scores = {};
    Object.keys(data.editions || {}).forEach(function (k) {
      scores[k] = 0;
    });
    (data.questions || []).forEach(function (q) {
      var checked = form.querySelector('input[name="' + q.id + '"]:checked');
      if (!checked) return;
      var opt = (q.options || []).filter(function (o) {
        return o.id === checked.value;
      })[0];
      if (!opt || !opt.scores) return;
      Object.keys(opt.scores).forEach(function (editionId) {
        scores[editionId] = (scores[editionId] || 0) + opt.scores[editionId];
      });
    });
    var bestId = null;
    var bestScore = -1;
    Object.keys(scores).forEach(function (id) {
      if (scores[id] > bestScore) {
        bestScore = scores[id];
        bestId = id;
      }
    });
    return bestId;
  }

  function showResult(data, bestId) {
    var panel = G.qs("#quiz-result");
    if (!panel) return;
    var edition = (data.editions || {})[bestId];
    if (!edition) return;
    var url =
      (cfg.affiliateLinks && cfg.affiliateLinks[edition.affiliateKey || bestId]) ||
      (cfg.affiliateLinks && cfg.affiliateLinks.standard) ||
      "#";
    var badge = edition.unconfirmed
      ? '<span class="badge">' + G.t("badge.unconfirmed", "unconfirmed") + "</span>"
      : "";
    panel.innerHTML =
      '<div class="card"><h3>Suggested: ' +
      edition.name +
      " " +
      badge +
      "</h3><p>" +
      edition.summary +
      "</p><p><strong>Price:</strong> " +
      (edition.priceHint || "TODO: verify") +
      '</p><div class="btn-row">' +
      '<a class="btn btn-primary" href="' +
      url +
      '" rel="sponsored noopener" target="_blank">Check price</a>' +
      '<button type="button" class="btn btn-ghost" data-share>Share result</button>' +
      '<button type="button" class="btn btn-secondary" data-copy>Copy</button>' +
      '</div><p class="disclosure" data-i18n="affiliate.disclosure">' +
      G.t("affiliate.disclosure") +
      '</p><p class="share-status" id="share-status" aria-live="polite"></p></div>';
    panel.classList.add("is-visible");
    lastText =
      (cfg.siteName || "UnlockIST") +
      " edition quiz: " +
      edition.name +
      " (" +
      (edition.priceHint || "price TODO") +
      "). Unconfirmed — verify official stores.";
    G.wireShareButtons(function () {
      return { title: cfg.siteName || "UnlockIST", text: lastText, url: location.href };
    });
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch("data/editions.json")
      .then(function (r) {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then(function (data) {
        renderQuestions(data);
        var form = G.qs("#quiz-form");
        if (!form) return;
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          showResult(data, scoreAnswers(data, form));
        });
        form.addEventListener("reset", function () {
          var panel = G.qs("#quiz-result");
          if (panel) {
            panel.classList.remove("is-visible");
            panel.innerHTML = "";
          }
          lastText = "";
        });
      })
      .catch(function () {
        var form = G.qs("#quiz-form");
        if (form) {
          form.innerHTML = '<p class="notice">Could not load data/editions.json. Serve over HTTP.</p>';
        }
      });
  });
})();
