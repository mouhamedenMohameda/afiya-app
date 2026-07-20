/* =====================================================================
   Afiya — Module « Explorations » : biologie, imagerie et autres examens.
   Demandes + suivi du statut + résultats.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function frDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }

  var seq = 900;
  var items = [
    { id: 901, patientId: 2, type: "bio",      libelle: "Bilan infectieux (CRP, PCT, NFS)", date: "2026-07-19", statut: "resultat", resultat: "CRP 148 mg/L · PCT 12 ng/mL · GB 21 000/mm³. Syndrome inflammatoire majeur." },
    { id: 902, patientId: 5, type: "imagerie", libelle: "TDM cérébrale sans injection",      date: "2026-07-19", statut: "en_cours", resultat: "" },
    { id: 903, patientId: 1, type: "imagerie", libelle: "Radiographie thoracique",           date: "2026-07-18", statut: "resultat", resultat: "Foyer de condensation basal droit. Pas d'épanchement." },
    { id: 904, patientId: 9, type: "bio",      libelle: "Gaz du sang artériel",              date: "2026-07-19", statut: "demande",  resultat: "" },
    { id: 905, patientId: 8, type: "bio",      libelle: "Hémocultures (2 paires)",           date: "2026-07-18", statut: "en_cours", resultat: "" },
    { id: 906, patientId: 4, type: "autre",    libelle: "ECG 12 dérivations",                date: "2026-07-18", statut: "resultat", resultat: "Tachycardie sinusale à 148/min. Pas de trouble de repolarisation." }
  ];

  var state = { filter: "tous", search: "" };
  var rootEl = null;

  function typeMeta(t) {
    return {
      bio:      { fr: "Biologie", ar: "تحاليل", ic: "flask", cls: "info" },
      imagerie: { fr: "Imagerie", ar: "أشعة",   ic: "image", cls: "" },
      autre:    { fr: "Autre",    ar: "أخرى",    ic: "explorations", cls: "warn" }
    }[t] || { fr: t, ar: t, ic: "explorations", cls: "" };
  }
  function statutMeta(s) {
    return {
      demande:  { fr: "Demandé", ar: "مطلوب",  tone: "neutral" },
      en_cours: { fr: "En cours", ar: "قيد التنفيذ", tone: "warn" },
      resultat: { fr: "Résultat disponible", ar: "النتيجة متوفرة", tone: "ok" }
    }[s] || { fr: s, ar: s, tone: "neutral" };
  }
  function pName(id) { var p = D.patient(id); return p ? p.nom : "—"; }
  function pCode(id) { var p = D.patient(id); return p ? p.code : ""; }

  function renderInto() {
    var seg = [
      { k: "tous", fr: "Toutes", ar: "الكل" },
      { k: "demande", fr: "Demandées", ar: "مطلوبة" },
      { k: "en_cours", fr: "En cours", ar: "قيد التنفيذ" },
      { k: "resultat", fr: "Résultats", ar: "النتائج" }
    ];
    var html = "";
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Explorations", "الاستكشافات") + "</h1>" +
              '<p class="page-sub">' + tf("Biologie · Imagerie · Examens", "تحاليل · أشعة · فحوصات") + "</p></div>";
    html +=   '<div class="tb-controls">';
    html +=     '<div class="field-search">' + icon("search", 16) +
                '<input type="text" id="ex-search" placeholder="' + tf("Rechercher…", "بحث…") + '" value="' + esc(state.search) + '"/></div>';
    html +=     '<div class="seg">' + seg.map(function (s) {
                  return '<button class="seg-btn' + (state.filter === s.k ? " active" : "") + '" data-filter="' + s.k + '">' + tf(s.fr, s.ar) + "</button>";
                }).join("") + "</div>";
    html +=     '<button class="btn btn-primary btn-sm" id="ex-new">' + icon("plus", 15) + tf("Nouvelle demande", "طلب جديد") + "</button>";
    html +=   "</div></div>";

    var q = state.search.trim().toLowerCase();
    var list = items.filter(function (it) {
      if (state.filter !== "tous" && it.statut !== state.filter) return false;
      if (q) return (it.libelle + " " + pName(it.patientId) + " " + pCode(it.patientId)).toLowerCase().indexOf(q) !== -1;
      return true;
    });

    if (!list.length) html += '<div class="empty">' + tf("Aucune exploration.", "لا يوجد استكشاف.") + "</div>";
    else {
      html += '<div class="rec-list">';
      list.forEach(function (it) {
        var tm = typeMeta(it.type), sm = statutMeta(it.statut);
        html += '<div class="rec-row" data-id="' + it.id + '">' +
          '<span class="rec-ic ' + tm.cls + '">' + icon(tm.ic, 18) + "</span>" +
          '<div class="rec-main"><div class="rec-title">' + esc(it.libelle) + "</div>" +
            '<div class="rec-sub">' + esc(pName(it.patientId)) + " · " + esc(tf(tm.fr, tm.ar)) + "</div></div>" +
          '<div class="rec-side"><span class="spill ' + sm.tone + '"><span class="d"></span>' + esc(tf(sm.fr, sm.ar)) + "</span>" +
            '<span class="rec-meta">' + esc(frDate(it.date)) + "</span></div></div>";
      });
      html += "</div>";
    }
    rootEl.innerHTML = html;
    bind();
  }

  function bind() {
    var s = document.getElementById("ex-search");
    s.addEventListener("input", function () {
      state.search = s.value; var pos = s.selectionStart; renderInto();
      var ns = document.getElementById("ex-search"); ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) {}
    });
    rootEl.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () { state.filter = b.getAttribute("data-filter"); renderInto(); });
    });
    document.getElementById("ex-new").addEventListener("click", openNew);
    rootEl.querySelectorAll("[data-id]").forEach(function (row) {
      row.addEventListener("click", function () { openDetail(byId(parseInt(row.getAttribute("data-id"), 10))); });
    });
  }
  function byId(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }

  function openDetail(it) {
    if (!it) return;
    var tm = typeMeta(it.type), sm = statutMeta(it.statut);
    var html = "";
    html += '<div class="af-drawer-head"><div><h3>' + esc(it.libelle) + "</h3>" +
      '<div class="dsub">' + esc(pName(it.patientId)) + " · " + esc(tf(tm.fr, tm.ar)) + " · " + esc(frDate(it.date)) + "</div></div>" +
      '<button class="af-x" id="ex-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>';
    html += '<div style="margin:4px 0 14px"><span class="spill ' + sm.tone + '"><span class="d"></span>' + esc(tf(sm.fr, sm.ar)) + "</span></div>";
    html += '<div class="pd-tabs-title">' + tf("Résultat", "النتيجة") + "</div>";
    if (it.resultat) html += '<div class="result-box">' + esc(it.resultat) + "</div>";
    else html += '<div class="mini-empty">' + tf("Résultat non encore disponible.", "النتيجة غير متوفرة بعد.") + "</div>";

    var foot = "";
    if (it.statut === "demande") foot += '<button class="btn btn-ghost" data-adv="en_cours">' + tf("Marquer en cours", "وضع قيد التنفيذ") + "</button>";
    if (it.statut === "en_cours") foot += '<button class="btn btn-primary" data-adv="resultat">' + icon("check", 16) + tf("Saisir le résultat", "إدخال النتيجة") + "</button>";
    if (foot) html += '<div class="af-drawer-foot">' + foot + "</div>";

    UI.openDrawer(html);
    document.getElementById("ex-x").addEventListener("click", UI.closeDrawer);
    document.querySelectorAll("[data-adv]").forEach(function (b) {
      b.addEventListener("click", function () {
        var to = b.getAttribute("data-adv");
        if (to === "resultat") {
          var r = window.prompt(tf("Saisir le résultat :", "أدخل النتيجة:"), "");
          if (r == null) return;
          it.resultat = r.trim(); it.statut = "resultat";
        } else it.statut = to;
        UI.closeDrawer(); renderInto();
        UI.toast(tf("Exploration mise à jour", "تم تحديث الاستكشاف"));
      });
    });
  }

  function openNew() {
    var pats = D.patients.filter(function (p) { for (var i = 0; i < D.beds.length; i++) if (D.beds[i].patientId === p.id) return true; return false; });
    var patOpts = pats.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nom) + " · " + esc(p.code) + "</option>"; }).join("");
    var typeOpts = ["bio", "imagerie", "autre"].map(function (t) { var m = typeMeta(t); return '<option value="' + t + '">' + esc(tf(m.fr, m.ar)) + "</option>"; }).join("");
    var html =
      '<div class="af-drawer-head"><div><h3>' + tf("Nouvelle demande", "طلب جديد") + "</h3>" +
        '<div class="dsub">' + tf("Exploration", "استكشاف") + "</div></div>" +
        '<button class="af-x" id="exn-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<form id="ex-form">' +
        '<div class="af-field"><label>' + tf("Patient", "المريض") + ' <span class="req">*</span></label><select id="exn-pat">' + patOpts + "</select></div>" +
        '<div class="af-field"><label>' + tf("Type", "النوع") + '</label><select id="exn-type">' + typeOpts + "</select></div>" +
        '<div class="af-field"><label>' + tf("Libellé de l'examen", "عنوان الفحص") + ' <span class="req">*</span></label><input id="exn-lib" required /></div>' +
        '<div class="af-drawer-foot">' +
          '<button type="button" class="btn btn-ghost" id="exn-cancel">' + tf("Annuler", "إلغاء") + "</button>" +
          '<button type="submit" class="btn btn-primary">' + tf("Enregistrer la demande", "تسجيل الطلب") + "</button>" +
        "</div></form>";
    UI.openDrawer(html);
    document.getElementById("exn-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("exn-cancel").addEventListener("click", UI.closeDrawer);
    document.getElementById("ex-form").addEventListener("submit", function (e) {
      e.preventDefault();
      items.unshift({ id: ++seq, patientId: parseInt(document.getElementById("exn-pat").value, 10),
        type: document.getElementById("exn-type").value, libelle: document.getElementById("exn-lib").value.trim(),
        date: D.today, statut: "demande", resultat: "" });
      UI.closeDrawer(); renderInto();
      UI.toast(tf("Demande enregistrée", "تم تسجيل الطلب"));
    });
  }

  A.modules.explorations = { render: function (root) { rootEl = root; renderInto(); } };
})();
