#!/bin/sh
# Cadangan harian database SQLite Petakuis (dijalankan di VPS, dari folder repo).
#
#   sh scripts/backup-db.sh                 # sekali jalan
#   crontab (jam VPS UTC, 19.30 UTC = 02.30 WIB): 30 19 * * * cd ~/petakuis && sh scripts/backup-db.sh >> ~/petakuis-backups/backup.log 2>&1
#
# Memakai `VACUUM INTO` di dalam container web: salinan utuh dan konsisten walau aplikasi
# sedang dipakai. Hasil dikompres ke $BACKUP_DIR dan disimpan $BACKUP_KEEP_DAYS hari.
#
# Memulihkan (contoh):
#   gunzip -k ~/petakuis-backups/petakuis-YYYYMMDD-HHMMSS.db.gz
#   docker compose stop web
#   docker compose cp ~/petakuis-backups/petakuis-YYYYMMDD-HHMMSS.db web:/data/petakuis.db
#   docker compose run --rm --no-deps --entrypoint sh web -c 'rm -f /data/petakuis.db-wal /data/petakuis.db-shm'
#   docker compose start web
set -eu

cd "$(dirname "$0")/.."
DEST="${BACKUP_DIR:-$HOME/petakuis-backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
TMP="/data/cadangan-$STAMP.db"
mkdir -p "$DEST"

docker compose exec -T web node --input-type=module -e "
const { createRequire } = await import('node:module');
const dir = createRequire('/app/.output/server/index.mjs').resolve.paths('@libsql/client')[0];
const { createClient } = await import(dir + '/@libsql/client/lib-esm/node.js');
const db = createClient({ url: 'file:/data/petakuis.db' });
await db.execute({ sql: 'VACUUM INTO ?', args: ['$TMP'] });
const copy = createClient({ url: 'file:$TMP' });
const check = await copy.execute('PRAGMA integrity_check');
if (check.rows[0][0] !== 'ok') { console.error('Cadangan rusak:', check.rows[0][0]); process.exit(1); }
" </dev/null

docker compose cp "web:$TMP" "$DEST/petakuis-$STAMP.db"
docker compose exec -T web rm -f "$TMP" </dev/null
gzip -f "$DEST/petakuis-$STAMP.db"

find "$DEST" -name 'petakuis-*.db.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date '+%F %T') cadangan tersimpan: $DEST/petakuis-$STAMP.db.gz ($(du -h "$DEST/petakuis-$STAMP.db.gz" | cut -f1))"
