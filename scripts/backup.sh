#!/usr/bin/env bash
# Take a consistent SQLite snapshot and upload it to S3.
# Run periodically by the systemd timer, on shutdown, and manually before teardown.
set -euo pipefail

: "${BACKUP_BUCKET:?BACKUP_BUCKET must be set}"
DATA_DIR="${1:-/opt/office-quest/data}"
DB_FILE="${DATA_DIR}/quest.db"

if [ ! -f "${DB_FILE}" ]; then
	echo "No database at ${DB_FILE} yet — nothing to back up"
	exit 0
fi

TMP="$(mktemp /tmp/quest-backup.XXXXXX.db)"
trap 'rm -f "${TMP}"' EXIT

# .backup is an online backup: safe even while the app is writing.
sqlite3 "${DB_FILE}" ".backup '${TMP}'"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
aws s3 cp "${TMP}" "s3://${BACKUP_BUCKET}/db/latest.sqlite"
aws s3 cp "${TMP}" "s3://${BACKUP_BUCKET}/db/history/quest-${TS}.sqlite"

echo "Backup complete: ${TS}"
