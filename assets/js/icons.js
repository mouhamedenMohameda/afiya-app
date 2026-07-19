/* =====================================================================
   Afiya — jeu d'icônes SVG (stroke, 24x24)
   Exposé via window.AFIYA.icons + helper icon(name, size)
   ===================================================================== */
(function () {
  "use strict";
  window.AFIYA = window.AFIYA || {};

  var P = {
    accueil:
      '<path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20v-5h4v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    urgences:
      '<path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8.6-1.9A4.5 4.5 0 0 1 22 11c0 5.65-7 10-7 10" transform="translate(-1.5 -.5)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/><path d="M8.5 12h2l1.2-2.4L13.6 14l1-2h2.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    hospitalises:
      '<path d="M3 8v11M3 12h13a4 4 0 0 1 4 4v3M3 19h18M6 12V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    dossiers:
      '<path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/><path d="M9 13h6M9 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    explorations:
      '<circle cx="10.5" cy="10.5" r="6" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="m20 20-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 10.5h5M10.5 8v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    comptes:
      '<rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M9 3.5V6h6V3.5M8.5 11h7M8.5 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    dashboard:
      '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/>',
    surveillance:
      '<path d="M3 12h4l2-6 3.5 12L16 9l1.5 3H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    transmissions:
      '<path d="M7 8H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M21 3h-6M21 3v6M21 3 11 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    deces:
      '<rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 7v6M9.5 9.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9 17h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    certificat:
      '<rect x="4" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M8 9h8M8 12h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16.5" cy="16.5" r="2.6" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="m15.2 18.6-.6 2.4 1.9-1.1 1.9 1.1-.6-2.4" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
    liste:
      '<path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="18" r="1.4" fill="currentColor"/>',
    archives:
      '<rect x="3.5" y="4" width="17" height="4.5" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5M10 12h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    teletransmission:
      '<path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1 .5 6.98" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M12 21v-8M9 15l3-3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    parametrages:
      '<circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 2.5v2.6M12 18.9v2.6M4.2 7l2.25 1.3M17.55 15.7 19.8 17M4.2 17l2.25-1.3M17.55 8.3 19.8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    /* utilitaires */
    chevron:'<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    plus:'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    build:'<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18v3h3l6.5-6.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.1-.5-.5-2.1z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    search:'<circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="m20 20-3.8-3.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    transfer:'<path d="M4 8h13M13 4l4 4-4 4M20 16H7m4 4-4-4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    swap:'<path d="M7 4 4 7l3 3M4 7h11M17 20l3-3-3-3M20 17H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    exit:'<path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M9 8l-4 4 4 4M5 12h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    treatment:'<path d="M9 3h6M10.5 3v4.5L5.8 16A2 2 0 0 0 7.6 19h8.8a2 2 0 0 0 1.8-2.9L13.5 7.5V3M8 12h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
  };

  AFIYA.icons = P;
  AFIYA.icon = function (name, size) {
    var s = size || 22;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" aria-hidden="true">' +
      (P[name] || "") + "</svg>";
  };
})();
