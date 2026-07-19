/* =====================================================================
   Afiya — bootstrap : rendu de la sidebar, routeur, drawer mobile,
   bascule de langue. Les pages sont pour l'instant des placeholders.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  var i18n = A.i18n, icon = A.icon, tf = A.i18n.tf.bind(A.i18n);

  var el = {
    sidebar: document.getElementById("sidebar"),
    scrim: document.getElementById("scrim"),
    nav: document.getElementById("nav"),
    content: document.getElementById("content"),
    hamburger: document.getElementById("hamburger"),
    sidebarClose: document.getElementById("sidebar-close"),
    langSwitch: document.getElementById("lang-switch")
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- rendu de la barre de navigation ---------- */
  function renderNav() {
    var html = "";
    A.nav.forEach(function (section) {
      html += '<div class="nav-section">';
      html += '<div class="nav-section-title">' + esc(tf(section.title.fr, section.title.ar)) + "</div>";
      section.items.forEach(function (item) {
        var label = esc(tf(item.fr, item.ar));
        if (item.children) {
          html += '<button class="nav-item" data-toggle="' + item.id + '" aria-expanded="false">' +
            '<span class="ni-icon">' + icon(item.icon, 20) + "</span>" +
            '<span class="ni-label">' + label + "</span>" +
            '<span class="ni-chevron">' + icon("chevron", 18) + "</span>" +
            "</button>";
          html += '<div class="nav-children" id="children-' + item.id + '">';
          item.children.forEach(function (c) {
            html += '<button class="nav-subitem" data-route="' + c.route + '">' +
              "<span>" + esc(tf(c.fr, c.ar)) + "</span></button>";
          });
          html += "</div>";
        } else {
          var extra = "";
          if (item.badge != null) extra += '<span class="ni-badge">' + item.badge + "</span>";
          if (item.quickAdd) extra += '<span class="ni-plus" role="button" data-add="' + item.route + '" aria-label="Ajouter">' + icon("plus", 15) + "</span>";
          html += '<button class="nav-item" data-route="' + item.route + '">' +
            '<span class="ni-icon">' + icon(item.icon, 20) + "</span>" +
            '<span class="ni-label">' + label + "</span>" +
            extra + "</button>";
        }
      });
      html += "</div>";
    });
    el.nav.innerHTML = html;

    /* navigation directe */
    el.nav.querySelectorAll("[data-route]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (e.target.closest("[data-add]")) return; // le + est géré séparément
        go(btn.getAttribute("data-route"));
      });
    });
    /* quick-add (ne fait que naviguer pour l'instant) */
    el.nav.querySelectorAll("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        go(btn.getAttribute("data-add"));
      });
    });
    /* menus repliables */
    el.nav.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-toggle");
        var box = document.getElementById("children-" + id);
        var open = box.classList.toggle("open");
        btn.classList.toggle("expanded", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* ---------- surlignage de l'item actif ---------- */
  function setActive(route) {
    el.nav.querySelectorAll(".nav-item,.nav-subitem").forEach(function (b) {
      b.classList.remove("active");
    });
    var active = el.nav.querySelector('[data-route="' + route + '"]');
    if (active) {
      active.classList.add("active");
      // ouvrir le parent repliable si l'item est un enfant
      var childrenBox = active.closest(".nav-children");
      if (childrenBox) {
        childrenBox.classList.add("open");
        var toggle = childrenBox.previousElementSibling;
        if (toggle && toggle.hasAttribute("data-toggle")) {
          toggle.classList.add("expanded");
          toggle.setAttribute("aria-expanded", "true");
        }
      }
    }
  }

  /* ---------- pages placeholder ---------- */
  function renderPage(route) {
    var item = A.routeIndex[route];
    if (!item) { route = A.defaultRoute; item = A.routeIndex[route]; }
    var mod = (A.modules || {})[route];

    if (mod) {
      /* module réel : il gère son propre rendu dans un conteneur dédié */
      el.content.innerHTML = '<div class="content-inner" id="module-root"></div>';
      mod.render(document.getElementById("module-root"), item);
    } else {
      /* page « en construction » par défaut */
      var title = esc(tf(item.fr, item.ar));
      el.content.innerHTML =
        '<div class="content-inner">' +
          '<div class="page-head">' +
            '<h1 class="page-title">' + title + "</h1>" +
            '<p class="page-sub">' + esc(i18n.t("pageSubPrefix")) + " — Afiya</p>" +
          "</div>" +
          '<div class="placeholder">' +
            '<div class="ph-icon">' + icon(item.icon, 32) + "</div>" +
            '<div class="ph-title">' + title + "</div>" +
            '<div class="ph-tag">' + esc(i18n.t("buildTag")) + "</div>" +
            '<p class="ph-desc">' + esc(i18n.t("buildDesc")) + "</p>" +
          "</div>" +
        "</div>";
    }

    setActive(route);
    el.content.focus({ preventScroll: true });
    document.title = tf(item.fr, item.ar) + " · Afiya";
  }

  /* ---------- routeur (hash) ---------- */
  function currentRoute() {
    return (location.hash || "").replace(/^#\/?/, "") || A.defaultRoute;
  }
  function go(route) {
    if (currentRoute() === route) { renderPage(route); closeDrawer(); return; }
    location.hash = "#/" + route;
    closeDrawer();
  }
  function onRoute() { renderPage(currentRoute()); }

  /* ---------- drawer mobile ---------- */
  function openDrawer() {
    el.sidebar.classList.add("open");
    el.scrim.hidden = false;
    requestAnimationFrame(function () { el.scrim.classList.add("show"); });
  }
  function closeDrawer() {
    el.sidebar.classList.remove("open");
    el.scrim.classList.remove("show");
    setTimeout(function () { el.scrim.hidden = true; }, 260);
  }

  /* ---------- personnalisation (marque + établissement) ---------- */
  function setTxt(id, v) { var n = document.getElementById(id); if (n) n.textContent = v; }
  function cfgTf(o) { return o ? tf(o.fr, o.ar) : ""; }

  function applyBrand() {
    var cfg = A.config || {};
    var brand = document.querySelector(".brand-name");
    if (brand) brand.textContent = cfg.produit || "Afiya";
    setTxt("brand-tag", cfgTf(cfg.slogan));
    setTxt("context-service", cfgTf(cfg.etablissement));   /* nom de l'établissement en grand */
    setTxt("context-role", cfgTf(cfg.service));            /* service en sous-titre */
    var u = cfg.utilisateur || {};
    setTxt("user-name", u.nom || "");
    setTxt("user-role", cfgTf(u.role));
    var ini = A.ui.initials(u.nom || "");
    setTxt("user-av", ini);
    setTxt("avatar-top", ini);
    document.title = cfgTf(cfg.etablissement) || (cfg.produit || "Afiya");
    el.langSwitch.querySelectorAll(".lang-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === i18n.lang);
    });
  }

  /* couleur d'accent personnalisée (appliquée une seule fois) */
  function applyAccent() {
    var c = A.config && A.config.couleur;
    if (!c) return;
    var s = document.documentElement.style;
    s.setProperty("--brand", c);
    s.setProperty("--brand-strong", "color-mix(in srgb, " + c + " 82%, black)");
    s.setProperty("--brand-soft", "color-mix(in srgb, " + c + " 14%, white)");
    s.setProperty("--side-active-1", c);
    s.setProperty("--side-active-2", "color-mix(in srgb, " + c + " 80%, black)");
  }

  /* recharge tout lors d'un changement de langue */
  A.onLangChange = function () {
    applyBrand();
    renderNav();
    renderPage(currentRoute());
  };

  /* ---------- init ---------- */
  function init() {
    i18n.apply();
    applyAccent();
    applyBrand();
    renderNav();

    el.hamburger.addEventListener("click", openDrawer);
    el.sidebarClose.addEventListener("click", closeDrawer);
    el.scrim.addEventListener("click", closeDrawer);
    el.langSwitch.querySelectorAll(".lang-btn").forEach(function (b) {
      b.addEventListener("click", function () { i18n.setLang(b.getAttribute("data-lang")); });
    });
    window.addEventListener("hashchange", onRoute);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

    if (!location.hash) location.replace("#/" + A.defaultRoute);
    onRoute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
