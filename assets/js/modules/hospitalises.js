/* =====================================================================
   Afiya — Module « Hospitalisés » (grille des lits, façon OLIVEX)
   Fonctionnel : filtres, recherche, admission, sortie, détail patient.
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
  function svc() { var s = (A.config && A.config.service) || { fr: "Hospitalisation", ar: "الاستشفاء" }; return tf(s.fr, s.ar); }

  /* ---- libellés cliniques ---- */
  function etatMeta(etat) {
    return {
      stable:       { fr: "Stable",       ar: "مستقر",  tone: "ok",   css: "st-stable" },
      surveillance: { fr: "Surveillance", ar: "مراقبة",  tone: "warn", css: "st-surveillance" },
      critique:     { fr: "Critique",     ar: "حرج",     tone: "bad",  css: "st-critique" }
    }[etat] || { fr: etat, ar: etat, tone: "neutral", css: "" };
  }
  function sexeLabel(s) { return s === "F" ? tf("Fille", "أنثى") : tf("Garçon", "ذكر"); }
  function bedLabel(bed) { return tf("Salle", "غرفة") + " " + bed.salle + " · " + bed.lit; }
  function sinceLabel(p) {
    var d = D.daysSince(p.admis);
    if (d === 0) return tf("Admis aujourd'hui", "دخل اليوم");
    if (d === 1) return tf("Depuis 1 jour", "منذ يوم");
    return tf("Depuis " + d + " jours", "منذ " + d + " أيام");
  }

  /* ---- carte d'un lit ---- */
  function cardHtml(bed) {
    var p = D.bedPatient(bed);
    var type = '<span class="bed-type">' + esc(D.typeLabel(bed.type, A.i18n.lang === "ar")) + "</span>";
    if (!p) {
      return '<div class="bed-card st-libre" data-bed="' + bed.id + '" data-free="1">' +
        '<div class="bed-head"><span class="bed-label">' + esc(bedLabel(bed)) + "</span>" + type + "</div>" +
        '<div class="bed-free-body">' +
          '<span class="bed-free-plus">' + icon("plus", 20) + "</span>" +
          '<span class="lbl">' + tf("Lit disponible", "سرير متاح") + "</span>" +
        "</div></div>";
    }
    var m = etatMeta(p.etat);
    return '<div class="bed-card ' + m.css + '" data-bed="' + bed.id + '">' +
      '<div class="bed-head"><span class="bed-label">' + esc(bedLabel(bed)) + "</span>" + type + "</div>" +
      '<div class="bed-patient">' +
        '<span class="bed-av">' + esc(UI.initials(p.nom)) + "</span>" +
        "<div style=\"min-width:0\">" +
          '<div class="bed-pname">' + esc(p.nom) + "</div>" +
          '<div class="bed-pmeta">' + esc(p.code) + " · " + p.age + " " + tf("ans", "سنة") + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="bed-motif">' + esc(p.motif) + "</div>" +
      '<div class="bed-foot">' +
        '<span class="spill ' + m.tone + '"><span class="d"></span>' + esc(tf(m.fr, m.ar)) + "</span>" +
        '<span class="bed-since">' + esc(sinceLabel(p)) + "</span>" +
      "</div></div>";
  }

  /* ---- rendu principal ---- */
  function renderInto() {
    var c = D.counts();
    var seg = [
      { k: "tous",     fr: "Tous",     ar: "الكل" },
      { k: "occupes",  fr: "Occupés",  ar: "مشغولة" },
      { k: "libres",   fr: "Libres",   ar: "متاحة" }
    ];

    var html = "";
    /* toolbar */
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Hospitalisés", "المرضى المقيمون") + "</h1>" +
              '<p class="page-sub">' + esc(svc()) + "</p></div>";
    html +=   '<div class="tb-controls">';
    html +=     '<div class="field-search">' + icon("search", 16) +
                '<input type="text" id="bed-search" placeholder="' + tf("Rechercher un patient…", "بحث عن مريض…") + '" value="' + esc(state.search) + '"/></div>';
    html +=     '<div class="seg">' + seg.map(function (s) {
                  return '<button class="seg-btn' + (state.filter === s.k ? " active" : "") + '" data-filter="' + s.k + '">' + tf(s.fr, s.ar) + "</button>";
                }).join("") + "</div>";
    html +=     '<button class="btn btn-primary btn-sm" id="admit-btn">' + icon("plus", 15) + tf("Admettre", "إدخال") + "</button>";
    html +=   "</div></div>";

    /* résumé */
    html += '<div class="summary-chips">' +
      '<span class="sum-chip"><span class="d free"></span>' + tf("Libres", "متاحة") + ' <span class="n">' + c.free + "</span></span>" +
      '<span class="sum-chip"><span class="d ok"></span>' + tf("Occupés", "مشغولة") + ' <span class="n">' + c.occ + "</span></span>" +
      '<span class="sum-chip"><span class="d bad"></span>' + tf("Cas critiques", "حالات حرجة") + ' <span class="n">' + c.critique + "</span></span>" +
      '<span class="sum-chip">' + tf("Capacité", "السعة") + ' <span class="n">' + c.total + "</span></span>" +
    "</div>";

    /* grille filtrée */
    var q = state.search.trim().toLowerCase();
    var list = D.beds.filter(function (b) {
      var p = D.bedPatient(b);
      if (state.filter === "occupes" && !p) return false;
      if (state.filter === "libres" && p) return false;
      if (q) {
        var hay = (bedLabel(b) + " " + (p ? p.nom + " " + p.code + " " + p.motif : "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (!list.length) {
      html += '<div class="empty">' + tf("Aucun lit ne correspond.", "لا يوجد سرير مطابق.") + "</div>";
    } else {
      html += '<div class="bed-grid">' + list.map(cardHtml).join("") + "</div>";
    }

    rootEl.innerHTML = html;
    bind();
  }

  function bind() {
    var s = document.getElementById("bed-search");
    s.addEventListener("input", function () {
      state.search = s.value;
      var pos = s.selectionStart;
      renderInto();
      var ns = document.getElementById("bed-search");
      ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) {}
    });
    rootEl.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () { state.filter = b.getAttribute("data-filter"); renderInto(); });
    });
    document.getElementById("admit-btn").addEventListener("click", function () { openAdmit(null); });
    rootEl.querySelectorAll("[data-bed]").forEach(function (card) {
      card.addEventListener("click", function () {
        var bed = bedById(card.getAttribute("data-bed"));
        if (card.getAttribute("data-free")) openAdmit(bed.id);
        else openDetail(bed);
      });
    });
  }

  function bedById(id) {
    for (var i = 0; i < D.beds.length; i++) if (D.beds[i].id === id) return D.beds[i];
    return null;
  }

  function refresh() {
    renderInto();
    /* met à jour le badge de la sidebar */
    var badge = document.querySelector('#nav [data-route="hospitalises"] .ni-badge');
    if (badge) badge.textContent = D.counts().occ;
  }

  /* ---- détail patient ---- */
  function openDetail(bed) {
    var p = D.bedPatient(bed);
    if (!p) return;
    var m = etatMeta(p.etat);
    var tabs = [
      { ic: "surveillance", fr: "Fiche de surveillance", ar: "ورقة المراقبة" },
      { ic: "treatment",    fr: "Traitements",            ar: "العلاجات" },
      { ic: "explorations", fr: "Résultats d'analyses",   ar: "نتائج التحاليل" },
      { ic: "dossiers",     fr: "Documents",              ar: "الوثائق" }
    ];

    var html = "";
    html += '<div class="af-drawer-head"><div>' +
      '<div class="pd-head"><span class="pd-av">' + esc(UI.initials(p.nom)) + "</span>" +
      "<div><div class=\"pd-name\">" + esc(p.nom) + "</div><div class=\"pd-code\">" +
        tf("Dossier", "ملف") + " " + esc(p.code) + " · " + esc(bedLabel(bed)) + "</div></div></div>" +
      "</div>" +
      '<button class="af-x" id="pd-x" aria-label="Fermer">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
      "</div>";

    html += '<div style="margin:6px 0 2px"><span class="spill ' + m.tone + '"><span class="d"></span>' + esc(tf(m.fr, m.ar)) + "</span></div>";

    html += '<dl class="pd-list">' +
      "<dt>" + tf("Âge · Sexe", "العمر · الجنس") + "</dt><dd>" + p.age + " " + tf("ans", "سنة") + " · " + esc(sexeLabel(p.sexe)) + "</dd>" +
      "<dt>" + tf("Lit", "السرير") + "</dt><dd>" + esc(bedLabel(bed)) + " · " + esc(D.typeLabel(bed.type, A.i18n.lang === "ar")) + "</dd>" +
      "<dt>" + tf("Motif", "السبب") + "</dt><dd>" + esc(p.motif) + "</dd>" +
      "<dt>" + tf("Médecin", "الطبيب") + "</dt><dd>" + esc(p.medecin) + "</dd>" +
      "<dt>" + tf("Admis le", "تاريخ الدخول") + "</dt><dd>" + esc(frDate(p.admis)) + " · " + esc(sinceLabel(p)) + "</dd>" +
    "</dl>";

    html += '<div class="pd-actions">' +
      '<button class="btn btn-ghost btn-sm" data-soon="transfer">' + icon("transfer", 16) + tf("Transférer", "تحويل") + "</button>" +
      '<button class="btn btn-ghost btn-sm" data-soon="swap">' + icon("swap", 16) + tf("Permuter les lits", "تبديل الأسرّة") + "</button>" +
    "</div>";

    html += '<div class="pd-tabs-title">' + tf("Dossier de réanimation", "ملف الإنعاش") + "</div>";
    html += '<div class="pd-tabs">' + tabs.map(function (t) {
      return '<button class="pd-tab" data-soon="tab">' + icon(t.ic, 16) + esc(tf(t.fr, t.ar)) + "</button>";
    }).join("") + "</div>";

    html += '<div class="af-drawer-foot">' +
      '<button class="btn btn-danger" id="pd-discharge">' + icon("exit", 16) + tf("Déclarer la sortie", "تسجيل الخروج") + "</button>" +
    "</div>";

    UI.openDrawer(html);
    document.getElementById("pd-x").addEventListener("click", UI.closeDrawer);
    document.querySelectorAll("[data-soon]").forEach(function (b) {
      b.addEventListener("click", function () {
        UI.toast(tf("Cette fonction arrive bientôt", "هذه الوظيفة قادمة قريباً"), "warn");
      });
    });
    document.getElementById("pd-discharge").addEventListener("click", function () {
      var ok = window.confirm(tf(
        "Confirmer la sortie de " + p.nom + " ? Le lit " + bed.lit + " sera libéré.",
        "تأكيد خروج " + p.nom + "؟ سيتم تحرير السرير " + bed.lit + "."
      ));
      if (!ok) return;
      D.discharge(bed.id);
      UI.closeDrawer();
      refresh();
      UI.toast(tf("Sortie enregistrée · lit libéré", "تم تسجيل الخروج · تحرّر السرير"));
    });
  }

  /* ---- admission ---- */
  function openAdmit(preselectBedId) {
    var freeBeds = D.beds.filter(function (b) { return !b.patientId; });
    if (!freeBeds.length) { UI.toast(tf("Aucun lit disponible", "لا يوجد سرير متاح"), "warn"); return; }

    var bedOptions = freeBeds.map(function (b) {
      var sel = b.id === preselectBedId ? " selected" : "";
      return '<option value="' + b.id + '"' + sel + ">" + esc(bedLabel(b)) + " · " + esc(D.typeLabel(b.type, A.i18n.lang === "ar")) + "</option>";
    }).join("");

    var etatOpts = [
      { v: "stable", fr: "Stable", ar: "مستقر" },
      { v: "surveillance", fr: "Surveillance", ar: "مراقبة" },
      { v: "critique", fr: "Critique", ar: "حرج" }
    ].map(function (o) { return '<option value="' + o.v + '">' + esc(tf(o.fr, o.ar)) + "</option>"; }).join("");

    var html =
      '<div class="af-drawer-head"><div><h3>' + tf("Nouvelle admission", "إدخال جديد") + "</h3>" +
        '<div class="dsub">' + esc(svc()) + "</div></div>" +
        '<button class="af-x" id="ad-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<form id="admit-form">' +
        '<div class="af-field"><label>' + tf("Lit", "السرير") + ' <span class="req">*</span></label><select id="ad-bed">' + bedOptions + "</select></div>" +
        '<div class="af-field"><label>' + tf("Nom complet du patient", "الاسم الكامل للمريض") + ' <span class="req">*</span></label><input id="ad-nom" required /></div>' +
        '<div class="af-form-grid">' +
          '<div class="af-field"><label>' + tf("Code dossier", "رقم الملف") + "</label><input id=\"ad-code\" placeholder=\"" + tf("auto", "تلقائي") + "\"/></div>" +
          '<div class="af-field"><label>' + tf("Âge", "العمر") + "</label><input id=\"ad-age\" type=\"number\" min=\"0\" max=\"18\"/></div>" +
          '<div class="af-field"><label>' + tf("Sexe", "الجنس") + '</label><select id="ad-sexe"><option value="M">' + tf("Garçon", "ذكر") + '</option><option value="F">' + tf("Fille", "أنثى") + "</option></select></div>" +
          '<div class="af-field"><label>' + tf("État clinique", "الحالة السريرية") + '</label><select id="ad-etat">' + etatOpts + "</select></div>" +
        "</div>" +
        '<div class="af-field"><label>' + tf("Motif d'admission", "سبب الدخول") + ' <span class="req">*</span></label><input id="ad-motif" required /></div>' +
        '<div class="af-field"><label>' + tf("Médecin", "الطبيب") + '</label><input id="ad-medecin" value="' + esc((A.config.utilisateur && A.config.utilisateur.nom) || "") + '"/></div>' +
        '<div class="af-drawer-foot">' +
          '<button type="button" class="btn btn-ghost" id="ad-cancel">' + tf("Annuler", "إلغاء") + "</button>" +
          '<button type="submit" class="btn btn-primary">' + tf("Admettre le patient", "إدخال المريض") + "</button>" +
        "</div>" +
      "</form>";

    UI.openDrawer(html);
    document.getElementById("ad-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("ad-cancel").addEventListener("click", UI.closeDrawer);
    document.getElementById("admit-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var bedId = document.getElementById("ad-bed").value;
      var fields = {
        nom: document.getElementById("ad-nom").value.trim(),
        code: document.getElementById("ad-code").value.trim(),
        age: document.getElementById("ad-age").value || "—",
        sexe: document.getElementById("ad-sexe").value,
        etat: document.getElementById("ad-etat").value,
        motif: document.getElementById("ad-motif").value.trim(),
        medecin: document.getElementById("ad-medecin").value.trim()
      };
      D.admit(bedId, fields);
      UI.closeDrawer();
      refresh();
      UI.toast(tf("Patient admis · lit occupé", "تم إدخال المريض · شُغل السرير"));
    });
  }

  function frDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }

  /* ---- enregistrement du module ---- */
  A.modules.hospitalises = {
    render: function (root) { rootEl = root; renderInto(); }
  };
})();
