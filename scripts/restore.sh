#!/usr/bin/env bash
# Restore the latest SQLite snapshot from S3 into the data dir, if one exists.
# Run on boot, before 'docker compose up'. Uses EC2 instance role for S3 auth.
set -euo pipefail

: "${BACKUP_BUCKET:?BACKUP_BUCKET must be set}"
DATA_DIR="${1:-/opt/office-quest/data}"
DB_FILE="${DATA_DIR}/quest.db"

mkdir -p "${DATA_DIR}"

if aws s3 ls "s3://${BACKUP_BUCKET}/db/latest.sqlite" >/dev/null 2>&1; then
    echo "Found snapshot in S3 -- restoring to ${DB_FILE}"
    aws s3 cp "s3://${BACKUP_BUCKET}/db/latest.sqlite" "${DB_FILE}"
else
    echo "No snaphost in S3 -- starting with a fresh database"
fi