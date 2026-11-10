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

## Menjalankan di Oracle Cloud VPS (Docker Compose)

```bash
cp .env.example .env
docker compose up -d --build
```
