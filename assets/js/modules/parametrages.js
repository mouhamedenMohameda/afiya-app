/* =====================================================================
   Afiya — Module « Paramétrages » : identité de l'établissement (lecture)
   + préférences interactives (langue, thème, couleur d'accent).
   Le white-label complet se fait dans config.js ; ici on ajuste en direct.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function cfgTf(o) { return o ? tf(o.fr, o.ar) : "—"; }

  var ACCENTS = [
    { name: { fr: "Émeraude", ar: "زمردي" }, c: "#0E9F6E" },
    { name: { fr: "Bleu", ar: "أزرق" },     c: "#2563A8" },
    { name: { fr: "Sarcelle", ar: "فيروزي" }, c: "#0E8A8A" },
    { name: { fr: "Violet", ar: "بنفسجي" }, c: "#7A3EA1" },
    { name: { fr: "Ambre", ar: "كهرماني" }, c: "#C77D0A" },
    { name: { fr: "Rouge", ar: "أحمر" },     c: "#C0392B" }
  ];

  function applyAccent(c) {
    var s = document.documentElement.style;
    s.setProperty("--brand", c);
    s.setProperty("--brand-strong", "color-mix(in srgb, " + c + " 82%, black)");
    s.setProperty("--brand-soft", "color-mix(in srgb, " + c + " 14%, white)");
    s.setProperty("--side-active-1", c);
    s.setProperty("--side-active-2", "color-mix(in srgb, " + c + " 80%, black)");
    try { localStorage.setItem("afiya.accent", c); } catch (e) {}
  }
  function applyTheme(mode) {
    var root = document.documentElement;
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    try { localStorage.setItem("afiya.theme", mode); } catch (e) {}
  }
  function currentTheme() { return document.documentElement.getAttribute("data-theme") || "auto"; }
  function currentAccent() {
    var v = "";
    try { v = localStorage.getItem("afiya.accent") || ""; } catch (e) {}
    return v || (A.config && A.config.couleur) || "#0E9F6E";
  }

  function panel(titleFr, titleAr, bodyHtml) {
    return '<div class="dpanel set-panel"><h3>' + tf(titleFr, titleAr) + "</h3>" + bodyHtml + "</div>";
  }
  function infoRow(label, val) {
    return '<div class="set-row"><span class="set-l">' + esc(label) + '</span><span class="set-v">' + esc(val) + "</span></div>";
  }

  function render(root) {
    var cfg = A.config || {}, u = cfg.utilisateur || {};
    var html = "";
    html += '<div class="page-head"><h1 class="page-title">' + tf("Paramétrages", "الإعدادات") + "</h1>" +
      '<p class="page-sub">' + tf("Identité de l'établissement et préférences d'affichage", "هوية المؤسسة وتفضيلات العرض") + "</p></div>";

    html += '<div class="set-grid">';

    /* Établissement */
    html += panel("Établissement", "المؤسسة",
      infoRow(tf("Nom", "الاسم"), cfgTf(cfg.etablissement)) +
      infoRow(tf("Service", "القسم"), cfgTf(cfg.service)) +
      infoRow(tf("Logiciel", "البرنامج"), cfg.produit || "Afiya") +
      infoRow(tf("Slogan", "الشعار"), cfgTf(cfg.slogan)));

    /* Utilisateur */
    html += panel("Utilisateur connecté", "المستخدم المتصل",
      infoRow(tf("Nom", "الاسم"), u.nom || "—") +
      infoRow(tf("Rôle", "الدور"), cfgTf(u.role)));

    /* Langue */
    html += panel("Langue", "اللغة",
      '<div class="set-choice" id="set-lang">' +
        choiceBtn("fr", "Français", A.i18n.lang === "fr") +
        choiceBtn("ar", "العربية", A.i18n.lang === "ar") +
      "</div>");

    /* Thème */
    var th = currentTheme();
    html += panel("Thème", "المظهر",
      '<div class="set-choice" id="set-theme">' +
        choiceBtnIc("light", tf("Clair", "فاتح"), "sun", th === "light") +
        choiceBtnIc("dark", tf("Sombre", "داكن"), "moon", th === "dark") +
        choiceBtnIc("auto", tf("Auto", "تلقائي"), "refresh", th === "auto") +
      "</div>");

    /* Couleur d'accent */
    var ac = currentAccent().toLowerCase();
    html += panel("Couleur d'accent", "لون التمييز",
      '<div class="set-swatches" id="set-accent">' + ACCENTS.map(function (a) {
        var on = a.c.toLowerCase() === ac;
        return '<button class="swatch' + (on ? " on" : "") + '" data-c="' + a.c + '" title="' + esc(tf(a.name.fr, a.name.ar)) + '" style="--sw:' + a.c + '">' +
          (on ? '<span class="sw-check">' + icon("check", 14) + "</span>" : "") + "</button>";
      }).join("") + "</div>" +
      '<p class="set-note">' + tf("Pour un déploiement définitif chez un client, modifiez config.js (nom, service, couleur, langue).",
                                  "للنشر النهائي لدى عميل، عدّل ملف config.js (الاسم، القسم، اللون، اللغة).") + "</p>");

    html += "</div>";
    root.innerHTML = html;

    /* langue */
    root.querySelectorAll("#set-lang [data-v]").forEach(function (b) {
      b.addEventListener("click", function () { A.i18n.setLang(b.getAttribute("data-v")); });
    });
    /* thème */
    root.querySelectorAll("#set-theme [data-v]").forEach(function (b) {
      b.addEventListener("click", function () { applyTheme(b.getAttribute("data-v")); render(root); });
    });
    /* accent */
    root.querySelectorAll("#set-accent .swatch").forEach(function (b) {
      b.addEventListener("click", function () { applyAccent(b.getAttribute("data-c")); render(root); A.ui.toast(tf("Couleur appliquée", "تم تطبيق اللون")); });
    });
  }

  function choiceBtn(v, label, on) {
    return '<button class="set-opt' + (on ? " on" : "") + '" data-v="' + v + '">' + esc(label) + "</button>";
  }
  function choiceBtnIc(v, label, ic, on) {
    return '<button class="set-opt' + (on ? " on" : "") + '" data-v="' + v + '">' + icon(ic, 16) + esc(label) + "</button>";
  }

  /* exposé pour le bootstrap (app.js applique thème/accent au démarrage) */
  A.applyStoredPrefs = function () {
    var t, c;
    try { t = localStorage.getItem("afiya.theme"); c = localStorage.getItem("afiya.accent"); } catch (e) {}
    if (t) applyTheme(t);
    if (c) applyAccent(c);
  };

  A.modules.parametrages = { render: render };
})();
