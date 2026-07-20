/* =====================================================================
   Afiya — Module « Surveillance » : constantes vitales.
   Vue par patient hospitalisé, derniers relevés + saisie d'un relevé.
   ===================================================================== */
(function () {
  "use strict";
  var A = window.AFIYA;
  A.modules = A.modules || {};

  var D = A.data, UI = A.ui, icon = A.icon;
  function tf(fr, ar) { return A.i18n.tf(fr, ar); }
  var esc = function (s) { return A.ui.esc(s); };
  function bedOf(pid) { for (var i = 0; i < D.beds.length; i++) if (D.beds[i].patientId === pid) return D.beds[i]; return null; }

  /* relevés par patientId : { h:"HH:MM", fc, fr, spo2, taS, taD, temp } */
  var vitals = {
    1: [ { h: "06:00", fc: 128, fr: 34, spo2: 94, taS: 98, taD: 60, temp: 37.8 },
         { h: "10:00", fc: 122, fr: 30, spo2: 96, taS: 100, taD: 62, temp: 37.4 },
         { h: "14:00", fc: 118, fr: 28, spo2: 97, taS: 102, taD: 64, temp: 37.1 } ],
    2: [ { h: "06:00", fc: 172, fr: 44, spo2: 90, taS: 78, taD: 44, temp: 39.4 },
         { h: "10:00", fc: 168, fr: 42, spo2: 91, taS: 80, taD: 46, temp: 39.1 },
         { h: "14:00", fc: 164, fr: 40, spo2: 92, taS: 82, taD: 48, temp: 38.8 } ],
    5: [ { h: "08:00", fc: 96, fr: 22, spo2: 98, taS: 110, taD: 68, temp: 37.0 },
         { h: "13:00", fc: 88, fr: 20, spo2: 99, taS: 112, taD: 70, temp: 36.8 } ],
    9: [ { h: "07:00", fc: 158, fr: 40, spo2: 89, taS: 74, taD: 40, temp: 38.9 },
         { h: "12:00", fc: 150, fr: 38, spo2: 91, taS: 78, taD: 44, temp: 38.5 } ]
  };

  var rootEl = null;

  /* seuils simples (pédiatrie, tolérance large) -> "", "warn", "bad" */
  function tone(k, v) {
    v = parseFloat(v);
    if (isNaN(v)) return "";
    if (k === "spo2") return v < 92 ? "bad" : (v < 95 ? "warn" : "ok");
    if (k === "temp") return (v >= 39 || v < 35.5) ? "bad" : (v >= 38 || v < 36) ? "warn" : "ok";
    if (k === "fc") return (v > 170 || v < 70) ? "bad" : (v > 150 || v < 80) ? "warn" : "ok";
    if (k === "fr") return (v > 45 || v < 12) ? "bad" : (v > 38 || v < 16) ? "warn" : "ok";
    return "";
  }
  function last(pid) { var a = vitals[pid]; return a && a.length ? a[a.length - 1] : null; }
  function surveilled() { return D.patients.filter(function (p) { return bedOf(p.id); }); }

  function metric(k, val, unit) {
    var t = tone(k, val);
    return '<div class="vit-metric ' + t + '"><div class="vm-val">' + (val != null ? val : "—") +
      '<span class="vm-unit">' + unit + "</span></div>" +
      '<div class="vm-lbl">' + labelOf(k) + "</div></div>";
  }
  function labelOf(k) {
    return {
      fc: tf("FC", "نبض"), fr: tf("FR", "تنفس"), spo2: "SpO₂",
      ta: tf("TA", "ضغط"), temp: tf("T°", "حرارة")
    }[k];
  }

  function render(root) {
    rootEl = root;
    var list = surveilled();
    var html = "";
    html += '<div class="page-head"><h1 class="page-title">' + tf("Surveillance", "المراقبة") + "</h1>" +
      '<p class="page-sub">' + tf("Constantes vitales des patients hospitalisés", "العلامات الحيوية للمرضى المقيمين") + "</p></div>";

    if (!list.length) { html += '<div class="empty">' + tf("Aucun patient à surveiller.", "لا يوجد مريض للمراقبة.") + "</div>"; root.innerHTML = html; return; }

    html += '<div class="vit-grid">';
    list.forEach(function (p) {
      var b = bedOf(p.id), lv = last(p.id);
      html += '<div class="vit-card" data-pid="' + p.id + '">' +
        '<div class="vit-head"><span class="vit-av">' + esc(A.ui.initials(p.nom)) + "</span>" +
          '<div style="min-width:0"><div class="vit-name">' + esc(p.nom) + "</div>" +
          '<div class="vit-bed">' + tf("Salle", "غرفة") + " " + b.salle + " · " + esc(b.lit) + "</div></div>" +
          (lv ? '<span class="vit-time">' + esc(lv.h) + "</span>" : "") +
        "</div>";
      if (lv) {
        html += '<div class="vit-metrics">' +
          metric("fc", lv.fc, "") +
          metric("spo2", lv.spo2, "%") +
          metric("temp", lv.temp, "°") +
          metric("fr", lv.fr, "") +
          '<div class="vit-metric"><div class="vm-val" style="font-size:16px">' + lv.taS + "/" + lv.taD + "</div><div class=\"vm-lbl\">" + labelOf("ta") + "</div></div>" +
        "</div>";
      } else {
        html += '<div class="mini-empty">' + tf("Aucun relevé.", "لا يوجد قياس.") + "</div>";
      }
      html += "</div>";
    });
    html += "</div>";

    root.innerHTML = html;
    root.querySelectorAll("[data-pid]").forEach(function (card) {
      card.addEventListener("click", function () { openDetail(D.patient(parseInt(card.getAttribute("data-pid"), 10))); });
    });
  }

  function openDetail(p) {
    if (!p) return;
    var b = bedOf(p.id), rows = (vitals[p.id] || []).slice().reverse();
    var html = "";
    html += '<div class="af-drawer-head"><div>' +
      '<div class="pd-head"><span class="pd-av">' + esc(A.ui.initials(p.nom)) + "</span>" +
      "<div><div class=\"pd-name\">" + esc(p.nom) + "</div><div class=\"pd-code\">" + tf("Salle", "غرفة") + " " + b.salle + " · " + esc(b.lit) + "</div></div></div></div>" +
      '<button class="af-x" id="sv-x"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>';

    html += '<div class="pd-tabs-title">' + tf("Relevés récents", "القياسات الأخيرة") + "</div>";
    html += '<div class="vit-table-wrap"><table class="vit-table"><thead><tr>' +
      "<th>" + tf("Heure", "الساعة") + "</th><th>FC</th><th>FR</th><th>SpO₂</th><th>TA</th><th>T°</th></tr></thead><tbody>";
    if (!rows.length) html += '<tr><td colspan="6" class="mini-empty">' + tf("Aucun relevé.", "لا يوجد قياس.") + "</td></tr>";
    else rows.forEach(function (v) {
      html += "<tr><td class=\"vt-h\">" + esc(v.h) + "</td>" +
        '<td class="' + tone("fc", v.fc) + '">' + v.fc + "</td>" +
        '<td class="' + tone("fr", v.fr) + '">' + v.fr + "</td>" +
        '<td class="' + tone("spo2", v.spo2) + '">' + v.spo2 + "</td>" +
        "<td>" + v.taS + "/" + v.taD + "</td>" +
        '<td class="' + tone("temp", v.temp) + '">' + v.temp + "</td></tr>";
    });
    html += "</tbody></table></div>";

    html += '<div class="pd-tabs-title">' + tf("Nouveau relevé", "قياس جديد") + "</div>";
    html += '<form id="sv-form"><div class="af-form-grid">' +
      field("sv-h", tf("Heure", "الساعة"), "text", nowH()) +
      field("sv-fc", "FC (/min)", "number", "") +
      field("sv-fr", "FR (/min)", "number", "") +
      field("sv-spo2", "SpO₂ (%)", "number", "") +
      field("sv-tas", tf("TA sys.", "ض. انقباضي"), "number", "") +
      field("sv-tad", tf("TA dia.", "ض. انبساطي"), "number", "") +
      field("sv-temp", tf("T° (°C)", "الحرارة"), "number", "") +
      "</div>" +
      '<div class="af-drawer-foot"><button type="submit" class="btn btn-primary">' + icon("plus", 16) + tf("Ajouter le relevé", "إضافة القياس") + "</button></div></form>";

    UI.openDrawer(html);
    document.getElementById("sv-x").addEventListener("click", UI.closeDrawer);
    document.getElementById("sv-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {
        h: val("sv-h") || nowH(),
        fc: num("sv-fc"), fr: num("sv-fr"), spo2: num("sv-spo2"),
        taS: num("sv-tas"), taD: num("sv-tad"), temp: parseFloat(val("sv-temp")) || "—"
      };
      if (!vitals[p.id]) vitals[p.id] = [];
      vitals[p.id].push(v);
      UI.closeDrawer(); render(rootEl);
      UI.toast(tf("Relevé enregistré", "تم تسجيل القياس"));
    });
  }

  function field(id, label, type, v) {
    return '<div class="af-field"><label>' + esc(label) + '</label><input id="' + id + '" type="' + type + '" value="' + esc(v) + '"' + (type === "number" ? ' step="any"' : "") + "/></div>";
  }
  function val(id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; }
  function num(id) { var v = parseInt(val(id), 10); return isNaN(v) ? "—" : v; }
  function nowH() { return "14:35"; }

  A.modules.surveillance = { render: render };
})();
