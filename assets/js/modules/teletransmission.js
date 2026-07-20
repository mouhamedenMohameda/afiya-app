/* =====================================================================
   Afiya — Module « Télétransmission » : envois vers le système national
   de santé (activité, décès, surveillance épidémiologique).
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function frDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }

  var seq = 1200;
  var envois = [
    { id: 1201, type: "activite",  periode: "Semaine 28", date: "2026-07-14", statut: "envoye",    nombre: 42 },
    { id: 1202, type: "deces",     periode: "Semaine 28", date: "2026-07-14", statut: "envoye",    nombre: 2 },
    { id: 1203, type: "epidemio",  periode: "Semaine 29", date: "2026-07-19", statut: "en_attente", nombre: 7 },
    { id: 1204, type: "activite",  periode: "Semaine 27", date: "2026-07-07", statut: "erreur",    nombre: 38 }
  ];

  var rootEl = null;

  function typeMeta(t) {
    return {
      activite: { fr: "Rapport d'activité", ar: "تقرير النشاط", ic: "dashboard" },
      deces:    { fr: "Déclaration de décès", ar: "التصريح بالوفيات", ic: "certificat" },
      epidemio: { fr: "Surveillance épidémiologique", ar: "الترصد الوبائي", ic: "surveillance" }
    }[t] || { fr: t, ar: t, ic: "cloud" };
  }
  function statutMeta(s) {
    return {
      envoye:     { fr: "Envoyé", ar: "أُرسل", tone: "ok", ic: "check" },
      en_attente: { fr: "En attente", ar: "في الانتظار", tone: "warn", ic: "clock" },
      erreur:     { fr: "Échec", ar: "فشل", tone: "bad", ic: "alert" }
    }[s] || { fr: s, ar: s, tone: "neutral", ic: "cloud" };
  }

  function counts() {
    var c = { envoye: 0, en_attente: 0, erreur: 0 };
    envois.forEach(function (e) { c[e.statut]++; });
    return c;
  }

  function render(root) {
    rootEl = root;
    var c = counts();
    var html = "";
    html += '<div class="toolbar">';
    html +=   '<div><h1 class="page-title">' + tf("Télétransmission", "الإرسال عن بُعد") + "</h1>" +
              '<p class="page-sub">' + tf("Échanges avec le système national de santé", "التبادل مع النظام الصحي الوطني") + "</p></div>";
    html +=   '<div class="tb-controls"><button class="btn btn-primary btn-sm" id="tt-new">' + icon("send", 15) + tf("Nouvelle télétransmission", "إرسال جديد") + "</button></div>";
    html +=   "</div>";

    html += '<div class="summary-chips">' +
      '<span class="sum-chip"><span class="d ok"></span>' + tf("Envoyés", "المُرسلة") + ' <span class="n">' + c.envoye + "</span></span>" +
      '<span class="sum-chip"><span class="d warn"></span>' + tf("En attente", "في الانتظار") + ' <span class="n">' + c.en_attente + "</span></span>" +
      (c.erreur ? '<span class="sum-chip"><span class="d bad"></span>' + tf("Échecs", "إخفاقات") + ' <span class="n">' + c.erreur + "</span></span>" : "") +
    "</div>";

    html += '<div class="rec-list">';
    envois.forEach(function (e) {
      var tm = typeMeta(e.type), sm = statutMeta(e.statut);
      html += '<div class="rec-row static">' +
        '<span class="rec-ic ' + (sm.tone === "bad" ? "bad" : sm.tone === "warn" ? "warn" : "") + '">' + icon(tm.ic, 18) + "</span>" +
        '<div class="rec-main"><div class="rec-title">' + esc(tf(tm.fr, tm.ar)) + "</div>" +
          '<div class="rec-sub">' + esc(e.periode) + " · " + e.nombre + " " + tf("enregistrements", "تسجيلات") + "</div></div>" +
        '<div class="rec-side"><span class="spill ' + sm.tone + '"><span class="d"></span>' + esc(tf(sm.fr, sm.ar)) + "</span>" +
          '<span class="rec-meta">' + esc(frDate(e.date)) + "</span></div>" +
        (e.statut === "erreur" ? '<button class="btn btn-ghost btn-sm tt-retry" data-id="' + e.id + '" style="margin-inline-start:10px">' + icon("refresh", 15) + tf("Relancer", "إعادة") + "</button>" : "") +
      "</div>";
    });
    html += "</div>";

    root.innerHTML = html;
    document.getElementById("tt-new").addEventListener("click", openNew);
    root.querySelectorAll(".tt-retry").forEach(function (b) {
      b.addEventListener("click", function () {
        var e = byId(parseInt(b.getAttribute("data-id"), 10));
        if (e) { e.statut = "en_attente"; render(rootEl); UI.toast(tf("Relance en cours…", "جارٍ إعادة الإرسال…")); }
      });
    });
  }
  function byId(id) { for (var i = 0; i < envois.length; i++) if (envois[i].id === id) return envois[i]; return null; }

  function openNew() {
    var typeOpts = ["activite", "deces", "epidemio"].map(function (t) { var m = typeMeta(t); return '<option value="' + t + '">' + esc(tf(m.fr, m.ar)) + "</option>"; }).join("");
    var html =
      '<div class="af-drawer-head"><div><h3>' + tf("Nouvelle télétransmission", "إرسال جديد") + "</h3>" +
        '<div class="dsub">' + tf("Vers le système national", "نحو النظام الوطني") + "</div></div>" +
        '<button class="af-x" id="ttn-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<form id="tt-form">' +
        '<div class="af-field"><label>' + tf("Type de transmission", "نوع الإرسال") + '</label><select id="ttn-type">' + typeOpts + "</select></div>" +
        '<div class="af-field"><label>' + tf("Période", "الفترة") + ' <span class="req">*</span></label><input id="ttn-periode" placeholder="' + tf("ex. Semaine 29", "مثال: الأسبوع 29") + '" required /></div>' +
        '<p class="hs-note">' + tf("Les données agrégées de la période seront préparées et transmises de façon sécurisée.",
                                   "سيتم تجهيز البيانات المجمّعة للفترة وإرسالها بشكل آمن.") + "</p>" +
        '<div class="af-drawer-foot">' +
          '<button type="button" class="btn btn-ghost" id="ttn-cancel">' + tf("Annuler", "إلغاء") + "</button>" +
          '<button type="submit" class="btn btn-primary">' + icon("send", 16) + tf("Transmettre", "إرسال") + "</button>" +
        "</div></form>";
    UI.openDrawer(html);
    document.getElementById("ttn-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("ttn-cancel").addEventListener("click", UI.closeDrawer);
    document.getElementById("tt-form").addEventListener("submit", function (e) {
      e.preventDefault();
      envois.unshift({ id: ++seq, type: document.getElementById("ttn-type").value,
        periode: document.getElementById("ttn-periode").value.trim(), date: D.today,
        statut: "en_attente", nombre: Math.floor(20 + Math.random() * 30) });
      UI.closeDrawer(); render(rootEl);
      UI.toast(tf("Télétransmission programmée", "تمت جدولة الإرسال"));
    });
  }

  A.modules.teletransmission = { render: render };
})();
