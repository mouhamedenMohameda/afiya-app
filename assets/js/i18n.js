/* =====================================================================
   Afiya — internationalisation (FR / AR) + gestion du sens (LTR/RTL)
   ===================================================================== */
(function () {
  "use strict";
  window.AFIYA = window.AFIYA || {};

  var DICT = {
    fr: {
      brandTag: "Système hospitalier",
      contextRole: "Docteur",
      contextService: "Pédiatrie · Réanimation",
      userName: "Dr. Mohamed Vall",
      userRole: "Docteur",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      buildTag: "En construction",
      buildDesc: "Ce module fait partie de l'architecture prévue. Son interface et sa logique seront développées prochainement.",
      pageSubPrefix: "Module"
    },
    ar: {
      brandTag: "نظام المستشفى",
      contextRole: "طبيب",
      contextService: "طب الأطفال · الإنعاش",
      userName: "د. محمد فال",
      userRole: "طبيب",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      buildTag: "قيد الإنشاء",
      buildDesc: "هذه الوحدة جزء من البنية المخطط لها. ستُطوَّر واجهتها ووظائفها قريباً.",
      pageSubPrefix: "وحدة"
    }
  };

  var cfgLang = (window.AFIYA && AFIYA.config && AFIYA.config.langue) || "fr";
  var state = {
    lang: (window.localStorage && localStorage.getItem("afiya.lang")) || cfgLang
  };

  var i18n = {
    get lang() { return state.lang; },
    dir: function () { return state.lang === "ar" ? "rtl" : "ltr"; },
    t: function (key) { return (DICT[state.lang] && DICT[state.lang][key]) || key; },
    tf: function (fr, ar) { return state.lang === "ar" ? ar : fr; },
    setLang: function (lang) {
      if (lang !== "fr" && lang !== "ar") return;
      state.lang = lang;
      try { localStorage.setItem("afiya.lang", lang); } catch (e) {}
      i18n.apply();
      if (AFIYA.onLangChange) AFIYA.onLangChange();
    },
    apply: function () {
      var root = document.documentElement;
      root.setAttribute("lang", state.lang);
      root.setAttribute("dir", i18n.dir());
    }
  };

  AFIYA.i18n = i18n;
})();
