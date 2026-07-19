/* =====================================================================
   Afiya — données (en mémoire pour l'instant ; remplacé plus tard par
   une vraie base PostgreSQL via l'API). Service : Pédiatrie · Réanimation.
   ===================================================================== */
(function () {
  "use strict";
  window.AFIYA = window.AFIYA || {};

  var TODAY = "2026-07-19";

  var patients = [
    { id: 1,  code: "102297", nom: "Nasera Mohamed Naser Dine", age: 6,  sexe: "F", motif: "Détresse respiratoire aiguë", medecin: "Dr. Mariem Taleb", admis: "2026-07-15", etat: "surveillance" },
    { id: 2,  code: "103455", nom: "Ahmed Ould Ely",            age: 4,  sexe: "M", motif: "Sepsis sévère",              medecin: "Dr. Mohamed Vall", admis: "2026-07-16", etat: "critique" },
    { id: 3,  code: "101880", nom: "Mariem Mint Cheikh",        age: 8,  sexe: "F", motif: "Surveillance post-opératoire", medecin: "Dr. Sow Amadou",  admis: "2026-07-17", etat: "stable" },
    { id: 4,  code: "104120", nom: "Brahim Ould Ahmed",         age: 2,  sexe: "M", motif: "Bronchiolite grave",         medecin: "Dr. Mariem Taleb", admis: "2026-07-18", etat: "surveillance" },
    { id: 5,  code: "100742", nom: "Aicha Mint Baba",           age: 10, sexe: "F", motif: "Traumatisme crânien",        medecin: "Dr. Ahmed Baba",  admis: "2026-07-14", etat: "critique" },
    { id: 6,  code: "103991", nom: "Sidi Mohamed Ould Dah",     age: 5,  sexe: "M", motif: "État de mal convulsif",      medecin: "Dr. Mohamed Vall", admis: "2026-07-18", etat: "stable" },
    { id: 7,  code: "102015", nom: "Vatimetou Mint Sidi",       age: 1,  sexe: "F", motif: "Déshydratation sévère",      medecin: "Dr. Khadijetou Sy", admis: "2026-07-17", etat: "stable" },
    { id: 8,  code: "104533", nom: "Yahya Ould Salem",          age: 7,  sexe: "M", motif: "Pneumopathie hypoxémiante",  medecin: "Dr. Sow Amadou",  admis: "2026-07-16", etat: "surveillance" },
    { id: 9,  code: "100388", nom: "Khadijetou Mint Ely",       age: 3,  sexe: "F", motif: "Choc septique",              medecin: "Dr. Ahmed Baba",  admis: "2026-07-15", etat: "critique" }
  ];

  /* salle · lit ; type = rea | soins | dechocage */
  var beds = [
    { id: "A1", salle: "A", lit: "A1", type: "rea",       etage: 1, patientId: 1 },
    { id: "A2", salle: "A", lit: "A2", type: "rea",       etage: 1, patientId: 2 },
    { id: "A3", salle: "A", lit: "A3", type: "rea",       etage: 1, patientId: null },
    { id: "A4", salle: "A", lit: "A4", type: "rea",       etage: 1, patientId: 3 },
    { id: "A5", salle: "A", lit: "A5", type: "rea",       etage: 1, patientId: 4 },
    { id: "A6", salle: "A", lit: "A6", type: "rea",       etage: 1, patientId: null },
    { id: "B1", salle: "B", lit: "B1", type: "soins",     etage: 2, patientId: 5 },
    { id: "B2", salle: "B", lit: "B2", type: "soins",     etage: 2, patientId: 6 },
    { id: "B3", salle: "B", lit: "B3", type: "soins",     etage: 2, patientId: 7 },
    { id: "B4", salle: "B", lit: "B4", type: "soins",     etage: 2, patientId: null },
    { id: "D1", salle: "D", lit: "D1", type: "dechocage", etage: 1, patientId: 8 },
    { id: "D2", salle: "D", lit: "D2", type: "dechocage", etage: 1, patientId: 9 }
  ];

  var seq = 200;

  var data = {
    today: TODAY,
    beds: beds,
    patients: patients,

    patient: function (id) {
      for (var i = 0; i < patients.length; i++) if (patients[i].id === id) return patients[i];
      return null;
    },
    bedPatient: function (bed) {
      return bed.patientId ? data.patient(bed.patientId) : null;
    },
    isFree: function (bed) { return !bed.patientId; },

    counts: function () {
      var c = { total: beds.length, occ: 0, free: 0, critique: 0 };
      beds.forEach(function (b) {
        if (b.patientId) {
          c.occ++;
          var p = data.patient(b.patientId);
          if (p && p.etat === "critique") c.critique++;
        } else c.free++;
      });
      return c;
    },

    admit: function (bedId, fields) {
      var bed = null;
      for (var i = 0; i < beds.length; i++) if (beds[i].id === bedId) bed = beds[i];
      if (!bed || bed.patientId) return null;
      var p = {
        id: ++seq,
        code: fields.code || String(100000 + Math.floor(Math.random() * 900000)),
        nom: fields.nom, age: fields.age, sexe: fields.sexe,
        motif: fields.motif, medecin: fields.medecin,
        admis: TODAY, etat: fields.etat || "stable"
      };
      patients.push(p);
      bed.patientId = p.id;
      return p;
    },

    discharge: function (bedId) {
      for (var i = 0; i < beds.length; i++) if (beds[i].id === bedId) { beds[i].patientId = null; return true; }
      return false;
    }
  };

  /* libellés bilingues des types de lit */
  data.typeLabel = function (type, ar) {
    var m = {
      rea:       { fr: "Réanimation",    ar: "إنعاش" },
      soins:     { fr: "Soins intensifs", ar: "عناية مركزة" },
      dechocage: { fr: "Déchocage",      ar: "إنعاش أولي" }
    };
    var o = m[type] || { fr: type, ar: type };
    return ar ? o.ar : o.fr;
  };

  /* nombre de jours depuis l'admission (par rapport à today) */
  data.daysSince = function (dateStr) {
    var a = new Date(dateStr + "T00:00:00"), b = new Date(TODAY + "T00:00:00");
    return Math.max(0, Math.round((b - a) / 86400000));
  };

  AFIYA.data = data;
})();
