#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/telegram-bot}"
DB_PATH="${DB_PATH:-"$APP_DIR/data_member.db"}"
BACKUP_DIR="${BACKUP_DIR:-"$APP_DIR/backups"}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
if [[ ! -f "$DB_PATH" ]]; then
  echo "Database tidak ditemukan: $DB_PATH" >&2
  exit 1
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="$BACKUP_DIR/data_member_$stamp.db"

# SQLite .backup membuat snapshot konsisten saat bot sedang berjalan.
sqlite3 "$DB_PATH" ".backup '$destination'"
find "$BACKUP_DIR" -type f -name 'data_member_*.db' -mtime +"$RETENTION_DAYS" -delete
echo "Backup dibuat: $destination"