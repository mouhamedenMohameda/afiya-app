/* =====================================================================
   Afiya — Module « Mes dossiers »
   Patients hospitalisés dont le médecin connecté est responsable.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };

  var state = { scope: "moi", search: "" };
  var rootEl = null;

  function me() { return (A.config.utilisateur && A.config.utilisateur.nom) || ""; }
  function bedOf(pid) { for (var i = 0; i < D.beds.length; i++) if (D.beds[i].patientId === pid) return D.beds[i]; return null; }
  function etatMeta(etat) {
    return {
      stable:       { fr: "Stable", ar: "مستقر", tone: "ok" },
      surveillance: { fr: "Surveillance", ar: "مراقبة", tone: "warn" },
      critique:     { fr: "Critique", ar: "حرج", tone: "bad" }
    }[etat] || { fr: etat, ar: etat, tone: "neutral" };
  }
  function sexeLabel(s) { return s === "F" ? tf("Fille", "أنثى") : tf("Garçon", "ذكر"); }
  function frDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }

  function hospitalised() {
    return D.patients.filter(function (p) { return bedOf(p.id); });
  }

  function renderInto() {
    var all = hospitalised();
    var mine = all.filter(function (p) { return p.medecin === me(); });

    var html = "";
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Mes dossiers", "ملفاتي") + "</h1>" +
              '<p class="page-sub">' + esc(me()) + "</p></div>";
    html +=   '<div class="tb-controls">';
    html +=     '<div class="field-search">' + icon("search", 16) +
                '<input type="text" id="dos-search" placeholder="' + tf("Rechercher un dossier…", "بحث عن ملف…") + '" value="' + esc(state.search) + '"/></div>';
    html +=     '<div class="seg">' +
                  '<button class="seg-btn' + (state.scope === "moi" ? " active" : "") + '" data-scope="moi">' + tf("Mes patients", "مرضاي") + " (" + mine.length + ")</button>" +
                  '<button class="seg-btn' + (state.scope === "service" ? " active" : "") + '" data-scope="service">' + tf("Tout le service", "كل القسم") + " (" + all.length + ")</button>" +
                "</div>";
    html +=   "</div></div>";

    var base = state.scope === "moi" ? mine : all;
    var q = state.search.trim().toLowerCase();
    var list = base.filter(function (p) {
      if (!q) return true;
      return (p.nom + " " + p.code + " " + p.motif).toLowerCase().indexOf(q) !== -1;
    });

    if (!list.length) {
      html += '<div class="empty">' + tf("Aucun dossier à afficher.", "لا يوجد ملف للعرض.") + "</div>";
    } else {
      html += '<div class="rec-list">';
      list.forEach(function (p) {
        var b = bedOf(p.id), m = etatMeta(p.etat);
        html += '<div class="rec-row" data-pid="' + p.id + '">' +
          '<span class="rec-ic">' + esc(A.ui.initials(p.nom)) + "</span>" +
          '<div class="rec-main"><div class="rec-title">' + esc(p.nom) +
            ' <span class="rec-code">· ' + esc(p.code) + "</span></div>" +
            '<div class="rec-sub">' + esc(p.motif) + "</div></div>" +
          '<div class="rec-side">' +
            '<span class="spill ' + m.tone + '"><span class="d"></span>' + esc(tf(m.fr, m.ar)) + "</span>" +
            '<span class="rec-meta">' + tf("Salle", "غرفة") + " " + b.salle + " · " + esc(b.lit) + "</span>" +
          "</div></div>";
      });
      html += "</div>";
    }

    rootEl.innerHTML = html;
    bind();
  }

  function bind() {
    var s = document.getElementById("dos-search");
    s.addEventListener("input", function () {
      state.search = s.value;
      var pos = s.selectionStart;
      renderInto();
      var ns = document.getElementById("dos-search");
      ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) {}
    });
    rootEl.querySelectorAll("[data-scope]").forEach(function (b) {
      b.addEventListener("click", function () { state.scope = b.getAttribute("data-scope"); renderInto(); });
    });
    rootEl.querySelectorAll("[data-pid]").forEach(function (row) {
      row.addEventListener("click", function () { openDetail(D.patient(parseInt(row.getAttribute("data-pid"), 10))); });
    });
  }

  function openDetail(p) {
    if (!p) return;
    var b = bedOf(p.id), m = etatMeta(p.etat);
    var html = "";
    html += '<div class="af-drawer-head"><div>' +
      '<div class="pd-head"><span class="pd-av">' + esc(A.ui.initials(p.nom)) + "</span>" +
      "<div><div class=\"pd-name\">" + esc(p.nom) + "</div><div class=\"pd-code\">" + tf("Dossier", "ملف") + " " + esc(p.code) + "</div></div></div></div>" +
      '<button class="af-x" id="dos-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>';
    html += '<div style="margin:6px 0 2px"><span class="spill ' + m.tone + '"><span class="d"></span>' + esc(tf(m.fr, m.ar)) + "</span></div>";
    html += '<dl class="pd-list">' +
      "<dt>" + tf("Âge · Sexe", "العمر · الجنس") + "</dt><dd>" + p.age + " " + tf("ans", "سنة") + " · " + esc(sexeLabel(p.sexe)) + "</dd>" +
      "<dt>" + tf("Lit", "السرير") + "</dt><dd>" + (b ? tf("Salle", "غرفة") + " " + b.salle + " · " + esc(b.lit) : "—") + "</dd>" +
      "<dt>" + tf("Motif", "السبب") + "</dt><dd>" + esc(p.motif) + "</dd>" +
      "<dt>" + tf("Médecin", "الطبيب") + "</dt><dd>" + esc(p.medecin) + "</dd>" +
      "<dt>" + tf("Admis le", "تاريخ الدخول") + "</dt><dd>" + esc(frDate(p.admis)) + "</dd>" +
    "</dl>";
    html += '<div class="af-drawer-foot"><button class="btn btn-primary" id="dos-open">' + icon("hospitalises", 16) + tf("Ouvrir dans Hospitalisés", "فتح في المرضى المقيمين") + "</button></div>";
    UI.openDrawer(html);
    document.getElementById("dos-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("dos-open").addEventListener("click", function () { UI.closeDrawer(); location.hash = "#/hospitalises"; });
  }

  A.modules.dossiers = { render: function (root) { rootEl = root; renderInto(); } };
})();
