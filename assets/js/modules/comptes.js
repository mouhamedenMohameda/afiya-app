/* =====================================================================
   Afiya — Module « Comptes rendus » : rapports médicaux.
   Création, validation, impression.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function frDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }
  function me() { return (A.config.utilisateur && A.config.utilisateur.nom) || ""; }

  var seq = 1000;
  var reports = [
    { id: 1001, patientId: 1, type: "hospitalisation", titre: "CR d'hospitalisation — détresse respiratoire", auteur: "Dr. Mariem Taleb", date: "2026-07-18", statut: "valide",
      contenu: "Patiente admise pour détresse respiratoire aiguë sur pneumopathie. Oxygénothérapie et antibiothérapie instaurées. Évolution favorable sous surveillance." },
    { id: 1002, patientId: 2, type: "consultation", titre: "CR de réévaluation — sepsis sévère", auteur: "Dr. Mohamed Vall", date: "2026-07-19", statut: "brouillon",
      contenu: "Réévaluation à J3. Hémodynamique instable, poursuite du remplissage et des amines. Bilan infectieux en cours." },
    { id: 1003, patientId: 3, type: "operatoire", titre: "CR opératoire — appendicectomie", auteur: "Dr. Sow Amadou", date: "2026-07-17", statut: "valide",
      contenu: "Intervention sans incident. Appendice inflammatoire réséqué. Suites post-opératoires simples, surveillance en cours." }
  ];

  var state = { filter: "tous", search: "" };
  var rootEl = null;

  function typeMeta(t) {
    return {
      hospitalisation: { fr: "Hospitalisation", ar: "استشفاء", ic: "hospitalises" },
      operatoire:      { fr: "Opératoire", ar: "عملية", ic: "treatment" },
      consultation:    { fr: "Consultation", ar: "استشارة", ic: "stethoscope" },
      sortie:          { fr: "Sortie", ar: "خروج", ic: "exit" }
    }[t] || { fr: t, ar: t, ic: "comptes" };
  }
  function statutMeta(s) {
    return { brouillon: { fr: "Brouillon", ar: "مسودة", tone: "warn" }, valide: { fr: "Validé", ar: "مُعتمد", tone: "ok" } }[s] || { fr: s, ar: s, tone: "neutral" };
  }
  function pName(id) { var p = D.patient(id); return p ? p.nom : "—"; }

  function renderInto() {
    var seg = [
      { k: "tous", fr: "Tous", ar: "الكل" },
      { k: "brouillon", fr: "Brouillons", ar: "مسودات" },
      { k: "valide", fr: "Validés", ar: "معتمدة" }
    ];
    var html = "";
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Comptes rendus", "التقارير الطبية") + "</h1>" +
              '<p class="page-sub">' + tf("Rapports médicaux du service", "التقارير الطبية للقسم") + "</p></div>";
    html +=   '<div class="tb-controls">';
    html +=     '<div class="field-search">' + icon("search", 16) +
                '<input type="text" id="cr-search" placeholder="' + tf("Rechercher…", "بحث…") + '" value="' + esc(state.search) + '"/></div>';
    html +=     '<div class="seg">' + seg.map(function (s) {
                  return '<button class="seg-btn' + (state.filter === s.k ? " active" : "") + '" data-filter="' + s.k + '">' + tf(s.fr, s.ar) + "</button>";
                }).join("") + "</div>";
    html +=     '<button class="btn btn-primary btn-sm" id="cr-new">' + icon("plus", 15) + tf("Nouveau compte rendu", "تقرير جديد") + "</button>";
    html +=   "</div></div>";

    var q = state.search.trim().toLowerCase();
    var list = reports.filter(function (r) {
      if (state.filter !== "tous" && r.statut !== state.filter) return false;
      if (q) return (r.titre + " " + pName(r.patientId) + " " + r.auteur).toLowerCase().indexOf(q) !== -1;
      return true;
    });

    if (!list.length) html += '<div class="empty">' + tf("Aucun compte rendu.", "لا يوجد تقرير.") + "</div>";
    else {
      html += '<div class="rec-list">';
      list.forEach(function (r) {
        var tm = typeMeta(r.type), sm = statutMeta(r.statut);
        html += '<div class="rec-row" data-id="' + r.id + '">' +
          '<span class="rec-ic">' + icon(tm.ic, 18) + "</span>" +
          '<div class="rec-main"><div class="rec-title">' + esc(r.titre) + "</div>" +
            '<div class="rec-sub">' + esc(pName(r.patientId)) + " · " + esc(r.auteur) + "</div></div>" +
          '<div class="rec-side"><span class="spill ' + sm.tone + '"><span class="d"></span>' + esc(tf(sm.fr, sm.ar)) + "</span>" +
            '<span class="rec-meta">' + esc(frDate(r.date)) + "</span></div></div>";
      });
      html += "</div>";
    }
    rootEl.innerHTML = html;
    bind();
  }

  function bind() {
    var s = document.getElementById("cr-search");
    s.addEventListener("input", function () {
      state.search = s.value; var pos = s.selectionStart; renderInto();
      var ns = document.getElementById("cr-search"); ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) {}
    });
    rootEl.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () { state.filter = b.getAttribute("data-filter"); renderInto(); });
    });
    document.getElementById("cr-new").addEventListener("click", openNew);
    rootEl.querySelectorAll("[data-id]").forEach(function (row) {
      row.addEventListener("click", function () { openDetail(byId(parseInt(row.getAttribute("data-id"), 10))); });
    });
  }
  function byId(id) { for (var i = 0; i < reports.length; i++) if (reports[i].id === id) return reports[i]; return null; }

  function openDetail(r) {
    if (!r) return;
    var tm = typeMeta(r.type), sm = statutMeta(r.statut);
    var html = "";
    html += '<div class="af-drawer-head"><div><h3>' + esc(r.titre) + "</h3>" +
      '<div class="dsub">' + esc(pName(r.patientId)) + " · " + esc(tf(tm.fr, tm.ar)) + "</div></div>" +
      '<button class="af-x" id="cr-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>';
    html += '<div style="margin:4px 0 12px;display:flex;gap:8px;flex-wrap:wrap"><span class="spill ' + sm.tone + '"><span class="d"></span>' + esc(tf(sm.fr, sm.ar)) + "</span>" +
      '<span class="rec-meta" style="align-self:center">' + esc(r.auteur) + " · " + esc(frDate(r.date)) + "</span></div>";
    html += '<div class="result-box">' + esc(r.contenu) + "</div>";
    var foot = '<button class="btn btn-ghost" id="cr-print">' + icon("print", 16) + tf("Imprimer", "طباعة") + "</button>";
    if (r.statut === "brouillon") foot += '<button class="btn btn-primary" id="cr-validate">' + icon("check", 16) + tf("Valider", "اعتماد") + "</button>";
    html += '<div class="af-drawer-foot">' + foot + "</div>";
    UI.openDrawer(html);
    document.getElementById("cr-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("cr-print").addEventListener("click", function () {
      UI.toast(tf("Impression du compte rendu…", "جارٍ طباعة التقرير…"));
    });
    var v = document.getElementById("cr-validate");
    if (v) v.addEventListener("click", function () {
      r.statut = "valide"; UI.closeDrawer(); renderInto();
      UI.toast(tf("Compte rendu validé", "تم اعتماد التقرير"));
    });
  }

  function openNew() {
    var pats = D.patients.filter(function (p) { for (var i = 0; i < D.beds.length; i++) if (D.beds[i].patientId === p.id) return true; return false; });
    var patOpts = pats.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nom) + " · " + esc(p.code) + "</option>"; }).join("");
    var typeOpts = ["hospitalisation", "operatoire", "consultation", "sortie"].map(function (t) { var m = typeMeta(t); return '<option value="' + t + '">' + esc(tf(m.fr, m.ar)) + "</option>"; }).join("");
    var html =
      '<div class="af-drawer-head"><div><h3>' + tf("Nouveau compte rendu", "تقرير جديد") + "</h3><div class=\"dsub\">" + esc(me()) + "</div></div>" +
        '<button class="af-x" id="crn-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<form id="cr-form">' +
        '<div class="af-field"><label>' + tf("Patient", "المريض") + ' <span class="req">*</span></label><select id="crn-pat">' + patOpts + "</select></div>" +
        '<div class="af-field"><label>' + tf("Type", "النوع") + '</label><select id="crn-type">' + typeOpts + "</select></div>" +
        '<div class="af-field"><label>' + tf("Titre", "العنوان") + ' <span class="req">*</span></label><input id="crn-titre" required /></div>' +
        '<div class="af-field"><label>' + tf("Contenu", "المحتوى") + ' <span class="req">*</span></label><textarea id="crn-contenu" required></textarea></div>' +
        '<div class="af-drawer-foot">' +
          '<button type="button" class="btn btn-ghost" id="crn-cancel">' + tf("Annuler", "إلغاء") + "</button>" +
          '<button type="submit" class="btn btn-primary">' + tf("Enregistrer", "حفظ") + "</button>" +
        "</div></form>";
    UI.openDrawer(html);
    document.getElementById("crn-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("crn-cancel").addEventListener("click", UI.closeDrawer);
    document.getElementById("cr-form").addEventListener("submit", function (e) {
      e.preventDefault();
      reports.unshift({ id: ++seq, patientId: parseInt(document.getElementById("crn-pat").value, 10),
        type: document.getElementById("crn-type").value, titre: document.getElementById("crn-titre").value.trim(),
        auteur: me(), date: D.today, statut: "brouillon", contenu: document.getElementById("crn-contenu").value.trim() });
      UI.closeDrawer(); renderInto();
      UI.toast(tf("Compte rendu créé (brouillon)", "تم إنشاء التقرير (مسودة)"));
    });
  }

  A.modules.comptes = { render: function (root) { rootEl = root; renderInto(); } };
})();
