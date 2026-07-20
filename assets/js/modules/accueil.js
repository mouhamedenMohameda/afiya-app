/* =====================================================================
   Afiya — Module « Accueil » : page d'atterrissage.
   Synthèse du service + actions rapides + accès aux cas prioritaires.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function svc() { var s = (A.config && A.config.service) || { fr: "", ar: "" }; return tf(s.fr, s.ar); }
  function bedOf(pid) { for (var i = 0; i < D.beds.length; i++) if (D.beds[i].patientId === pid) return D.beds[i]; return null; }

  function frDate(d) {
    var days = { fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"], ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] };
    var mon = { fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
                ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"] };
    var dt = new Date(d + "T00:00:00"), L = A.i18n.lang;
    return days[L][dt.getDay()] + " " + dt.getDate() + " " + mon[L][dt.getMonth()] + " " + dt.getFullYear();
  }

  function render(root) {
    var c = D.counts(), em = D.emCounts();
    var u = (A.config.utilisateur && A.config.utilisateur.nom) || "";
    var hour = 10; /* démo */
    var greet = hour < 18 ? tf("Bonjour", "صباح الخير") : tf("Bonsoir", "مساء الخير");

    var html = "";
    html += '<div class="page-head"><h1 class="page-title">' + esc(greet) + ", " + esc(u) + "</h1>" +
      '<p class="page-sub">' + esc(frDate(D.today)) + " · " + esc(svc()) + "</p></div>";

    /* KPI */
    html += '<div class="dash-kpis">' +
      '<div class="dkpi"><div class="k-ic">' + icon("hospitalises", 18) + '</div><div class="k-val">' + c.occ + '</div><div class="k-lbl">' + tf("Patients hospitalisés", "المرضى المقيمون") + '</div></div>' +
      '<div class="dkpi"><div class="k-ic info">' + icon("plus", 18) + '</div><div class="k-val">' + c.free + '</div><div class="k-lbl">' + tf("Lits disponibles", "أسرّة متاحة") + '</div></div>' +
      '<div class="dkpi"><div class="k-ic bad">' + icon("urgences", 18) + '</div><div class="k-val">' + c.critique + '</div><div class="k-lbl">' + tf("Cas critiques", "حالات حرجة") + '</div></div>' +
      '<div class="dkpi"><div class="k-ic warn">' + icon("clock", 18) + '</div><div class="k-val">' + em.attente + '</div><div class="k-lbl">' + tf("Urgences en attente", "طوارئ في الانتظار") + '</div></div>' +
    "</div>";

    /* actions rapides */
    html += '<div class="section-title">' + tf("Actions rapides", "إجراءات سريعة") + "</div>";
    html += '<div class="q-actions">' +
      '<button class="q-card" data-go="hospitalises">' + '<span class="q-ic">' + icon("hospitalises", 20) + '</span><span class="q-txt"><b>' + tf("Admettre un patient", "إدخال مريض") + '</b><small>' + tf("Gérer les lits", "إدارة الأسرّة") + '</small></span></button>' +
      '<button class="q-card" data-go="urgences">' + '<span class="q-ic warn">' + icon("urgences", 20) + '</span><span class="q-txt"><b>' + tf("File des urgences", "قائمة الطوارئ") + '</b><small>' + tf("Triage & orientation", "الفرز والتوجيه") + '</small></span></button>' +
      '<button class="q-card" data-go="surveillance">' + '<span class="q-ic info">' + icon("surveillance", 20) + '</span><span class="q-txt"><b>' + tf("Surveillance", "المراقبة") + '</b><small>' + tf("Constantes vitales", "العلامات الحيوية") + '</small></span></button>' +
      '<button class="q-card" data-go="dashboard">' + '<span class="q-ic">' + icon("dashboard", 20) + '</span><span class="q-txt"><b>' + tf("Tableau de bord", "لوحة التحكم") + '</b><small>' + tf("Indicateurs", "المؤشرات") + '</small></span></button>' +
    "</div>";

    /* deux colonnes : urgences en attente + cas critiques */
    html += '<div class="dash-2">';

    html += '<div class="dpanel"><h3>' + tf("Urgences en attente", "طوارئ في الانتظار") + "</h3>";
    var waiting = D.emQueue().filter(function (e) { return e.statut === "attente"; }).slice(0, 4);
    if (!waiting.length) html += '<div class="mini-empty">' + tf("Aucune urgence en attente.", "لا توجد طوارئ في الانتظار.") + "</div>";
    else waiting.forEach(function (e) {
      var m = D.triageMeta(e.triage);
      html += '<div class="rec-row static tri-' + e.triage + '" style="cursor:pointer" data-go="urgences">' +
        '<span class="rec-ic" style="background:var(--tcs);color:var(--tc)">' + e.triage + "</span>" +
        '<div class="rec-main"><div class="rec-title">' + esc(e.nom) + '</div><div class="rec-sub">' + esc(e.motif) + "</div></div>" +
        '<div class="rec-side"><span class="rec-meta">' + esc(e.arrivee) + "</span></div></div>";
    });
    html += "</div>";

    html += '<div class="dpanel"><h3>' + tf("Cas critiques", "حالات حرجة") + "</h3>";
    var crit = D.patients.filter(function (p) { return p.etat === "critique" && bedOf(p.id); }).slice(0, 4);
    if (!crit.length) html += '<div class="mini-empty">' + tf("Aucun cas critique.", "لا توجد حالات حرجة.") + "</div>";
    else crit.forEach(function (p) {
      var b = bedOf(p.id);
      html += '<div class="rec-row static" style="cursor:pointer" data-go="hospitalises">' +
        '<span class="rec-ic bad">' + esc(A.ui.initials(p.nom)) + "</span>" +
        '<div class="rec-main"><div class="rec-title">' + esc(p.nom) + '</div><div class="rec-sub">' + esc(p.motif) + "</div></div>" +
        '<div class="rec-side"><span class="rec-meta">' + tf("Salle", "غرفة") + " " + b.salle + " · " + esc(b.lit) + "</span></div></div>";
    });
    html += "</div>";

    html += "</div>";

    root.innerHTML = html;
    root.querySelectorAll("[data-go]").forEach(function (el) {
      el.addEventListener("click", function () { location.hash = "#/" + el.getAttribute("data-go"); });
    });
  }

  A.modules.accueil = { render: render };
})();
