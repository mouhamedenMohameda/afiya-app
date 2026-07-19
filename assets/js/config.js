/* =====================================================================
   Afiya — FICHIER DE PERSONNALISATION
   ---------------------------------------------------------------------
   👉 Pour vendre le système à un autre établissement, il suffit d'éditer
      CE SEUL FICHIER (nom de l'établissement, service, couleur, langue).
      Rien d'autre à toucher.
   ===================================================================== */
(function () {
  "use strict";
  window.AFIYA = window.AFIYA || {};

  AFIYA.config = {

    /* Nom de votre logiciel (votre marque). Laissez "Afiya" ou mettez le
       nom que vous vendez. Affiché en haut de la barre latérale. */
    produit: "Afiya",

    /* Sous-titre sous le nom du logiciel */
    slogan: {
      fr: "Système d'information hospitalier",
      ar: "نظام معلومات المستشفى"
    },

    /* ⭐ Nom de l'établissement client — affiché en grand en haut de chaque écran */
    etablissement: {
      fr: "Centre Neuro-Psychiatrique de Nouakchott",
      ar: "المركز النفسي العصبي بنواكشوط"
    },

    /* Service / unité affiché sous le nom de l'établissement */
    service: {
      fr: "Psychiatrie · Hospitalisation",
      ar: "الطب النفسي · الاستشفاء"
    },

    /* Utilisateur connecté (démo) */
    utilisateur: {
      nom: "Dr. Mohamed Vall",
      role: { fr: "Médecin", ar: "طبيب" }
    },

    /* Langue par défaut : "fr" ou "ar" */
    langue: "fr",

    /* Couleur d'accent. null = vert par défaut.
       Exemples : "#0E9F6E" vert · "#2563A8" bleu · "#7A3EA1" violet · "#C0392B" rouge */
    couleur: null
  };
})();
