/* =====================================================================
   Afiya — Module « Tableau de bord »
   Indicateurs + graphiques calculés à partir des données (lits/patients).
   Même patron que Hospitalisés : s'enregistre dans AFIYA.modules.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function svc() { var s = (A.config && A.config.service) || { fr: "Hospitalisation", ar: "الاستشفاء" }; return tf(s.fr, s.ar); }

  function etatCounts() {
    var c = { stable: 0, surveillance: 0, critique: 0 };
    D.beds.forEach(function (b) { var p = D.bedPatient(b); if (p && c[p.etat] != null) c[p.etat]++; });
    return c;
  }
  function salleStats() {
    var order = [], m = {};
    D.beds.forEach(function (b) {
      if (!m[b.salle]) { m[b.salle] = { occ: 0, total: 0 }; order.push(b.salle); }
      m[b.salle].total++; if (b.patientId) m[b.salle].occ++;
    });
    return order.map(function (s) { return { salle: s, occ: m[s].occ, total: m[s].total }; });
  }
  function bedOf(pid) { for (var i = 0; i < D.beds.length; i++) if (D.beds[i].patientId === pid) return D.beds[i]; return null; }

  function kpiCard(ic, cls, val, lbl) {
    return '<div class="dkpi"><div class="k-ic ' + cls + '">' + icon(ic, 18) + "</div>" +
      '<div class="k-val">' + val + "</div><div class=\"k-lbl\">" + esc(lbl) + "</div></div>";
  }
  function bar(label, value, max, cls) {
    var pct = max ? Math.round(value / max * 100) : 0;
    return '<div class="dbar"><div class="dl"><span>' + esc(label) + '</span><span class="v">' + value + "</span></div>" +
      '<div class="dtrack"><div class="dfill ' + (cls || "") + '" style="width:' + pct + '%"></div></div></div>';
  }

  function render(root) {
    var c = D.counts();
    var ec = etatCounts();
    var rate = c.total ? Math.round(c.occ / c.total * 100) : 0;

    var html = "";
    html += '<div class="page-head"><h1 class="page-title">' + tf("Tableau de bord", "لوحة التحكم") + "</h1>" +
      '<p class="page-sub">' + esc(svc()) + "</p></div>";

    /* KPI */
    html += '<div class="dash-kpis">' +
      kpiCard("hospitalises", "",     c.occ,           tf("Patients hospitalisés", "المرضى المقيمون")) +
      kpiCard("plus",         "info", c.free,          tf("Lits disponibles", "أسرّة متاحة")) +
      kpiCard("urgences",     "bad",  c.critique,      tf("Cas critiques", "حالات حرجة")) +
      kpiCard("surveillance", "warn", ec.surveillance, tf("Sous surveillance", "تحت المراقبة")) +
      kpiCard("dashboard",    "",     rate + "%",      tf("Taux d'occupation", "نسبة الإشغال")) +
    "</div>";

    /* rangée 1 : donut + états */
    html += '<div class="dash-2">';
    html += '<div class="dpanel"><h3>' + tf("Occupation des lits", "إشغال الأسرّة") + "</h3>" +
      '<div class="donut-wrap">' +
        '<div class="donut" style="background:conic-gradient(var(--brand) 0 ' + rate + '%, var(--line) ' + rate + '% 100%)">' +
          '<div class="donut-val"><div class="dv-num">' + rate + '%</div><div class="dv-lbl">' + tf("occupé", "مشغول") + "</div></div>" +
        "</div>" +
        '<div class="donut-legend">' +
          '<div class="lg"><span class="sw" style="background:var(--brand)"></span>' + tf("Occupés", "مشغولة") + '<span class="v">' + c.occ + "</span></div>" +
          '<div class="lg"><span class="sw" style="background:var(--line)"></span>' + tf("Disponibles", "متاحة") + '<span class="v">' + c.free + "</span></div>" +
          '<div class="lg"><span class="sw" style="background:var(--ink-faint)"></span>' + tf("Capacité totale", "السعة الإجمالية") + '<span class="v">' + c.total + "</span></div>" +
        "</div>" +
      "</div></div>";

    html += '<div class="dpanel"><h3>' + tf("Répartition par état clinique", "التوزيع حسب الحالة السريرية") + "</h3>" +
      bar(tf("Stable", "مستقر"), ec.stable, c.occ, "ok") +
      bar(tf("Surveillance", "مراقبة"), ec.surveillance, c.occ, "warn") +
      bar(tf("Critique", "حرج"), ec.critique, c.occ, "bad") +
    "</div>";
    html += "</div>";

    /* rangée 2 : occupation par salle + cas critiques */
    html += '<div class="dash-2">';
    html += '<div class="dpanel"><h3>' + tf("Occupation par salle", "الإشغال حسب الغرفة") + "</h3>";
    salleStats().forEach(function (s) {
      var lbl = tf("Salle", "غرفة") + " " + s.salle;
      var pct = s.total ? Math.round(s.occ / s.total * 100) : 0;
      html += '<div class="dbar"><div class="dl"><span>' + esc(lbl) + '</span><span class="v" dir="ltr">' + s.occ + " / " + s.total + '</span></div>' +
        '<div class="dtrack"><div class="dfill" style="width:' + pct + '%"></div></div></div>';
    });
    html += "</div>";

    var critiques = D.patients.filter(function (p) { return p.etat === "critique" && bedOf(p.id); });
    html += '<div class="dpanel"><h3>' + tf("Cas critiques à surveiller", "حالات حرجة للمتابعة") + "</h3>";
    if (!critiques.length) {
      html += '<div style="color:var(--ink-faint);font-size:13.5px;padding:6px 0">' + tf("Aucun cas critique.", "لا توجد حالات حرجة.") + "</div>";
    } else {
      critiques.forEach(function (p) {
        var b = bedOf(p.id);
        html += '<div class="crit-row" data-goto-hosp="1">' +
          '<span class="crit-av">' + esc(A.ui.initials(p.nom)) + "</span>" +
          "<div><div class=\"crit-name\">" + esc(p.nom) + "</div><div class=\"crit-meta\">" + esc(p.motif) + "</div></div>" +
          '<span class="crit-bed">' + tf("Salle", "غرفة") + " " + b.salle + " · " + esc(b.lit) + "</span>" +
        "</div>";
      });
    }
    html += "</div>";
    html += "</div>";

    root.innerHTML = html;

    root.querySelectorAll("[data-goto-hosp]").forEach(function (el) {
      el.addEventListener("click", function () { location.hash = "#/hospitalises"; });
    });
  }

  A.modules.dashboard = { render: render };
})();
