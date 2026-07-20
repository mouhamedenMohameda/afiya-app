-- =====================================================================
--  Afiya — 001_creation_schema.sql
--  Schéma initial d'une base hôpital (afiya_<code>).
--  Modèle : 1 base par établissement (aucun tenant_id).
--  Idempotent autant que possible ; à appliquer avec ON_ERROR_STOP=1.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- identifiants insensibles à la casse
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- recherche floue (noms)
CREATE EXTENSION IF NOT EXISTS unaccent;   -- recherche sans diacritiques

-- unaccent() n'est pas IMMUTABLE : wrapper immutable pour l'indexer
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent', $1) $$;

-- ---------------------------------------------------------------------
-- 1. Types énumérés
-- ---------------------------------------------------------------------
CREATE TYPE role_utilisateur   AS ENUM ('medecin','infirmier','admin','secretaire');
CREATE TYPE sexe               AS ENUM ('M','F');
CREATE TYPE etat_clinique      AS ENUM ('stable','surveillance','critique');
CREATE TYPE type_lit           AS ENUM ('rea','soins','dechocage');
CREATE TYPE urgence_statut     AS ENUM ('attente','en_cours','oriente');
CREATE TYPE urgence_orientation AS ENUM ('hospitalisation','domicile','transfert');
CREATE TYPE mode_sortie        AS ENUM ('domicile','transfert','deces');
CREATE TYPE exploration_type   AS ENUM ('bio','imagerie','autre');
CREATE TYPE exploration_statut AS ENUM ('demande','en_cours','resultat');
CREATE TYPE cr_type            AS ENUM ('hospitalisation','operatoire','consultation','sortie');
CREATE TYPE cr_statut          AS ENUM ('brouillon','valide');
CREATE TYPE poste_travail      AS ENUM ('matin','apres_midi','nuit');
CREATE TYPE priorite           AS ENUM ('info','important','urgent');
CREATE TYPE tt_type            AS ENUM ('activite','deces','epidemio');
CREATE TYPE tt_statut          AS ENUM ('en_attente','envoye','erreur');
CREATE TYPE audit_action       AS ENUM ('INSERT','UPDATE','DELETE');

-- ---------------------------------------------------------------------
-- 2. Fonctions utilitaires (updated_at + audit générique)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- l'appelant peut fournir l'utilisateur courant via :
--   SELECT set_config('afiya.utilisateur_id', '<uuid>', false);
CREATE OR REPLACE FUNCTION trg_audit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_uid uuid;
BEGIN
  BEGIN v_uid := nullif(current_setting('afiya.utilisateur_id', true),'')::uuid;
  EXCEPTION WHEN others THEN v_uid := NULL; END;

  INSERT INTO journal_audit(table_cible, ligne_id, action, utilisateur_id, avant, apres)
  VALUES (
    TG_TABLE_NAME,
    COALESCE((NEW).id, (OLD).id),
    TG_OP::audit_action,
    v_uid,
    CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

-- ---------------------------------------------------------------------
-- 3. Référentiel établissement / organisation
-- ---------------------------------------------------------------------
-- Identité de l'hôpital : une seule ligne (contrôlée par un index partiel).
CREATE TABLE etablissement (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,                 -- ex. 'cnpn'
  nom_fr        text NOT NULL,
  nom_ar        text,
  produit       text NOT NULL DEFAULT 'Afiya',
  slogan_fr     text, slogan_ar text,
  langue_defaut text NOT NULL DEFAULT 'fr' CHECK (langue_defaut IN ('fr','ar')),
  couleur       text,                                  -- accent hexadécimal
  singleton     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_etablissement_singleton ON etablissement(singleton) WHERE singleton;

CREATE TABLE service (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_fr     text NOT NULL,
  nom_ar     text,
  actif      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE utilisateur (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login          citext UNIQUE,
  nom            text NOT NULL,
  role           role_utilisateur NOT NULL DEFAULT 'medecin',
  service_id     uuid REFERENCES service(id) ON DELETE SET NULL,
  mot_de_passe   text,                                 -- hash (bcrypt/argon2) — jamais en clair
  actif          boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Barème de triage (référence, 5 niveaux)
CREATE TABLE triage_cible (
  niveau         smallint PRIMARY KEY CHECK (niveau BETWEEN 1 AND 5),
  libelle_fr     text NOT NULL,
  libelle_ar     text NOT NULL,
  couleur        text NOT NULL,
  delai_cible_min integer NOT NULL                     -- délai de prise en charge visé
);

-- ---------------------------------------------------------------------
-- 4. Patients (identité durable, dé-dupliquée)
-- ---------------------------------------------------------------------
CREATE TABLE patient (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_dossier   text NOT NULL UNIQUE,                 -- numéro lisible
  nni            text UNIQUE,                           -- identifiant national (optionnel)
  nom            text NOT NULL,
  sexe           sexe NOT NULL,
  date_naissance date,                                  -- privilégié
  age_estime     smallint CHECK (age_estime BETWEEN 0 AND 130), -- si DDN inconnue
  telephone      text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (date_naissance IS NOT NULL OR age_estime IS NOT NULL)
);
-- âge courant = fonction (jamais stocké car varie avec le temps)
CREATE OR REPLACE FUNCTION patient_age(p patient)
RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN p.date_naissance IS NOT NULL
      THEN date_part('year', age(current_date, p.date_naissance))::int
    ELSE p.age_estime END $$;

-- ---------------------------------------------------------------------
-- 5. Lits
-- ---------------------------------------------------------------------
CREATE TABLE lit (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES service(id) ON DELETE SET NULL,
  salle      text NOT NULL,
  code       text NOT NULL,                             -- ex. 'A1'
  type       type_lit NOT NULL DEFAULT 'rea',
  etage      smallint,
  actif      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code)
);

-- ---------------------------------------------------------------------
-- 6. Séjours (épisode d'hospitalisation) + affectation de lit
-- ---------------------------------------------------------------------
CREATE TABLE sejour (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
  service_id    uuid REFERENCES service(id) ON DELETE SET NULL,
  medecin_id    uuid REFERENCES utilisateur(id) ON DELETE SET NULL, -- médecin responsable
  motif         text NOT NULL,
  etat_clinique etat_clinique NOT NULL DEFAULT 'stable',
  admis_le      timestamptz NOT NULL DEFAULT now(),
  sorti_le      timestamptz,
  mode_sortie   mode_sortie,
  provenance_urgence uuid,                              -- FK ajoutée plus bas (cycle)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (sorti_le IS NULL OR sorti_le >= admis_le),
  CHECK ((sorti_le IS NULL) = (mode_sortie IS NULL))   -- sortie ⇔ mode renseigné
);

CREATE TABLE affectation_lit (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id  uuid NOT NULL REFERENCES sejour(id) ON DELETE CASCADE,
  lit_id     uuid NOT NULL REFERENCES lit(id) ON DELETE RESTRICT,
  debut      timestamptz NOT NULL DEFAULT now(),
  fin        timestamptz,
  CHECK (fin IS NULL OR fin >= debut)
);
-- INVARIANTS CLÉS : au plus une affectation ouverte par lit ET par séjour.
-- => interdit la double occupation d'un lit au niveau base.
CREATE UNIQUE INDEX uq_lit_occupe   ON affectation_lit(lit_id)    WHERE fin IS NULL;
CREATE UNIQUE INDEX uq_sejour_actif ON affectation_lit(sejour_id) WHERE fin IS NULL;

-- ---------------------------------------------------------------------
-- 7. Urgences (passages avec triage)
-- ---------------------------------------------------------------------
CREATE TABLE passage_urgence (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid REFERENCES patient(id) ON DELETE SET NULL,
  triage            smallint NOT NULL REFERENCES triage_cible(niveau),
  motif             text NOT NULL,
  arrive_le         timestamptz NOT NULL DEFAULT now(),
  statut            urgence_statut NOT NULL DEFAULT 'attente',
  pris_en_charge_le timestamptz,
  oriente_le        timestamptz,
  orientation       urgence_orientation,
  sejour_id         uuid REFERENCES sejour(id) ON DELETE SET NULL, -- si hospitalisé
  medecin_id        uuid REFERENCES utilisateur(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK ((statut = 'oriente') = (orientation IS NOT NULL))
);

-- fermeture du cycle sejour → passage
ALTER TABLE sejour
  ADD CONSTRAINT fk_sejour_urgence
  FOREIGN KEY (provenance_urgence) REFERENCES passage_urgence(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 8. Surveillance (constantes vitales)
-- ---------------------------------------------------------------------
CREATE TABLE constante (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id  uuid NOT NULL REFERENCES sejour(id) ON DELETE CASCADE,
  mesure_le  timestamptz NOT NULL DEFAULT now(),
  fc         smallint CHECK (fc   BETWEEN 0 AND 350),  -- /min
  fr         smallint CHECK (fr   BETWEEN 0 AND 120),  -- /min
  spo2       smallint CHECK (spo2 BETWEEN 0 AND 100),  -- %
  ta_sys     smallint CHECK (ta_sys BETWEEN 0 AND 300),
  ta_dia     smallint CHECK (ta_dia BETWEEN 0 AND 200),
  temp       numeric(3,1) CHECK (temp BETWEEN 25 AND 45),
  glasgow    smallint CHECK (glasgow BETWEEN 3 AND 15),
  diurese    integer,                                   -- mL
  note       text,
  auteur_id  uuid REFERENCES utilisateur(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 9. Explorations (biologie / imagerie / examens)
-- ---------------------------------------------------------------------
CREATE TABLE exploration (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id    uuid REFERENCES sejour(id) ON DELETE CASCADE,
  patient_id   uuid NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
  type         exploration_type NOT NULL,
  libelle      text NOT NULL,
  statut       exploration_statut NOT NULL DEFAULT 'demande',
  resultat     text,
  demande_le   timestamptz NOT NULL DEFAULT now(),
  resultat_le  timestamptz,
  demandeur_id uuid REFERENCES utilisateur(id) ON DELETE SET NULL,
  valide_par   uuid REFERENCES utilisateur(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 10. Comptes rendus
-- ---------------------------------------------------------------------
CREATE TABLE compte_rendu (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id  uuid REFERENCES sejour(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
  type       cr_type NOT NULL,
  titre      text NOT NULL,
  contenu    text NOT NULL,
  statut     cr_statut NOT NULL DEFAULT 'brouillon',
  auteur_id  uuid REFERENCES utilisateur(id) ON DELETE SET NULL,
  valide_par uuid REFERENCES utilisateur(id) ON DELETE SET NULL,
  valide_le  timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((statut = 'valide') = (valide_le IS NOT NULL))
);

-- ---------------------------------------------------------------------
-- 11. Transmissions (relèves inter-équipes)
-- ---------------------------------------------------------------------
CREATE TABLE transmission (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patient(id) ON DELETE SET NULL,  -- NULL = général
  sejour_id  uuid REFERENCES sejour(id) ON DELETE SET NULL,
  auteur_id  uuid REFERENCES utilisateur(id) ON DELETE SET NULL,
  poste      poste_travail NOT NULL,
  priorite   priorite NOT NULL DEFAULT 'info',
  texte      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 12. Registre des décès (certificats)
-- ---------------------------------------------------------------------
CREATE SEQUENCE seq_certificat_deces;
CREATE TABLE certificat_deces (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          text UNIQUE,                          -- REG-2026-000001 (trigger)
  patient_id      uuid REFERENCES patient(id) ON DELETE SET NULL,
  sejour_id       uuid REFERENCES sejour(id) ON DELETE SET NULL,
  nom             text NOT NULL,                        -- instantané (traçabilité)
  sexe            sexe,
  age_ans         smallint,
  date_deces      date NOT NULL,
  heure_deces     time,
  lieu            text,
  cause_immediate text NOT NULL,
  cause_initiale  text,
  medecin_id      uuid REFERENCES utilisateur(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 13. Télétransmission (système national de santé)
-- ---------------------------------------------------------------------
CREATE TABLE teletransmission (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        tt_type NOT NULL,
  periode     text NOT NULL,                            -- ex. 'Semaine 29'
  statut      tt_statut NOT NULL DEFAULT 'en_attente',
  nombre      integer NOT NULL DEFAULT 0,
  charge_utile jsonb,                                   -- payload agrégé envoyé
  erreur_msg  text,
  genere_le   timestamptz NOT NULL DEFAULT now(),
  envoye_le   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 14. Journal d'audit
-- ---------------------------------------------------------------------
CREATE TABLE journal_audit (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_cible    text NOT NULL,
  ligne_id       uuid,
  action         audit_action NOT NULL,
  utilisateur_id uuid,
  avant          jsonb,
  apres          jsonb,
  effectue_le    timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 15. Index (les FK et les filtres fréquents des écrans)
-- =====================================================================
-- recherche patient (nom sans accents, floue)
CREATE INDEX ix_patient_nom_trgm ON patient USING gin (f_unaccent(lower(nom)) gin_trgm_ops);
CREATE INDEX ix_patient_code     ON patient (code_dossier);

CREATE INDEX ix_lit_service      ON lit (service_id);

CREATE INDEX ix_sejour_patient   ON sejour (patient_id);
CREATE INDEX ix_sejour_medecin   ON sejour (medecin_id);
CREATE INDEX ix_sejour_service   ON sejour (service_id);
CREATE INDEX ix_sejour_actifs    ON sejour (admis_le DESC) WHERE sorti_le IS NULL; -- patients actuels
CREATE INDEX ix_sejour_clos      ON sejour (sorti_le DESC) WHERE sorti_le IS NOT NULL; -- archives

CREATE INDEX ix_affect_lit       ON affectation_lit (lit_id);
CREATE INDEX ix_affect_sejour    ON affectation_lit (sejour_id);

CREATE INDEX ix_urg_file         ON passage_urgence (triage, arrive_le) WHERE statut <> 'oriente';
CREATE INDEX ix_urg_statut       ON passage_urgence (statut);
CREATE INDEX ix_urg_patient      ON passage_urgence (patient_id);
CREATE INDEX ix_urg_sejour       ON passage_urgence (sejour_id);

CREATE INDEX ix_const_sejour     ON constante (sejour_id, mesure_le DESC);

CREATE INDEX ix_expl_statut      ON exploration (statut);
CREATE INDEX ix_expl_patient     ON exploration (patient_id);
CREATE INDEX ix_expl_sejour      ON exploration (sejour_id);

CREATE INDEX ix_cr_statut        ON compte_rendu (statut);
CREATE INDEX ix_cr_patient       ON compte_rendu (patient_id);
CREATE INDEX ix_cr_sejour        ON compte_rendu (sejour_id);

CREATE INDEX ix_trans_recent     ON transmission (created_at DESC);
CREATE INDEX ix_trans_priorite   ON transmission (priorite);
CREATE INDEX ix_trans_patient    ON transmission (patient_id);

CREATE INDEX ix_deces_date       ON certificat_deces (date_deces DESC);
CREATE INDEX ix_deces_patient    ON certificat_deces (patient_id);

CREATE INDEX ix_tt_statut        ON teletransmission (statut);
CREATE INDEX ix_tt_type_periode  ON teletransmission (type, periode);

CREATE INDEX ix_audit_cible      ON journal_audit (table_cible, ligne_id);
CREATE INDEX ix_audit_date       ON journal_audit (effectue_le DESC);

-- =====================================================================
-- 16. Triggers
-- =====================================================================
-- 16.a updated_at automatique
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'etablissement','service','utilisateur','patient','lit','sejour',
    'passage_urgence','exploration','compte_rendu','teletransmission'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at()', t);
  END LOOP;
END $$;

-- 16.b audit des tables cliniques
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patient','sejour','affectation_lit','passage_urgence','constante',
    'exploration','compte_rendu','transmission','certificat_deces'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_audit AFTER INSERT OR UPDATE OR DELETE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION trg_audit()', t);
  END LOOP;
END $$;

-- 16.c à la sortie d'un séjour : libère automatiquement le lit occupé
CREATE OR REPLACE FUNCTION trg_sejour_liberer_lit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.sorti_le IS NOT NULL AND OLD.sorti_le IS NULL THEN
    UPDATE affectation_lit
       SET fin = NEW.sorti_le
     WHERE sejour_id = NEW.id AND fin IS NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sejour_sortie AFTER UPDATE OF sorti_le ON sejour
  FOR EACH ROW EXECUTE FUNCTION trg_sejour_liberer_lit();

-- 16.d numéro de certificat lisible (REG-<année>-<séquence>)
CREATE OR REPLACE FUNCTION trg_certificat_numero()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := 'REG-' || to_char(COALESCE(NEW.date_deces, current_date),'YYYY')
                  || '-' || lpad(nextval('seq_certificat_deces')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_deces_numero BEFORE INSERT ON certificat_deces
  FOR EACH ROW EXECUTE FUNCTION trg_certificat_numero();

-- 16.e certificat de décès → clôture du séjour lié en 'deces'
CREATE OR REPLACE FUNCTION trg_deces_cloture_sejour()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.sejour_id IS NOT NULL THEN
    UPDATE sejour
       SET sorti_le   = COALESCE(sorti_le, (NEW.date_deces + COALESCE(NEW.heure_deces,'00:00'))::timestamptz),
           mode_sortie = 'deces'
     WHERE id = NEW.sejour_id AND sorti_le IS NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_deces_cloture AFTER INSERT ON certificat_deces
  FOR EACH ROW EXECUTE FUNCTION trg_deces_cloture_sejour();

-- =====================================================================
-- 17. Fonctions métier (transactions cohérentes multi-tables)
-- =====================================================================
-- Hospitaliser depuis les urgences : crée le séjour, occupe le lit,
-- clôt le passage. Échoue si le lit n'est pas libre (index uq_lit_occupe).
CREATE OR REPLACE FUNCTION hospitaliser_depuis_urgence(
  p_passage uuid, p_lit uuid, p_medecin uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_pass passage_urgence; v_sejour uuid;
BEGIN
  SELECT * INTO v_pass FROM passage_urgence WHERE id = p_passage FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Passage urgence introuvable'; END IF;
  IF v_pass.statut = 'oriente' THEN RAISE EXCEPTION 'Passage déjà orienté'; END IF;

  INSERT INTO sejour(patient_id, medecin_id, motif, etat_clinique, provenance_urgence)
  VALUES (v_pass.patient_id, p_medecin, v_pass.motif,
          (CASE WHEN v_pass.triage <= 2 THEN 'critique'
                WHEN v_pass.triage = 3 THEN 'surveillance' ELSE 'stable' END)::etat_clinique,
          v_pass.id)
  RETURNING id INTO v_sejour;

  INSERT INTO affectation_lit(sejour_id, lit_id) VALUES (v_sejour, p_lit);

  UPDATE passage_urgence
     SET statut='oriente', orientation='hospitalisation',
         oriente_le=now(), sejour_id=v_sejour
   WHERE id = p_passage;

  RETURN v_sejour;
END $$;

-- =====================================================================
-- 18. Vues de lecture (alignées sur les écrans de l'UI)
-- =====================================================================
-- État de chaque lit + occupant courant
CREATE VIEW v_lit_etat AS
SELECT l.*,
       s.id AS sejour_id, p.id AS patient_id, p.nom, s.etat_clinique,
       (a.id IS NOT NULL) AS occupe
FROM lit l
LEFT JOIN affectation_lit a ON a.lit_id = l.id AND a.fin IS NULL
LEFT JOIN sejour s ON s.id = a.sejour_id
LEFT JOIN patient p ON p.id = s.patient_id;

-- File des urgences active (tri + minutes d'attente + dépassement)
CREATE VIEW v_file_urgences AS
SELECT u.*, p.nom, p.code_dossier, tc.libelle_fr, tc.couleur,
       EXTRACT(epoch FROM now() - u.arrive_le)::int / 60 AS minutes_attente,
       (u.statut = 'attente'
        AND now() - u.arrive_le > make_interval(mins => tc.delai_cible_min)) AS depasse
FROM passage_urgence u
JOIN triage_cible tc ON tc.niveau = u.triage
LEFT JOIN patient p ON p.id = u.patient_id
WHERE u.statut <> 'oriente'
ORDER BY u.triage, u.arrive_le;

-- Patients actuellement hospitalisés (séjours ouverts) + lit
CREATE VIEW v_patients_actuels AS
SELECT s.*, p.nom, p.code_dossier, patient_age(p) AS age,
       l.salle, l.code AS lit, l.type AS type_lit, u.nom AS medecin
FROM sejour s
JOIN patient p ON p.id = s.patient_id
LEFT JOIN affectation_lit a ON a.sejour_id = s.id AND a.fin IS NULL
LEFT JOIN lit l ON l.id = a.lit_id
LEFT JOIN utilisateur u ON u.id = s.medecin_id
WHERE s.sorti_le IS NULL;

-- Archives (séjours clôturés) avec durée de séjour
CREATE VIEW v_archives AS
SELECT s.*, p.nom, p.code_dossier,
       (s.sorti_le::date - s.admis_le::date) AS duree_jours
FROM sejour s
JOIN patient p ON p.id = s.patient_id
WHERE s.sorti_le IS NOT NULL;

-- =====================================================================
-- 19. Rôles applicatifs (droits minimaux)
-- =====================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='afiya_app') THEN
    CREATE ROLE afiya_app LOGIN;      -- connexion de l'application
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='afiya_lecture') THEN
    CREATE ROLE afiya_lecture LOGIN;  -- reporting / lecture seule
  END IF;
END $$;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO afiya_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO afiya_lecture;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO afiya_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO afiya_app;
-- pas de DELETE pour l'app : on n'efface pas un dossier médical (clôture/archive).

-- =====================================================================
-- 20. Données de référence (barème de triage)
-- =====================================================================
INSERT INTO triage_cible(niveau, libelle_fr, libelle_ar, couleur, delai_cible_min) VALUES
  (1,'Urgence vitale','خطر حيوي','Rouge',0),
  (2,'Très urgent','عاجل جداً','Orange',20),
  (3,'Urgent','عاجل','Jaune',60),
  (4,'Peu urgent','أقل إلحاحاً','Vert',120),
  (5,'Non urgent','غير عاجل','Bleu',240)
ON CONFLICT (niveau) DO NOTHING;

COMMIT;
