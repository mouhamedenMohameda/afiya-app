/* =====================================================================
   Afiya — Module « Transmissions » : relèves inter-équipes (postes).
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function me() { return (A.config.utilisateur && A.config.utilisateur.nom) || ""; }
  function pName(id) { var p = D.patient(id); return p ? p.nom : null; }

  var seq = 1100;
  var trans = [
    { id: 1101, patientId: 2, auteur: "Dr. Mohamed Vall", poste: "nuit", heure: "05:40", priorite: "urgent",
      texte: "Instabilité hémodynamique persistante malgré remplissage. Amines augmentées. Prévenir réanimateur si aggravation." },
    { id: 1102, patientId: 1, auteur: "Inf. Khadija Sow", poste: "matin", heure: "07:15", priorite: "important",
      texte: "SpO₂ remontée à 97% sous 2 L/min. Bonne tolérance. Poursuivre kinésithérapie respiratoire." },
    { id: 1103, patientId: 5, auteur: "Inf. Ahmed Salem", poste: "matin", heure: "08:00", priorite: "info",
      texte: "Patiente calme, Glasgow 15. Alimentation reprise sans vomissement. Surveillance neurologique horaire." },
    { id: 1104, patientId: 9, auteur: "Dr. Ahmed Baba", poste: "nuit", heure: "03:20", priorite: "urgent",
      texte: "Choc septique, diurèse effondrée. Bilan rénal demandé. Réévaluation antibiothérapie à discuter ce matin." }
  ];

  var state = { filter: "tous", search: "" };
  var rootEl = null;

  function posteMeta(p) {
    return {
      matin: { fr: "Matin", ar: "صباح", ic: "sun" },
      apres_midi: { fr: "Après-midi", ar: "بعد الظهر", ic: "surveillance" },
      nuit: { fr: "Nuit", ar: "ليل", ic: "moon" }
    }[p] || { fr: p, ar: p, ic: "clock" };
  }
  function prioMeta(p) {
    return {
      info: { fr: "Info", ar: "معلومة", tone: "neutral" },
      important: { fr: "Important", ar: "مهم", tone: "warn" },
      urgent: { fr: "Urgent", ar: "عاجل", tone: "bad" }
    }[p] || { fr: p, ar: p, tone: "neutral" };
  }

  function renderInto() {
    var seg = [
      { k: "tous", fr: "Tous", ar: "الكل" },
      { k: "urgent", fr: "Urgents", ar: "عاجلة" },
      { k: "matin", fr: "Matin", ar: "صباح" },
      { k: "nuit", fr: "Nuit", ar: "ليل" }
    ];
    var html = "";
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Transmissions", "التحويلات") + "</h1>" +
              '<p class="page-sub">' + tf("Relèves entre équipes", "التسليم بين الفرق") + "</p></div>";
    html +=   '<div class="tb-controls">';
    html +=     '<div class="field-search">' + icon("search", 16) +
                '<input type="text" id="tr-search" placeholder="' + tf("Rechercher…", "بحث…") + '" value="' + esc(state.search) + '"/></div>';
    html +=     '<div class="seg">' + seg.map(function (s) {
                  return '<button class="seg-btn' + (state.filter === s.k ? " active" : "") + '" data-filter="' + s.k + '">' + tf(s.fr, s.ar) + "</button>";
                }).join("") + "</div>";
    html +=     '<button class="btn btn-primary btn-sm" id="tr-new">' + icon("plus", 15) + tf("Nouvelle transmission", "تحويل جديد") + "</button>";
    html +=   "</div></div>";

    var q = state.search.trim().toLowerCase();
    var list = trans.filter(function (t) {
      if (state.filter === "urgent" && t.priorite !== "urgent") return false;
      if ((state.filter === "matin" || state.filter === "nuit") && t.poste !== state.filter) return false;
      if (q) return (t.texte + " " + (pName(t.patientId) || "") + " " + t.auteur).toLowerCase().indexOf(q) !== -1;
      return true;
    });

    if (!list.length) html += '<div class="empty">' + tf("Aucune transmission.", "لا يوجد تحويل.") + "</div>";
    else {
      html += '<div class="tr-list">';
      list.forEach(function (t) {
        var pm = posteMeta(t.poste), prm = prioMeta(t.priorite), pn = pName(t.patientId);
        html += '<div class="tr-card ' + prm.tone + '">' +
          '<div class="tr-top">' +
            '<span class="tr-auteur">' + esc(t.auteur) + "</span>" +
            '<span class="tr-poste">' + icon(pm.ic, 14) + esc(tf(pm.fr, pm.ar)) + " · " + esc(t.heure) + "</span>" +
            '<span class="spill ' + prm.tone + '"><span class="d"></span>' + esc(tf(prm.fr, prm.ar)) + "</span>" +
          "</div>" +
          (pn ? '<div class="tr-patient">' + icon("user", 13) + esc(pn) + "</div>" : "") +
          '<div class="tr-text">' + esc(t.texte) + "</div>" +
        "</div>";
      });
      html += "</div>";
    }
    rootEl.innerHTML = html;
    bind();
  }

  function bind() {
    var s = document.getElementById("tr-search");
    s.addEventListener("input", function () {
      state.search = s.value; var pos = s.selectionStart; renderInto();
      var ns = document.getElementById("tr-search"); ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) {}
    });
    rootEl.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () { state.filter = b.getAttribute("data-filter"); renderInto(); });
    });
    document.getElementById("tr-new").addEventListener("click", openNew);
  }

  function openNew() {
    var pats = D.patients.filter(function (p) { for (var i = 0; i < D.beds.length; i++) if (D.beds[i].patientId === p.id) return true; return false; });
    var patOpts = '<option value="">' + tf("— Aucun (général) —", "— لا أحد (عام) —") + "</option>" +
      pats.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nom) + " · " + esc(p.code) + "</option>"; }).join("");
    var posteOpts = ["matin", "apres_midi", "nuit"].map(function (t) { var m = posteMeta(t); return '<option value="' + t + '">' + esc(tf(m.fr, m.ar)) + "</option>"; }).join("");
    var prioOpts = ["info", "important", "urgent"].map(function (t) { var m = prioMeta(t); return '<option value="' + t + '">' + esc(tf(m.fr, m.ar)) + "</option>"; }).join("");
    var html =
      '<div class="af-drawer-head"><div><h3>' + tf("Nouvelle transmission", "تحويل جديد") + "</h3><div class=\"dsub\">" + esc(me()) + "</div></div>" +
        '<button class="af-x" id="trn-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<form id="tr-form">' +
        '<div class="af-field"><label>' + tf("Patient concerné", "المريض المعني") + '</label><select id="trn-pat">' + patOpts + "</select></div>" +
        '<div class="af-form-grid">' +
          '<div class="af-field"><label>' + tf("Poste", "الوردية") + '</label><select id="trn-poste">' + posteOpts + "</select></div>" +
          '<div class="af-field"><label>' + tf("Priorité", "الأولوية") + '</label><select id="trn-prio">' + prioOpts + "</select></div>" +
        "</div>" +
        '<div class="af-field"><label>' + tf("Transmission", "التحويل") + ' <span class="req">*</span></label><textarea id="trn-texte" required></textarea></div>' +
        '<div class="af-drawer-foot">' +
          '<button type="button" class="btn btn-ghost" id="trn-cancel">' + tf("Annuler", "إلغاء") + "</button>" +
          '<button type="submit" class="btn btn-primary">' + icon("send", 16) + tf("Transmettre", "إرسال") + "</button>" +
        "</div></form>";
    UI.openDrawer(html);
    document.getElementById("trn-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("trn-cancel").addEventListener("click", UI.closeDrawer);
    document.getElementById("tr-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var pid = document.getElementById("trn-pat").value;
      trans.unshift({ id: ++seq, patientId: pid ? parseInt(pid, 10) : null,
        auteur: me(), poste: document.getElementById("trn-poste").value, heure: "14:35",
        priorite: document.getElementById("trn-prio").value, texte: document.getElementById("trn-texte").value.trim() });
      UI.closeDrawer(); renderInto();
      UI.toast(tf("Transmission enregistrée", "تم تسجيل التحويل"));
    });
  }

  A.modules.transmissions = { render: function (root) { rootEl = root; renderInto(); } };
})();
