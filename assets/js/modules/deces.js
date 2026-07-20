/* =====================================================================
   Afiya — Module « Décès » : certificat de décès + liste (registre).
   Enregistre deux routes : "deces/certificat" et "deces/liste".
   Le registre est partagé via AFIYA.data.deaths.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function me() { return (A.config.utilisateur && A.config.utilisateur.nom) || ""; }
  function etab() { var e = A.config.etablissement || {}; return tf(e.fr, e.ar); }
  function frDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }
  function sexeLabel(s) { return s === "F" ? tf("Féminin", "أنثى") : tf("Masculin", "ذكر"); }

  /* ============================ CERTIFICAT ============================ */
  function renderCert(root) {
    var pats = D.patients.filter(function (p) { for (var i = 0; i < D.beds.length; i++) if (D.beds[i].patientId === p.id) return true; return false; });
    var patOpts = '<option value="">' + tf("— Saisie manuelle —", "— إدخال يدوي —") + "</option>" +
      pats.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nom) + " · " + esc(p.code) + "</option>"; }).join("");

    var html = "";
    html += '<div class="page-head"><h1 class="page-title">' + tf("Certificat de décès", "شهادة الوفاة") + "</h1>" +
      '<p class="page-sub">' + tf("Établir un certificat et l'inscrire au registre", "تحرير شهادة وتسجيلها في السجل") + "</p></div>";

    html += '<div class="cert-layout">';
    /* formulaire */
    html += '<form id="cert-form" class="cert-form-panel">' +
      '<div class="af-field"><label>' + tf("Reprendre un patient hospitalisé", "استرجاع مريض مقيم") + '</label><select id="cf-pat">' + patOpts + "</select></div>" +
      '<div class="af-field"><label>' + tf("Nom du défunt", "اسم المتوفى") + ' <span class="req">*</span></label><input id="cf-nom" required /></div>' +
      '<div class="af-form-grid">' +
        '<div class="af-field"><label>' + tf("Code dossier", "رقم الملف") + '</label><input id="cf-code" /></div>' +
        '<div class="af-field"><label>' + tf("Âge", "العمر") + '</label><input id="cf-age" type="number" min="0" max="120" /></div>' +
        '<div class="af-field"><label>' + tf("Sexe", "الجنس") + '</label><select id="cf-sexe"><option value="M">' + tf("Masculin", "ذكر") + '</option><option value="F">' + tf("Féminin", "أنثى") + "</option></select></div>" +
        '<div class="af-field"><label>' + tf("Date du décès", "تاريخ الوفاة") + ' <span class="req">*</span></label><input id="cf-date" type="date" value="' + D.today + '" required /></div>' +
        '<div class="af-field"><label>' + tf("Heure", "الساعة") + '</label><input id="cf-heure" type="time" /></div>' +
        '<div class="af-field"><label>' + tf("Lieu", "المكان") + '</label><input id="cf-lieu" value="' + esc(tf("Réanimation", "الإنعاش")) + '" /></div>' +
      "</div>" +
      '<div class="af-field"><label>' + tf("Cause immédiate", "السبب المباشر") + ' <span class="req">*</span></label><input id="cf-ci" required /></div>' +
      '<div class="af-field"><label>' + tf("Cause initiale (maladie à l\'origine)", "السبب الأصلي") + '</label><input id="cf-cinit" /></div>' +
      '<div class="af-field"><label>' + tf("Médecin déclarant", "الطبيب المصرّح") + '</label><input id="cf-med" value="' + esc(me()) + '" /></div>' +
      '<div class="cert-form-actions">' +
        '<button type="button" class="btn btn-ghost" id="cf-preview">' + icon("eye", 16) + tf("Aperçu", "معاينة") + "</button>" +
        '<button type="submit" class="btn btn-primary">' + icon("save", 16) + tf("Enregistrer au registre", "تسجيل في السجل") + "</button>" +
      "</div></form>";

    /* aperçu */
    html += '<div class="cert-preview-panel"><div class="cert" id="cert-doc">' + certDoc(sampleFromForm(null)) + "</div>" +
      '<button class="btn btn-ghost btn-sm" id="cf-print" style="margin-top:12px">' + icon("print", 15) + tf("Imprimer l\'aperçu", "طباعة المعاينة") + "</button></div>";
    html += "</div>";

    root.innerHTML = html;

    var patSel = document.getElementById("cf-pat");
    patSel.addEventListener("change", function () {
      var p = D.patient(parseInt(patSel.value, 10));
      if (!p) return;
      document.getElementById("cf-nom").value = p.nom;
      document.getElementById("cf-code").value = p.code;
      document.getElementById("cf-age").value = p.age;
      document.getElementById("cf-sexe").value = p.sexe;
    });
    document.getElementById("cf-preview").addEventListener("click", function () {
      document.getElementById("cert-doc").innerHTML = certDoc(readForm());
    });
    document.getElementById("cf-print").addEventListener("click", function () {
      document.getElementById("cert-doc").innerHTML = certDoc(readForm());
      UI.toast(tf("Impression du certificat…", "جارٍ طباعة الشهادة…"));
    });
    document.getElementById("cert-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = readForm();
      if (!f.nom || !f.causeImmediate) { UI.toast(tf("Champs obligatoires manquants", "حقول إلزامية ناقصة"), "warn"); return; }
      D.registerDeath(f);
      UI.toast(tf("Décès inscrit au registre", "تم تسجيل الوفاة في السجل"));
      location.hash = "#/deces/liste";
    });
  }

  function readForm() {
    function v(id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; }
    return {
      nom: v("cf-nom"), code: v("cf-code"), age: v("cf-age"), sexe: v("cf-sexe") || "M",
      date: v("cf-date") || D.today, heure: v("cf-heure"), lieu: v("cf-lieu"),
      causeImmediate: v("cf-ci"), causeInitiale: v("cf-cinit"),
      medecin: v("cf-med") || me()
    };
  }
  function sampleFromForm() {
    return { nom: "—", code: "—", age: "—", sexe: "M", date: D.today, heure: "—", lieu: "—", causeImmediate: "—", causeInitiale: "—", medecin: me() };
  }

  /* document certificat (bilingue selon la langue courante) */
  function certDoc(f) {
    return '<div class="cert-head">' +
        '<div class="cert-mark">' + icon("certificat", 26) + "</div>" +
        '<div><div class="cert-etab">' + esc(etab()) + "</div>" +
        '<div class="cert-title">' + tf("CERTIFICAT DE DÉCÈS", "شهادة الوفاة") + "</div></div>" +
      "</div>" +
      '<div class="cert-body">' +
        certRow(tf("Nom du défunt", "اسم المتوفى"), f.nom) +
        certRow(tf("N° de dossier", "رقم الملف"), f.code) +
        certRow(tf("Âge · Sexe", "العمر · الجنس"), (f.age || "—") + " " + tf("ans", "سنة") + " · " + sexeLabel(f.sexe)) +
        certRow(tf("Date et heure du décès", "تاريخ وساعة الوفاة"), frDate(f.date) + (f.heure ? " · " + f.heure : "")) +
        certRow(tf("Lieu du décès", "مكان الوفاة"), f.lieu) +
        certRow(tf("Cause immédiate", "السبب المباشر"), f.causeImmediate) +
        certRow(tf("Cause initiale", "السبب الأصلي"), f.causeInitiale) +
      "</div>" +
      '<div class="cert-foot">' +
        '<div class="cert-sign"><div class="cert-sign-lbl">' + tf("Médecin déclarant", "الطبيب المصرّح") + "</div>" +
          '<div class="cert-sign-val">' + esc(f.medecin || "—") + "</div>" +
          '<div class="cert-sign-line">' + tf("Signature et cachet", "التوقيع والختم") + "</div></div>" +
        '<div class="cert-date">' + tf("Fait le", "حُرّر في") + " " + frDate(f.date) + "</div>" +
      "</div>";
  }
  function certRow(label, val) {
    return '<div class="cert-row"><div class="cert-l">' + esc(label) + '</div><div class="cert-v">' + esc(val || "—") + "</div></div>";
  }

  /* ============================== LISTE ============================== */
  function renderListe(root) {
    var state = renderListe._state || (renderListe._state = { search: "" });
    var html = "";
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Liste des décès", "قائمة الوفيات") + "</h1>" +
              '<p class="page-sub">' + tf("Registre du service", "سجل القسم") + " · " + D.deaths.length + " " + tf("enregistrements", "تسجيلات") + "</p></div>";
    html +=   '<div class="tb-controls">';
    html +=     '<div class="field-search">' + icon("search", 16) +
                '<input type="text" id="dl-search" placeholder="' + tf("Rechercher…", "بحث…") + '" value="' + esc(state.search) + '"/></div>';
    html +=     '<button class="btn btn-primary btn-sm" id="dl-new">' + icon("plus", 15) + tf("Nouveau certificat", "شهادة جديدة") + "</button>";
    html +=   "</div></div>";

    var q = state.search.trim().toLowerCase();
    var list = D.deaths.filter(function (d) {
      if (!q) return true;
      return (d.nom + " " + d.code + " " + d.causeImmediate + " " + d.medecin).toLowerCase().indexOf(q) !== -1;
    });

    if (!list.length) html += '<div class="empty">' + tf("Aucun décès enregistré.", "لا توجد وفيات مسجلة.") + "</div>";
    else {
      html += '<div class="rec-list">';
      list.forEach(function (d) {
        html += '<div class="rec-row" data-id="' + d.id + '">' +
          '<span class="rec-ic">' + icon("certificat", 18) + "</span>" +
          '<div class="rec-main"><div class="rec-title">' + esc(d.nom) + ' <span class="rec-code">· ' + esc(d.code) + "</span></div>" +
            '<div class="rec-sub">' + esc(d.causeImmediate) + "</div></div>" +
          '<div class="rec-side"><span class="rec-meta">' + esc(frDate(d.date)) + (d.heure ? " · " + esc(d.heure) : "") + "</span>" +
            '<span class="rec-meta">' + esc(d.medecin) + "</span></div></div>";
      });
      html += "</div>";
    }
    root.innerHTML = html;

    var s = document.getElementById("dl-search");
    s.addEventListener("input", function () {
      state.search = s.value; var pos = s.selectionStart; renderListe(root);
      var ns = document.getElementById("dl-search"); if (ns) { ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) {} }
    });
    document.getElementById("dl-new").addEventListener("click", function () { location.hash = "#/deces/certificat"; });
    root.querySelectorAll("[data-id]").forEach(function (row) {
      row.addEventListener("click", function () { openDeathDetail(byId(parseInt(row.getAttribute("data-id"), 10))); });
    });
  }
  function byId(id) { for (var i = 0; i < D.deaths.length; i++) if (D.deaths[i].id === id) return D.deaths[i]; return null; }

  function openDeathDetail(d) {
    if (!d) return;
    var html = '<div class="af-drawer-head"><div><h3>' + tf("Certificat", "الشهادة") + "</h3><div class=\"dsub\">" + esc(d.nom) + "</div></div>" +
      '<button class="af-x" id="dd-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>';
    html += '<div class="cert cert-in-drawer">' + certDoc(d) + "</div>";
    html += '<div class="af-drawer-foot"><button class="btn btn-ghost" id="dd-print">' + icon("print", 16) + tf("Imprimer", "طباعة") + "</button></div>";
    UI.openDrawer(html);
    document.getElementById("dd-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("dd-print").addEventListener("click", function () { UI.toast(tf("Impression du certificat…", "جارٍ طباعة الشهادة…")); });
  }

  A.modules["deces/certificat"] = { render: renderCert };
  A.modules["deces/liste"] = { render: renderListe };
})();
