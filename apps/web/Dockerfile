# Tahap build: pasang dependensi persis sesuai bun.lock, lalu bangun Nuxt.
FROM oven/bun:1.3.14-alpine AS build
WORKDIR /app

# Semua package.json workspace ikut disalin supaya bun.lock cocok (--frozen-lockfile).
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/game-server/package.json apps/game-server/
RUN bun install --frozen-lockfile --ignore-scripts

COPY packages/shared packages/shared
COPY apps/web apps/web
WORKDIR /app/apps/web
RUN bun run build

# Tahap jalan: hanya hasil build Nitro yang sudah membawa dependensinya sendiri.
# Dijalankan dengan Node (target build Nitro): sebagian paket libSQL memilih berkas
# berbeda untuk Bun, sehingga .output gagal bila dijalankan dengan Bun.
# Sama-sama Alpine (musl), jadi binari libSQL dari tahap build cocok di sini.
FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/apps/web/.output ./.output
COPY apps/web/server/db/migrations ./migrations
ENV NODE_ENV=production \
	NITRO_HOST=0.0.0.0 \
	NITRO_PORT=3000 \
	NUXT_DATABASE_URL=file:/data/petakuis.db \
	NUXT_MIGRATIONS_DIR=/app/migrations
VOLUME /data
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
