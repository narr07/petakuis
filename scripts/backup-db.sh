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

# Salinan di luar VPS: Cloudflare R2 (S3-compatible), memakai curl --aws-sigv4 tanpa alat tambahan.
# Kunci disimpan di $R2_ENV (chmod 600), berisi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
# R2_SECRET_ACCESS_KEY, R2_BUCKET. Pakai token R2 "Object Read & Write" khusus bucket ini saja.
# Bucket menghapus objek otomatis setelah 30 hari (aturan lifecycle di Cloudflare).
R2_ENV="${R2_ENV:-$HOME/petakuis-backups/r2.env}"
if [ -f "$R2_ENV" ]; then
	# shellcheck disable=SC1090
	. "$R2_ENV"
	FILE="petakuis-$STAMP.db.gz"
	if curl --fail --silent --show-error --max-time 120 \
		--aws-sigv4 "aws:amz:auto:s3" \
		--user "$R2_ACCESS_KEY_ID:$R2_SECRET_ACCESS_KEY" \
		--upload-file "$DEST/$FILE" \
		"https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/$R2_BUCKET/$FILE" >/dev/null; then
		echo "$(date '+%F %T') terunggah ke R2: $R2_BUCKET/$FILE"
	else
		echo "$(date '+%F %T') GAGAL mengunggah ke R2 (cadangan lokal tetap ada)" >&2
		exit 1
	fi
else
	echo "$(date '+%F %T') R2 belum diatur ($R2_ENV tidak ada): hanya cadangan lokal"
fi
