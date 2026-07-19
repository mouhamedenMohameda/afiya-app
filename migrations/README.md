# Migrations de base de données

Ce dossier contient les scripts SQL qui font évoluer le schéma des bases
(une base par hôpital : `afiya_cnpn`, `afiya_chme`, …).

## Convention de nommage
Numérote les fichiers dans l'ordre, avec une description courte :

```
001_creation_schema.sql
002_ajout_colonne_allergies.sql
003_table_ordonnances.sql
```

## Appliquer une migration (sur le serveur)
```bash
# à un seul hôpital
/root/deploy.sh migrate cnpn /var/www/afiya/migrations/002_ajout_colonne_allergies.sql

# à TOUS les hôpitaux (même schéma partout)
/root/deploy.sh migrate-all /var/www/afiya/migrations/002_ajout_colonne_allergies.sql
```

Le script fait **automatiquement une sauvegarde de la base concernée AVANT**
d'appliquer la migration. En cas d'erreur, la migration s'arrête (`ON_ERROR_STOP`)
et tu peux restaurer depuis `/var/backups/afiya/`.

> ⚠️ Actif seulement une fois PostgreSQL installé (backend). Tant qu'il n'y a pas
> de base, `migrate` affiche simplement « base absente ».
