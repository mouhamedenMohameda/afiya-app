/* =====================================================================
   Afiya — données (en mémoire pour l'instant ; remplacé plus tard par
   une vraie base PostgreSQL via l'API). Service : Pédiatrie · Réanimation.
   ===================================================================== */
(function () {
  "use strict";
  window.AFIYA = window.AFIYA || {};

  var TODAY = "2026-07-19";
  var NOW_MIN = 14 * 60 + 35;   /* heure de référence pour les temps d'attente (démo) : 14:35 */

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

  /* =====================================================================
     Urgences — file d'attente avec triage (5 niveaux, façon SFMU/CIMU).
     statut : attente | en_cours | oriente
     dispo (si oriente) : hospitalisation | sortie | transfert
     ===================================================================== */
  var emergencies = [
    { id: 501, code: "205110", nom: "Salma Mint Sidi",        age: 1,  sexe: "F", motif: "Détresse respiratoire aiguë", triage: 1, arrivee: "14:25", statut: "en_cours", dispo: null },
    { id: 502, code: "205094", nom: "Fatimetou Mint Cheikh",  age: 3,  sexe: "F", motif: "Convulsion fébrile",          triage: 2, arrivee: "14:05", statut: "attente",  dispo: null },
    { id: 503, code: "205061", nom: "Cheikh Ould Ahmed",      age: 7,  sexe: "M", motif: "Fracture de l'avant-bras",    triage: 3, arrivee: "13:40", statut: "attente",  dispo: null },
    { id: 504, code: "205038", nom: "Moctar Ould Baba",       age: 5,  sexe: "M", motif: "Douleur abdominale aiguë",     triage: 3, arrivee: "13:10", statut: "en_cours", dispo: null },
    { id: 505, code: "205002", nom: "Zeinabou Mint Ely",      age: 9,  sexe: "F", motif: "Plaie superficielle du cuir chevelu", triage: 4, arrivee: "12:50", statut: "attente", dispo: null },
    { id: 506, code: "204977", nom: "Abdallahi Ould Sidi",    age: 2,  sexe: "M", motif: "Fièvre isolée bien tolérée",   triage: 5, arrivee: "12:20", statut: "attente",  dispo: null },
    { id: 507, code: "204940", nom: "Aminetou Mint Dah",      age: 4,  sexe: "F", motif: "Vomissements répétés",         triage: 3, arrivee: "13:55", statut: "attente",  dispo: null }
  ];

  var seq = 200;
  var emSeq = 600;

  var data = {
    today: TODAY,
    beds: beds,
    patients: patients,
    emergencies: emergencies,

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

  /* =====================================================================
     API Urgences
     ===================================================================== */

  /* méta d'un niveau de triage : couleur, libellés, délai cible (min) */
  var TRIAGE = {
    1: { fr: "Urgence vitale", ar: "خطر حيوي",   couleur: "Rouge",  cible: 0 },
    2: { fr: "Très urgent",    ar: "عاجل جداً",   couleur: "Orange", cible: 20 },
    3: { fr: "Urgent",         ar: "عاجل",        couleur: "Jaune",  cible: 60 },
    4: { fr: "Peu urgent",     ar: "أقل إلحاحاً", couleur: "Vert",   cible: 120 },
    5: { fr: "Non urgent",     ar: "غير عاجل",    couleur: "Bleu",   cible: 240 }
  };
  data.triageMeta = function (level) { return TRIAGE[level] || TRIAGE[3]; };

  /* minutes d'attente depuis l'arrivée (par rapport à l'heure de référence) */
  data.waitMinutes = function (em) {
    var p = String(em.arrivee || "0:0").split(":");
    var arr = (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
    return Math.max(0, NOW_MIN - arr);
  };
  /* délai cible dépassé ? (patients encore en attente uniquement) */
  data.isOverdue = function (em) {
    if (em.statut !== "attente") return false;
    return data.waitMinutes(em) > TRIAGE[em.triage].cible;
  };

  data.emById = function (id) {
    for (var i = 0; i < emergencies.length; i++) if (emergencies[i].id === id) return emergencies[i];
    return null;
  };

  /* file active triée : priorité de triage puis arrivée la plus ancienne */
  data.emQueue = function () {
    return emergencies.slice().sort(function (a, b) {
      var rank = { attente: 0, en_cours: 1, oriente: 2 };
      if (rank[a.statut] !== rank[b.statut]) return rank[a.statut] - rank[b.statut];
      if (a.triage !== b.triage) return a.triage - b.triage;
      return data.waitMinutes(b) - data.waitMinutes(a);
    });
  };

  data.emCounts = function () {
    var c = { total: emergencies.length, attente: 0, en_cours: 0, oriente: 0, overdue: 0, tri: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    emergencies.forEach(function (e) {
      c[e.statut]++;
      if (e.statut !== "oriente") c.tri[e.triage]++;
      if (data.isOverdue(e)) c.overdue++;
    });
    return c;
  };

  /* enregistrer une nouvelle arrivée aux urgences */
  data.registerArrival = function (fields) {
    var e = {
      id: ++emSeq,
      code: fields.code || String(200000 + Math.floor(Math.random() * 90000)),
      nom: fields.nom, age: fields.age, sexe: fields.sexe,
      motif: fields.motif, triage: parseInt(fields.triage, 10) || 3,
      arrivee: fields.arrivee || nowHHMM(),
      statut: "attente", dispo: null
    };
    emergencies.push(e);
    return e;
  };

  function nowHHMM() {
    var h = Math.floor(NOW_MIN / 60), m = NOW_MIN % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  /* prise en charge : attente -> en_cours */
  data.emTakeCharge = function (id) {
    var e = data.emById(id);
    if (e && e.statut === "attente") { e.statut = "en_cours"; return true; }
    return false;
  };

  /* orientation : sortie / transfert (simple) — hospitalisation gérée à part */
  data.emOrient = function (id, dispo) {
    var e = data.emById(id);
    if (!e) return false;
    e.statut = "oriente"; e.dispo = dispo;
    return true;
  };

  /* orientation vers l'hospitalisation : admet dans un lit libre et clôt l'épisode */
  data.emAdmitToBed = function (id, bedId) {
    var e = data.emById(id);
    if (!e) return null;
    var p = data.admit(bedId, {
      code: e.code, nom: e.nom, age: e.age, sexe: e.sexe,
      motif: e.motif, medecin: (AFIYA.config.utilisateur && AFIYA.config.utilisateur.nom) || "",
      etat: e.triage <= 2 ? "critique" : (e.triage === 3 ? "surveillance" : "stable")
    });
    if (!p) return null;
    e.statut = "oriente"; e.dispo = "hospitalisation";
    return p;
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

  /* =====================================================================
     Registre des décès (partagé entre Certificat et Liste des décès)
     ===================================================================== */
  var deaths = [
    { id: 701, code: "099120", nom: "Sneiba Mint Abdallahi", age: 3, sexe: "F", date: "2026-07-12", heure: "04:20",
      causeImmediate: "Défaillance multiviscérale", causeInitiale: "Choc septique", medecin: "Dr. Ahmed Baba", lieu: "Réanimation · Salle A" },
    { id: 702, code: "098455", nom: "Mohamed Ould Taleb",   age: 6, sexe: "M", date: "2026-07-08", heure: "22:10",
      causeImmediate: "Arrêt cardio-respiratoire", causeInitiale: "Traumatisme crânien grave", medecin: "Dr. Mohamed Vall", lieu: "Réanimation · Salle A" }
  ];
  var deathSeq = 800;
  data.deaths = deaths;
  data.registerDeath = function (fields) {
    var d = {
      id: ++deathSeq,
      code: fields.code || String(90000 + Math.floor(Math.random() * 9000)),
      nom: fields.nom, age: fields.age, sexe: fields.sexe,
      date: fields.date || TODAY, heure: fields.heure || "",
      causeImmediate: fields.causeImmediate, causeInitiale: fields.causeInitiale,
      medecin: fields.medecin, lieu: fields.lieu
    };
    deaths.unshift(d);
    return d;
  };

  /* nombre de jours depuis l'admission (par rapport à today) */
  data.daysSince = function (dateStr) {
    var a = new Date(dateStr + "T00:00:00"), b = new Date(TODAY + "T00:00:00");
    return Math.max(0, Math.round((b - a) / 86400000));
  };

  AFIYA.data = data;
})();
