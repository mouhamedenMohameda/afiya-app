/* =====================================================================
   Afiya — helpers d'interface partagés : drawer, toast, utilitaires.
   Les éléments (overlay, drawer, toast) sont créés dynamiquement ici.
   ===================================================================== */
(function () {
  "use strict";
  window.AFIYA = window.AFIYA || {};

  /* ---- création des conteneurs ---- */
  function ensureNodes() {
    if (document.getElementById("af-overlay")) return;
    var overlay = document.createElement("div");
    overlay.id = "af-overlay"; overlay.className = "af-overlay";

    var drawer = document.createElement("aside");
    drawer.id = "af-drawer"; drawer.className = "af-drawer";
    drawer.innerHTML = '<div id="af-drawer-body"></div>';

    var toast = document.createElement("div");
    toast.id = "af-toast"; toast.className = "af-toast"; toast.hidden = true;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    document.body.appendChild(toast);

    overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });
  }

  function openDrawer(html) {
    ensureNodes();
    document.getElementById("af-drawer-body").innerHTML = html;
    var d = document.getElementById("af-drawer"), o = document.getElementById("af-overlay");
    o.classList.add("show"); d.classList.add("show");
    return d;
  }
  function closeDrawer() {
    var d = document.getElementById("af-drawer"), o = document.getElementById("af-overlay");
    if (d) d.classList.remove("show");
    if (o) o.classList.remove("show");
  }

  var toastTimer;
  function toast(msg, tone) {
    ensureNodes();
    var t = document.getElementById("af-toast");
    t.className = "af-toast" + (tone ? " " + tone : "");
    t.innerHTML = '<span class="d"></span>' + esc(msg);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
  }

  /* ---- utilitaires ---- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(function (w) { return w.indexOf(".") === -1; });
    if (!parts.length) parts = String(name || "").trim().split(/\s+/);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }

  AFIYA.ui = {
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    toast: toast,
    esc: esc,
    initials: initials
  };
})();
