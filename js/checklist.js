/**
 * Launch checklist — persists checkbox state in localStorage.
 */
(function () {
  "use strict";

  var G = window.GTA6;
  if (!G) return;

  var STORAGE_KEY = "gta6hub_checklist_v1";

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* private mode / quota — ignore */
    }
  }

  function updateProgress(total, checked) {
    var bar = G.qs("#checklist-progress");
    var label = G.qs("#checklist-progress-label");
    var pct = total ? Math.round((checked / total) * 100) : 0;
    if (bar) {
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(pct));
    }
    if (label) {
      label.textContent = checked + " of " + total + " done (" + pct + "%)";
    }
  }

  function render(data) {
    var root = G.qs("#checklist-root");
    if (!root || !data || !data.categories) return;

    var state = loadState();
    root.innerHTML = "";
    var total = 0;
    var checked = 0;

    data.categories.forEach(function (cat) {
      var h = document.createElement("h3");
      h.className = "checklist-cat";
      h.textContent = cat.title;
      root.appendChild(h);

      var ul = document.createElement("ul");
      ul.className = "checklist";

      (cat.items || []).forEach(function (item) {
        total += 1;
        var li = document.createElement("li");
        li.className = "checklist-item";
        var id = "chk-" + item.id;
        var isOn = !!state[item.id];
        if (isOn) {
          checked += 1;
          li.classList.add("is-done");
        }

        li.innerHTML =
          '<input type="checkbox" id="' +
          id +
          '" ' +
          (isOn ? "checked" : "") +
          ">" +
          '<label class="checklist-text" for="' +
          id +
          '">' +
          item.label +
          "</label>";

        var input = li.querySelector("input");
        input.addEventListener("change", function () {
          var s = loadState();
          s[item.id] = input.checked;
          saveState(s);
          li.classList.toggle("is-done", input.checked);
          var all = G.qsa("#checklist-root input[type=checkbox]");
          var c = all.filter(function (el) {
            return el.checked;
          }).length;
          updateProgress(all.length, c);
        });

        ul.appendChild(li);
      });

      root.appendChild(ul);
    });

    updateProgress(total, checked);
  }

  function reset() {
    saveState({});
    G.qsa("#checklist-root input[type=checkbox]").forEach(function (el) {
      el.checked = false;
      el.closest(".checklist-item").classList.remove("is-done");
    });
    var all = G.qsa("#checklist-root input[type=checkbox]");
    updateProgress(all.length, 0);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var resetBtn = G.qs("#checklist-reset");
    if (resetBtn) resetBtn.addEventListener("click", reset);

    fetch("data/checklist.json")
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to load checklist");
        return r.json();
      })
      .then(render)
      .catch(function () {
        var root = G.qs("#checklist-root");
        if (root) {
          root.innerHTML =
            '<p class="notice">Could not load <code>data/checklist.json</code>. Serve the folder over HTTP (not file://) so fetch works.</p>';
        }
      });
  });
})();
