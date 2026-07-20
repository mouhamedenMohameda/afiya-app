/* =====================================================================
   Afiya — Module « Archives » : séjours clôturés / dossiers passés.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function frDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }
  function sexeLabel(s) { return s === "F" ? tf("Fille", "أنثى") : tf("Garçon", "ذكر"); }

  var archives = [
    { code: "099540", nom: "Oumar Ould Sidi",      age: 6, sexe: "M", motif: "Crise d'asthme sévère",      admis: "2026-07-02", sorti: "2026-07-09", medecin: "Dr. Mariem Taleb", issue: "domicile" },
    { code: "099318", nom: "Aissata Ba",            age: 2, sexe: "F", motif: "Gastro-entérite déshydratante", admis: "2026-06-28", sorti: "2026-07-03", medecin: "Dr. Khadijetou Sy", issue: "domicile" },
    { code: "098876", nom: "Cheikhna Ould Mohamed", age: 9, sexe: "M", motif: "Polytraumatisme",            admis: "2026-06-20", sorti: "2026-07-01", medecin: "Dr. Ahmed Baba",  issue: "transfert" },
    { code: "098455", nom: "Mohamed Ould Taleb",    age: 6, sexe: "M", motif: "Traumatisme crânien grave",  admis: "2026-07-01", sorti: "2026-07-08", medecin: "Dr. Mohamed Vall", issue: "deces" },
    { code: "098102", nom: "Fatma Mint Ahmed",      age: 4, sexe: "F", motif: "Pneumopathie",               admis: "2026-06-15", sorti: "2026-06-22", medecin: "Dr. Sow Amadou",  issue: "domicile" },
    { code: "097740", nom: "Sidi Ould Baba",        age: 1, sexe: "M", motif: "Bronchiolite",               admis: "2026-06-10", sorti: "2026-06-16", medecin: "Dr. Mariem Taleb", issue: "domicile" }
  ];

  var state = { filter: "tous", search: "" };
  var rootEl = null;

  function issueMeta(i) {
    return {
      domicile:  { fr: "Retour domicile", ar: "العودة للمنزل", tone: "ok" },
      transfert: { fr: "Transfert", ar: "تحويل", tone: "info" },
      deces:     { fr: "Décès", ar: "وفاة", tone: "bad" }
    }[i] || { fr: i, ar: i, tone: "neutral" };
  }
  function duree(a, b) {
    var d = Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
    return d + " " + tf(d > 1 ? "jours" : "jour", "يوم");
  }

  function renderInto() {
    var seg = [
      { k: "tous", fr: "Tous", ar: "الكل" },
      { k: "domicile", fr: "Domicile", ar: "المنزل" },
      { k: "transfert", fr: "Transferts", ar: "تحويلات" },
      { k: "deces", fr: "Décès", ar: "وفيات" }
    ];
    var html = "";
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Archives", "الأرشيف") + "</h1>" +
              '<p class="page-sub">' + tf("Séjours clôturés", "الإقامات المنتهية") + " · " + archives.length + " " + tf("dossiers", "ملفات") + "</p></div>";
    html +=   '<div class="tb-controls">';
    html +=     '<div class="field-search">' + icon("search", 16) +
                '<input type="text" id="ar-search" placeholder="' + tf("Rechercher un dossier…", "بحث عن ملف…") + '" value="' + esc(state.search) + '"/></div>';
    html +=     '<div class="seg">' + seg.map(function (s) {
                  return '<button class="seg-btn' + (state.filter === s.k ? " active" : "") + '" data-filter="' + s.k + '">' + tf(s.fr, s.ar) + "</button>";
                }).join("") + "</div>";
    html +=   "</div></div>";

    var q = state.search.trim().toLowerCase();
    var list = archives.filter(function (a) {
      if (state.filter !== "tous" && a.issue !== state.filter) return false;
      if (q) return (a.nom + " " + a.code + " " + a.motif + " " + a.medecin).toLowerCase().indexOf(q) !== -1;
      return true;
    });

    if (!list.length) html += '<div class="empty">' + tf("Aucun dossier archivé.", "لا يوجد ملف مؤرشف.") + "</div>";
    else {
      html += '<div class="rec-list">';
      list.forEach(function (a, idx) {
        var im = issueMeta(a.issue);
        html += '<div class="rec-row" data-idx="' + archives.indexOf(a) + '">' +
          '<span class="rec-ic">' + icon("archives", 18) + "</span>" +
          '<div class="rec-main"><div class="rec-title">' + esc(a.nom) + ' <span class="rec-code">· ' + esc(a.code) + "</span></div>" +
            '<div class="rec-sub">' + esc(a.motif) + "</div></div>" +
          '<div class="rec-side"><span class="spill ' + im.tone + '"><span class="d"></span>' + esc(tf(im.fr, im.ar)) + "</span>" +
            '<span class="rec-meta">' + esc(frDate(a.sorti)) + "</span></div></div>";
      });
      html += "</div>";
    }
    rootEl.innerHTML = html;
    bind();
  }

  function bind() {
    var s = document.getElementById("ar-search");
    s.addEventListener("input", function () {
      state.search = s.value; var pos = s.selectionStart; renderInto();
      var ns = document.getElementById("ar-search"); ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) {}
    });
    rootEl.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () { state.filter = b.getAttribute("data-filter"); renderInto(); });
    });
    rootEl.querySelectorAll("[data-idx]").forEach(function (row) {
      row.addEventListener("click", function () { openDetail(archives[parseInt(row.getAttribute("data-idx"), 10)]); });
    });
  }

  function openDetail(a) {
    if (!a) return;
    var im = issueMeta(a.issue);
    var html = '<div class="af-drawer-head"><div>' +
      '<div class="pd-head"><span class="pd-av">' + esc(A.ui.initials(a.nom)) + "</span>" +
      "<div><div class=\"pd-name\">" + esc(a.nom) + "</div><div class=\"pd-code\">" + tf("Dossier", "ملف") + " " + esc(a.code) + "</div></div></div></div>" +
      '<button class="af-x" id="ard-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>';
    html += '<div style="margin:6px 0 2px"><span class="spill ' + im.tone + '"><span class="d"></span>' + esc(tf(im.fr, im.ar)) + "</span></div>";
    html += '<dl class="pd-list">' +
      "<dt>" + tf("Âge · Sexe", "العمر · الجنس") + "</dt><dd>" + a.age + " " + tf("ans", "سنة") + " · " + esc(sexeLabel(a.sexe)) + "</dd>" +
      "<dt>" + tf("Motif", "السبب") + "</dt><dd>" + esc(a.motif) + "</dd>" +
      "<dt>" + tf("Admis le", "تاريخ الدخول") + "</dt><dd>" + esc(frDate(a.admis)) + "</dd>" +
      "<dt>" + tf("Sorti le", "تاريخ الخروج") + "</dt><dd>" + esc(frDate(a.sorti)) + "</dd>" +
      "<dt>" + tf("Durée du séjour", "مدة الإقامة") + "</dt><dd>" + esc(duree(a.admis, a.sorti)) + "</dd>" +
      "<dt>" + tf("Médecin", "الطبيب") + "</dt><dd>" + esc(a.medecin) + "</dd>" +
    "</dl>";
    html += '<div class="af-drawer-foot"><button class="btn btn-ghost" id="ard-print">' + icon("print", 16) + tf("Imprimer le dossier", "طباعة الملف") + "</button></div>";
    UI.openDrawer(html);
    document.getElementById("ard-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("ard-print").addEventListener("click", function () { UI.toast(tf("Impression du dossier…", "جارٍ طباعة الملف…")); });
  }

  A.modules.archives = { render: function (root) { rootEl = root; renderInto(); } };
})();
