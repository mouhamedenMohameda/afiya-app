/* =====================================================================
   Afiya — Module « Urgences »
   File d'attente avec triage clinique (5 niveaux), prise en charge et
   orientation. L'orientation « Hospitaliser » admet directement dans un
   lit libre (connexion au module Hospitalisés).
   Même patron que Hospitalisés : s'enregistre dans AFIYA.modules.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };

  var state = { filter: "tous", search: "" };
  var rootEl = null;

  /* ---- libellés ---- */
  function svc() { var s = (A.config && A.config.service) || { fr: "Urgences", ar: "الطوارئ" }; return tf(s.fr, s.ar); }
  function sexeLabel(s) { return s === "F" ? tf("Fille", "أنثى") : tf("Garçon", "ذكر"); }
  function triLabel(level) { var m = D.triageMeta(level); return tf(m.fr, m.ar); }

  function statutMeta(st) {
    return {
      attente:  { fr: "En attente", ar: "في الانتظار", tone: "warn" },
      en_cours: { fr: "En cours",   ar: "قيد المعالجة", tone: "ok" },
      oriente:  { fr: "Orienté",    ar: "تم توجيهه",   tone: "neutral" }
    }[st] || { fr: st, ar: st, tone: "neutral" };
  }
  function dispoLabel(dispo) {
    return {
      hospitalisation: { fr: "Hospitalisé", ar: "تم إدخاله" },
      sortie:          { fr: "Retour à domicile", ar: "العودة إلى المنزل" },
      transfert:       { fr: "Transféré", ar: "تم تحويله" }
    }[dispo] || { fr: "—", ar: "—" };
  }

  function waitLabel(mins) {
    if (mins < 60) return mins + " " + tf("min", "د");
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + " " + tf("h", "س") + (m ? " " + m : "");
  }

  /* ---- ligne de la file ---- */
  function rowHtml(em) {
    var m = D.triageMeta(em.triage);
    var sm = statutMeta(em.statut);
    var wait = D.waitMinutes(em);
    var overdue = D.isOverdue(em);
    var side;
    if (em.statut === "oriente") {
      var dl = dispoLabel(em.dispo);
      side = '<div class="eq-time">' + esc(em.arrivee) + "</div>" +
             '<div class="eq-dispo">' + esc(tf(dl.fr, dl.ar)) + "</div>";
    } else if (em.statut === "en_cours") {
      side = '<div class="eq-time">' + esc(em.arrivee) + "</div>" +
             '<span class="spill ok"><span class="d"></span>' + tf("En cours", "قيد المعالجة") + "</span>";
    } else {
      side = '<div class="eq-time">' + esc(em.arrivee) + "</div>" +
             '<div class="eq-wait' + (overdue ? " over" : "") + '">' + icon("clock", 13) + waitLabel(wait) + "</div>";
    }

    return '<div class="eq-row tri-' + em.triage + (em.statut === "oriente" ? " done" : "") + '" data-em="' + em.id + '">' +
      '<div class="eq-tri">' +
        '<span class="eq-lvl">' + em.triage + "</span>" +
        '<span class="eq-tlabel">' + esc(triLabel(em.triage)) + "</span>" +
      "</div>" +
      '<div class="eq-main">' +
        '<div class="eq-name">' + esc(em.nom) + ' <span class="eq-code">· ' + esc(em.code) + "</span></div>" +
        '<div class="eq-motif">' + esc(em.motif) + "</div>" +
        '<div class="eq-tags">' +
          '<span class="eq-tag">' + em.age + " " + tf("ans", "سنة") + "</span>" +
          '<span class="eq-tag">' + esc(sexeLabel(em.sexe)) + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="eq-side">' + side + "</div>" +
    "</div>";
  }

  /* ---- rendu principal ---- */
  function renderInto() {
    var c = D.emCounts();
    var seg = [
      { k: "tous",     fr: "Tous",       ar: "الكل" },
      { k: "attente",  fr: "En attente", ar: "في الانتظار" },
      { k: "en_cours", fr: "En cours",   ar: "قيد المعالجة" },
      { k: "oriente",  fr: "Orientés",   ar: "موجَّهون" }
    ];

    var html = "";
    /* toolbar */
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Urgences", "الطوارئ") + "</h1>" +
              '<p class="page-sub">' + esc(svc()) + "</p></div>";
    html +=   '<div class="tb-controls">';
    html +=     '<div class="field-search">' + icon("search", 16) +
                '<input type="text" id="em-search" placeholder="' + tf("Rechercher…", "بحث…") + '" value="' + esc(state.search) + '"/></div>';
    html +=     '<div class="seg">' + seg.map(function (s) {
                  return '<button class="seg-btn' + (state.filter === s.k ? " active" : "") + '" data-filter="' + s.k + '">' + tf(s.fr, s.ar) + "</button>";
                }).join("") + "</div>";
    html +=     '<button class="btn btn-primary btn-sm" id="arrival-btn">' + icon("plus", 15) + tf("Nouvelle arrivée", "وصول جديد") + "</button>";
    html +=   "</div></div>";

    /* résumé */
    html += '<div class="summary-chips">' +
      '<span class="sum-chip"><span class="d warn"></span>' + tf("En attente", "في الانتظار") + ' <span class="n">' + c.attente + "</span></span>" +
      '<span class="sum-chip"><span class="d ok"></span>' + tf("En cours", "قيد المعالجة") + ' <span class="n">' + c.en_cours + "</span></span>" +
      (c.overdue ? '<span class="sum-chip over"><span class="d bad"></span>' + tf("Délai dépassé", "تجاوز المهلة") + ' <span class="n">' + c.overdue + "</span></span>" : "") +
      '<span class="sum-chip"><span class="d"></span>' + tf("Orientés", "موجَّهون") + ' <span class="n">' + c.oriente + "</span></span>" +
    "</div>";

    /* légende triage */
    html += '<div class="tri-legend">';
    [1, 2, 3, 4, 5].forEach(function (lv) {
      html += '<span class="tri-key tri-' + lv + '"><span class="tk-dot"></span>' + lv + " · " + esc(triLabel(lv)) +
        (c.tri[lv] ? ' <span class="tk-n">' + c.tri[lv] + "</span>" : "") + "</span>";
    });
    html += "</div>";

    /* file filtrée */
    var q = state.search.trim().toLowerCase();
    var list = D.emQueue().filter(function (e) {
      if (state.filter !== "tous" && e.statut !== state.filter) return false;
      if (q) {
        var hay = (e.nom + " " + e.code + " " + e.motif).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (!list.length) {
      html += '<div class="empty">' + tf("Aucun patient dans la file.", "لا يوجد مريض في القائمة.") + "</div>";
    } else {
      html += '<div class="eq-list">' + list.map(rowHtml).join("") + "</div>";
    }

    rootEl.innerHTML = html;
    bind();
  }

  function bind() {
    var s = document.getElementById("em-search");
    s.addEventListener("input", function () {
      state.search = s.value;
      var pos = s.selectionStart;
      renderInto();
      var ns = document.getElementById("em-search");
      ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) {}
    });
    rootEl.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () { state.filter = b.getAttribute("data-filter"); renderInto(); });
    });
    document.getElementById("arrival-btn").addEventListener("click", openArrival);
    rootEl.querySelectorAll("[data-em]").forEach(function (row) {
      row.addEventListener("click", function () {
        openDetail(D.emById(parseInt(row.getAttribute("data-em"), 10)));
      });
    });
  }

  function refresh() {
    renderInto();
    /* badge sidebar = patients en attente */
    var badge = document.querySelector('#nav [data-route="urgences"] .ni-badge');
    if (badge) badge.textContent = D.emCounts().attente;
  }
  function refreshHospBadge() {
    var badge = document.querySelector('#nav [data-route="hospitalises"] .ni-badge');
    if (badge) badge.textContent = D.counts().occ;
  }

  /* ---- détail patient / actions ---- */
  function openDetail(em) {
    if (!em) return;
    var m = D.triageMeta(em.triage);
    var sm = statutMeta(em.statut);
    var wait = D.waitMinutes(em);

    var html = "";
    html += '<div class="af-drawer-head"><div>' +
      '<div class="pd-head"><span class="pd-av tri-av tri-' + em.triage + '">' + em.triage + "</span>" +
      "<div><div class=\"pd-name\">" + esc(em.nom) + "</div><div class=\"pd-code\">" +
        tf("Dossier", "ملف") + " " + esc(em.code) + " · " + tf("Arrivée", "الوصول") + " " + esc(em.arrivee) + "</div></div></div>" +
      "</div>" +
      '<button class="af-x" id="em-x" aria-label="Fermer">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
      "</div>";

    html += '<div class="em-badges">' +
      '<span class="spill tri-spill tri-' + em.triage + '"><span class="d"></span>' + tf("Niveau", "المستوى") + " " + em.triage + " · " + esc(triLabel(em.triage)) + "</span>" +
      '<span class="spill ' + sm.tone + '"><span class="d"></span>' + esc(tf(sm.fr, sm.ar)) + "</span>" +
    "</div>";

    html += '<dl class="pd-list">' +
      "<dt>" + tf("Âge · Sexe", "العمر · الجنس") + "</dt><dd>" + em.age + " " + tf("ans", "سنة") + " · " + esc(sexeLabel(em.sexe)) + "</dd>" +
      "<dt>" + tf("Motif d'arrivée", "سبب الوصول") + "</dt><dd>" + esc(em.motif) + "</dd>" +
      "<dt>" + tf("Arrivée", "الوصول") + "</dt><dd>" + esc(em.arrivee) +
        (em.statut === "attente" ? " · " + tf("attente", "انتظار") + " " + waitLabel(wait) : "") + "</dd>" +
      (em.statut === "oriente"
        ? "<dt>" + tf("Orientation", "التوجيه") + "</dt><dd>" + esc(tf(dispoLabel(em.dispo).fr, dispoLabel(em.dispo).ar)) + "</dd>"
        : "") +
    "</dl>";

    /* actions selon le statut */
    if (em.statut !== "oriente") {
      html += '<div class="pd-tabs-title">' + tf("Actions", "الإجراءات") + "</div>";
      html += '<div class="em-actions">';
      if (em.statut === "attente") {
        html += '<button class="btn btn-primary" id="em-take">' + icon("stethoscope", 16) + tf("Prendre en charge", "بدء المعالجة") + "</button>";
      }
      html += '<div class="em-orient-title">' + tf("Orienter le patient", "توجيه المريض") + "</div>";
      html += '<div class="em-orient">' +
        '<button class="btn btn-ghost" data-orient="hospitalisation">' + icon("hospitalises", 16) + tf("Hospitaliser", "إدخال للاستشفاء") + "</button>" +
        '<button class="btn btn-ghost" data-orient="sortie">' + icon("home", 16) + tf("Retour domicile", "العودة للمنزل") + "</button>" +
        '<button class="btn btn-ghost" data-orient="transfert">' + icon("transfer", 16) + tf("Transférer", "تحويل") + "</button>" +
      "</div>";
      html += "</div>";
    } else {
      html += '<div class="em-closed">' + icon("check", 16) + tf("Épisode clôturé.", "تم إغلاق الحالة.") + "</div>";
    }

    UI.openDrawer(html);
    document.getElementById("em-x").addEventListener("click", UI.closeDrawer);

    var take = document.getElementById("em-take");
    if (take) take.addEventListener("click", function () {
      D.emTakeCharge(em.id);
      UI.closeDrawer();
      refresh();
      UI.toast(tf("Patient pris en charge", "تم بدء المعالجة"));
    });

    document.querySelectorAll("[data-orient]").forEach(function (b) {
      b.addEventListener("click", function () {
        var dispo = b.getAttribute("data-orient");
        if (dispo === "hospitalisation") openHospit(em);
        else confirmOrient(em, dispo);
      });
    });
  }

  /* orientation simple (sortie / transfert) avec confirmation */
  function confirmOrient(em, dispo) {
    var msg = dispo === "sortie"
      ? tf("Confirmer le retour à domicile de " + em.nom + " ?", "تأكيد عودة " + em.nom + " إلى المنزل؟")
      : tf("Confirmer le transfert de " + em.nom + " ?", "تأكيد تحويل " + em.nom + "؟");
    if (!window.confirm(msg)) return;
    D.emOrient(em.id, dispo);
    UI.closeDrawer();
    refresh();
    UI.toast(dispo === "sortie"
      ? tf("Retour à domicile enregistré", "تم تسجيل العودة للمنزل")
      : tf("Transfert enregistré", "تم تسجيل التحويل"));
  }

  /* orientation vers l'hospitalisation : choix du lit libre */
  function openHospit(em) {
    var freeBeds = D.beds.filter(function (b) { return !b.patientId; });
    if (!freeBeds.length) { UI.toast(tf("Aucun lit disponible", "لا يوجد سرير متاح"), "warn"); return; }

    var bedOptions = freeBeds.map(function (b) {
      return '<option value="' + b.id + '">' + tf("Salle", "غرفة") + " " + b.salle + " · " + esc(b.lit) +
        " · " + esc(D.typeLabel(b.type, A.i18n.lang === "ar")) + "</option>";
    }).join("");

    var html =
      '<div class="af-drawer-head"><div><h3>' + tf("Hospitaliser", "إدخال للاستشفاء") + "</h3>" +
        '<div class="dsub">' + esc(em.nom) + " · " + esc(em.motif) + "</div></div>" +
        '<button class="af-x" id="hs-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<p class="hs-note">' + tf("Le patient sera admis en hospitalisation et retiré de la file des urgences.",
                                 "سيتم إدخال المريض للاستشفاء وإزالته من قائمة الطوارئ.") + "</p>" +
      '<form id="hospit-form">' +
        '<div class="af-field"><label>' + tf("Lit d'accueil", "سرير الاستقبال") + ' <span class="req">*</span></label><select id="hs-bed">' + bedOptions + "</select></div>" +
        '<div class="af-drawer-foot">' +
          '<button type="button" class="btn btn-ghost" id="hs-cancel">' + tf("Annuler", "إلغاء") + "</button>" +
          '<button type="submit" class="btn btn-primary">' + tf("Confirmer l'admission", "تأكيد الإدخال") + "</button>" +
        "</div>" +
      "</form>";

    UI.openDrawer(html);
    document.getElementById("hs-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("hs-cancel").addEventListener("click", UI.closeDrawer);
    document.getElementById("hospit-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var bedId = document.getElementById("hs-bed").value;
      var p = D.emAdmitToBed(em.id, bedId);
      UI.closeDrawer();
      refresh();
      refreshHospBadge();
      UI.toast(p
        ? tf(em.nom + " hospitalisé · lit occupé", "تم إدخال " + em.nom + " · شُغل السرير")
        : tf("Admission impossible", "تعذر الإدخال"), p ? "" : "warn");
    });
  }

  /* ---- nouvelle arrivée ---- */
  function openArrival() {
    var triOpts = [1, 2, 3, 4, 5].map(function (lv) {
      var m = D.triageMeta(lv);
      return '<option value="' + lv + '"' + (lv === 3 ? " selected" : "") + ">" + lv + " · " + esc(tf(m.fr, m.ar)) + "</option>";
    }).join("");

    var html =
      '<div class="af-drawer-head"><div><h3>' + tf("Nouvelle arrivée", "وصول جديد") + "</h3>" +
        '<div class="dsub">' + esc(svc()) + "</div></div>" +
        '<button class="af-x" id="ar-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<form id="arrival-form">' +
        '<div class="af-field"><label>' + tf("Nom complet du patient", "الاسم الكامل للمريض") + ' <span class="req">*</span></label><input id="ar-nom" required /></div>' +
        '<div class="af-form-grid">' +
          '<div class="af-field"><label>' + tf("Code dossier", "رقم الملف") + "</label><input id=\"ar-code\" placeholder=\"" + tf("auto", "تلقائي") + "\"/></div>" +
          '<div class="af-field"><label>' + tf("Âge", "العمر") + "</label><input id=\"ar-age\" type=\"number\" min=\"0\" max=\"18\"/></div>" +
          '<div class="af-field"><label>' + tf("Sexe", "الجنس") + '</label><select id="ar-sexe"><option value="M">' + tf("Garçon", "ذكر") + '</option><option value="F">' + tf("Fille", "أنثى") + "</option></select></div>" +
          '<div class="af-field"><label>' + tf("Niveau de triage", "مستوى الفرز") + '</label><select id="ar-tri">' + triOpts + "</select></div>" +
        "</div>" +
        '<div class="af-field"><label>' + tf("Motif d'arrivée", "سبب الوصول") + ' <span class="req">*</span></label><input id="ar-motif" required /></div>' +
        '<div class="af-drawer-foot">' +
          '<button type="button" class="btn btn-ghost" id="ar-cancel">' + tf("Annuler", "إلغاء") + "</button>" +
          '<button type="submit" class="btn btn-primary">' + tf("Enregistrer l'arrivée", "تسجيل الوصول") + "</button>" +
        "</div>" +
      "</form>";

    UI.openDrawer(html);
    document.getElementById("ar-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("ar-cancel").addEventListener("click", UI.closeDrawer);
    document.getElementById("arrival-form").addEventListener("submit", function (e) {
      e.preventDefault();
      D.registerArrival({
        nom: document.getElementById("ar-nom").value.trim(),
        code: document.getElementById("ar-code").value.trim(),
        age: document.getElementById("ar-age").value || "—",
        sexe: document.getElementById("ar-sexe").value,
        triage: document.getElementById("ar-tri").value,
        motif: document.getElementById("ar-motif").value.trim()
      });
      UI.closeDrawer();
      refresh();
      UI.toast(tf("Arrivée enregistrée · en attente", "تم تسجيل الوصول · في الانتظار"));
    });
  }

  /* ---- enregistrement du module ---- */
  A.modules.urgences = {
    render: function (root) { rootEl = root; renderInto(); }
  };
})();
