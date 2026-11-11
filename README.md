# Petakuis

Platform kuis kelas interaktif berbasis eksplorasi peta pixel art 2D untuk guru dan siswa SD, SMP, dan SMA di Indonesia. Seluruh peta, mode permainan, kapasitas hingga 200 siswa per ruangan, dan laporan analitik CSV tersedia **100% gratis tanpa paywall**.

## Arsitektur Monorepo (Bun Workspaces)

- `packages/shared`: Skema tipe TypeScript, katalog 4 peta Nusantara, kontrak paket tupel Socket.IO, dan mesin penilaian (`scoring.ts`).
- `apps/game-server`: Server realtime berbasis Bun + Socket.IO dengan simulasi posisi 15 Hz, *Area of Interest (AoI)* filtering, radar guru 5 Hz, dan anti-curang di sisi server.
- `apps/web`: Aplikasi web Nuxt + Tailwind CSS + Pinia + kanvas game 2D interaktif, dilengkapi pembuat kuis 3 langkah (Pilih Peta, Kurikulum Indonesia, Editor Soal + AI Generator + Impor CSV).
- `tools/assets`: Konfigurasi pipeline aset pixel art [aldegad/sprite-gen](https://github.com/aldegad/sprite-gen) beserta 8 preset *recolor* seragam siswa.
- `docker-compose.yml` & `Caddyfile`: Konfigurasi siap deploy untuk **Oracle Cloud VPS** (ARM64 Ampere A1 / AMD64).

## Menjalankan Secara Lokal

1. Instal dependensi monorepo:
   ```bash
   bun install
   ```

2. Jalankan server realtime (`http://localhost:3001`):
   ```bash
   bun run dev:server
   ```

3. Pada terminal kedua, jalankan aplikasi web Nuxt (`http://localhost:3000`):
   ```bash
   bun run dev:web
   ```

4. Uji coba langsung menggunakan ruangan demo aktif dengan PIN **`123456`**.

## Menjalankan di VPS (Docker Compose)

Prasyarat: VPS Linux dengan Docker + plugin Compose (x86_64 atau ARM64).

```bash
git clone https://github.com/narr07/petakuis.git && cd petakuis
cp .env.example .env
# isi PUBLIC_URL (mis. https://petakuis.domainmu.com) dan INTERNAL_SECRET (openssl rand -hex 32)
docker compose up -d --build
docker compose logs -f web game-server   # pantau sampai keduanya siap
```

Web dan game server hanya dibuka di `127.0.0.1` (`WEB_PORT`, bawaan 3100; `GAME_PORT`, bawaan 3101).
Pasang di belakang proxy yang sudah ada. Contoh **Cloudflare Tunnel** (Zero Trust → Networks →
Tunnels → Public Hostname), dua aturan untuk hostname yang sama, urutan seperti ini:

1. Path `socket.io` → `http://localhost:3101`
2. Tanpa path → `http://localhost:3100`

VPS kosong tanpa proxy: jalankan juga Caddy (HTTPS otomatis, port 80/443 harus terbuka, isi
`CADDY_DOMAIN` di `.env`): `docker compose --profile caddy up -d --build`.

Memperbarui ke versi terbaru: `git pull && docker compose up -d --build`.

Data kuis dan laporan sesi tersimpan di berkas SQLite pada volume Docker `webdata`;
cadangkan volume ini secara berkala.
