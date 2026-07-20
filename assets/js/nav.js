/* =====================================================================
   Afiya — structure de navigation (inspirée d'OLIVEX, réorganisée)
   Chaque item : { id, route, icon, fr, ar, badge?, quickAdd?, children? }
   Aucune logique métier ici — uniquement la carte de navigation.
   ===================================================================== */
(function () {
  "use strict";
  window.AFIYA = window.AFIYA || {};

  AFIYA.nav = [
    {
      title: { fr: "Clinique", ar: "السريرية" },
      items: [
        { id: "accueil",      route: "accueil",      icon: "accueil",      fr: "Accueil",           ar: "الاستقبال" },
        { id: "urgences",     route: "urgences",     icon: "urgences",     fr: "Urgences",          ar: "الطوارئ",        badge: (AFIYA.data ? AFIYA.data.emCounts().attente : 0) },
        { id: "hospitalises", route: "hospitalises", icon: "hospitalises", fr: "Hospitalisés",      ar: "المرضى المقيمون", badge: (AFIYA.data ? AFIYA.data.counts().occ : 0), quickAdd: true },
        { id: "dossiers",     route: "dossiers",     icon: "dossiers",     fr: "Mes dossiers",      ar: "ملفاتي" },
        { id: "explorations", route: "explorations", icon: "explorations", fr: "Explorations",      ar: "الاستكشافات" },
        { id: "comptes",      route: "comptes",      icon: "comptes",      fr: "Comptes rendus",    ar: "التقارير الطبية" }
      ]
    },
    {
      title: { fr: "Suivi", ar: "المتابعة" },
      items: [
        { id: "dashboard",     route: "dashboard",     icon: "dashboard",     fr: "Tableau de bord", ar: "لوحة التحكم" },
        { id: "surveillance",  route: "surveillance",  icon: "surveillance",  fr: "Surveillance",    ar: "المراقبة" },
        { id: "transmissions", route: "transmissions", icon: "transmissions", fr: "Transmissions",   ar: "التحويلات" }
      ]
    },
    {
      title: { fr: "Registres", ar: "السجلات" },
      items: [
        {
          id: "deces", icon: "deces", fr: "Décès", ar: "الوفيات",
          children: [
            { id: "deces-certificat", route: "deces/certificat", icon: "certificat", fr: "Certificat de décès", ar: "شهادة الوفاة" },
            { id: "deces-liste",      route: "deces/liste",      icon: "liste",      fr: "Liste des décès",     ar: "قائمة الوفيات" }
          ]
        },
        { id: "archives", route: "archives", icon: "archives", fr: "Archives", ar: "الأرشيف" }
      ]
    },
    {
      title: { fr: "Système", ar: "النظام" },
      items: [
        { id: "teletransmission", route: "teletransmission", icon: "teletransmission", fr: "Télétransmission", ar: "الإرسال عن بُعد" },
        { id: "parametrages",     route: "parametrages",     icon: "parametrages",     fr: "Paramétrages",     ar: "الإعدادات" }
      ]
    }
  ];

  /* route par défaut au démarrage (le module vitrine : les lits) */
  AFIYA.defaultRoute = "hospitalises";

  /* index route -> item (aplati, y compris enfants) pour le routeur */
  AFIYA.routeIndex = (function () {
    var idx = {};
    AFIYA.nav.forEach(function (section) {
      section.items.forEach(function (item) {
        if (item.route) idx[item.route] = item;
        if (item.children) item.children.forEach(function (c) { idx[c.route] = c; });
      });
    });
    return idx;
  })();
})();
