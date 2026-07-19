#!/usr/bin/env bash
# =====================================================================
#  Afiya — script de déploiement & maintenance (à exécuter SUR LE SERVEUR)
#
#  Commandes :
#    ./deploy.sh update                  # met à jour l'UI de TOUS les hôpitaux
#    ./deploy.sh backup                  # sauvegarde manuelle (code + bases)
#    ./deploy.sh migrate <code> <f.sql>  # migration d'UN hôpital
#    ./deploy.sh migrate-all <f.sql>     # migration de TOUS les hôpitaux
#
#  ⚠️ Une SAUVEGARDE est faite AUTOMATIQUEMENT avant chaque modification.
# =====================================================================
set -euo pipefail

APP_DIR="/var/www/afiya"          # code partagé (clone git) — mis à jour par 'update'
CLIENTS_DIR="/var/www/clients"    # config.js par hôpital (jamais écrasé par git)
BACKUP_DIR="/var/backups/afiya"   # sauvegardes horodatées
BRANCH="main"                     # branche git déployée
DB_PREFIX="afiya_"                # bases : afiya_cnpn, afiya_chme, …
KEEP=30                           # nb de sauvegardes de code à conserver

ts()  { date +%Y%m%d-%H%M%S; }
say() { echo -e "$1"; }

# ---------- sauvegardes ----------
backup_code() {
  mkdir -p "$BACKUP_DIR"
  local dest="$BACKUP_DIR/code-$(ts).tar.gz"
  tar -czf "$dest" -C /var/www afiya clients 2>/dev/null || tar -czf "$dest" -C /var/www afiya
  say "🗂  Code sauvegardé → $dest"
  ls -1t "$BACKUP_DIR"/code-*.tar.gz 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f
}

db_exists() {
  command -v psql >/dev/null 2>&1 || return 1
  sudo -u postgres psql -lqt 2>/dev/null | cut -d'|' -f1 | grep -qw "$1"
}

backup_db() {
  local code="$1" db="${DB_PREFIX}${1}"
  if db_exists "$db"; then
    mkdir -p "$BACKUP_DIR"
    local dest="$BACKUP_DIR/db-${code}-$(ts).sql.gz"
    sudo -u postgres pg_dump "$db" | gzip > "$dest"
    say "🗄  Base $db sauvegardée → $dest"
  else
    say "ℹ️  Base $db absente (PostgreSQL pas encore en place) — sauvegarde base ignorée."
  fi
}

each_client() {   # imprime le code de chaque hôpital (d'après /var/www/clients/*/config.js)
  for cfg in "$CLIENTS_DIR"/*/config.js; do
    [ -e "$cfg" ] && basename "$(dirname "$cfg")"
  done
}

# ---------- commandes ----------
cmd_update() {
  say "▶  Mise à jour de l'interface (tous les hôpitaux)…"
  backup_code                                   # sauvegarde AVANT
  git -C "$APP_DIR" fetch --all --quiet
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
  say "✅  Interface à jour — tous les hôpitaux servent la dernière version."
}

cmd_backup() {
  backup_code
  for code in $(each_client); do backup_db "$code"; done
  say "✅  Sauvegarde complète terminée."
}

cmd_migrate() {
  local code="${1:-}" file="${2:-}"
  [ -n "$code" ] && [ -n "$file" ] || { say "Usage: deploy.sh migrate <code> <fichier.sql>"; exit 1; }
  [ -f "$file" ] || { say "❌  Fichier introuvable : $file"; exit 1; }
  say "▶  Migration de l'hôpital '$code'…"
  backup_db "$code"                             # sauvegarde AVANT
  db_exists "${DB_PREFIX}${code}" || { say "❌  Base absente — migration annulée."; exit 1; }
  sudo -u postgres psql -d "${DB_PREFIX}${code}" -v ON_ERROR_STOP=1 -f "$file"
  say "✅  Migration appliquée sur ${DB_PREFIX}${code} (sauvegarde faite avant)."
}

cmd_migrate_all() {
  local file="${1:-}"
  [ -f "$file" ] || { say "Usage: deploy.sh migrate-all <fichier.sql>"; exit 1; }
  for code in $(each_client); do
    say "— $code —"; backup_db "$code"
    if db_exists "${DB_PREFIX}${code}"; then
      sudo -u postgres psql -d "${DB_PREFIX}${code}" -v ON_ERROR_STOP=1 -f "$file" \
        && say "✅  $code OK" || say "⚠️  échec sur $code"
    else
      say "ℹ️  base absente pour $code — ignoré."
    fi
  done
}

case "${1:-}" in
  update)      cmd_update ;;
  backup)      cmd_backup ;;
  migrate)     shift; cmd_migrate "$@" ;;
  migrate-all) shift; cmd_migrate_all "$@" ;;
  *) say "Usage: deploy.sh {update | backup | migrate <code> <fichier.sql> | migrate-all <fichier.sql>}"; exit 1 ;;
esac
