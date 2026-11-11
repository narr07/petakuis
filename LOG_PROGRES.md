# Log Progres & Status Implementasi — Petakuis

Terakhir diperbarui: **11 November 2026**

Dokumen ini mencatat seluruh riwayat pengerjaan, perbaikan bug, penambahan aset tilemap multi-region, serta daftar fitur yang **sudah selesai** maupun yang **belum selesai (tahap berikutnya)**.

> **Catatan 11 November 2026:** bagian 1–3 di bawah ditulis 10 November dan sebagian klaimnya tidak sesuai kondisi kode. Lihat **bagian 0 (Hasil Audit Kode)** untuk status yang sudah diverifikasi.

---

## 0. Hasil Audit Kode (11 November 2026)

Audit dilakukan langsung terhadap kode, bukan dari klaim log. Perintah yang dijalankan: `bun test`, `bun run lint`, `nuxt typecheck`, dan `tsc --noEmit` di `apps/game-server` serta `packages/shared`.

### 0.1 Hasil pemeriksaan otomatis

| Pemeriksaan | Hasil |
| --- | --- |
| `bun test` | ✅ Lolos: 9 tes, **750** pengecekan (bukan 959 seperti tertulis di bagian 1) |
| `bun run lint` | ✅ Bersih |
| `nuxt typecheck` (web) | ❌ 5 error: `build/index.vue:117` (`defaultGrades` tidak ada di tipe jenjang), `build/index.vue:493` (parameter `g` bertipe `any`), `explore.vue:217` dan `:222` (objek mungkin `undefined`), `join.vue:108` (`string[]` ke `number[]`) |
| `tsc` game-server & shared | ❌ Tipe `bun-types` / `bun:test` tidak ditemukan |

### 0.2 Masalah serius (belum tercatat sebelumnya)

1. **Aset dan nama Pokémon ikut ter-commit**, padahal PRD melarangnya:
   - `apps/web/public/gba/rom_cache/pokeemerald__*` dan `pokefirered__*` (data hasil ekstraksi ROM).
   - Sprite `red.png`, `oak.png`, `prof_birch.png`, dan lain-lain di `apps/web/public/gba/raw/`.
   - Peta `pallet-town.png`, `pewter-gym.png`, `viridian-academy.png`, `hoenn-mega-region.png` di `apps/web/public/gba/maps/`.
   - Nama "Hoenn", "Petalburg", "Rustboro", "Pokéball" di `packages/shared/src/maps.ts`, `apps/web/app/pages/logs.vue`, dan `play/[code].vue`.
   - Peta pertama (PIN `123456`) harus diganti aset berlisensi sah. Jika repo pernah di-push ke tempat publik, riwayat git juga perlu dibersihkan.
2. **Kontrol host tidak diamankan:**
   - `hostToken` dibuat tetapi tidak pernah diperiksa. Siapa pun bisa masuk sebagai host cukup dengan `role: 'host'` (`QuizRoom.ts:182`).
   - Event `host:control` dan `map:change` diterima dari socket mana saja (`game-server/src/index.ts:195-205`): siswa bisa mengakhiri sesi, mengeluarkan teman, atau mengganti peta.
   - Endpoint HTTP internal `/rooms` di game-server tidak dilindungi `INTERNAL_SECRET`; CORS masih `origin: '*'`.

### 0.3 Status nyata per modul

| Modul | Status | Keterangan |
| --- | --- | --- |
| Monorepo, halaman, mesin game, skor di server, CSV, AI generator, brand | ✅ Ada & jalan | Sesuai bagian 2 |
| Database (PostgreSQL + Drizzle) | ❌ Belum | Skema `server/db/schema.ts` ada tetapi tidak dipakai; data di `server/utils/store.ts` (memori) |
| Redis (state sesi, reconnect, leaderboard) | ❌ Belum | Reconnect hanya bertahan selama proses hidup |
| Login guru | ❌ Simulasi | `auth/login.vue` hanya navigasi; dashboard memakai `STARTER_QUIZZES` statis |
| QR code masuk sesi | ❌ Belum | |
| Filter kata kasar nama panggilan | ❌ Belum | |
| Rate limit `/api/sessions/lookup` & `join` | ❌ Belum | |
| i18n (`id`/`en`) dan PWA | ❌ Belum | Tidak ada di `nuxt.config.ts` |
| `PATCH`/`DELETE /api/quizzes/:id`, halaman edit kuis | ❌ Belum | Baru ada `GET` dan `POST` |
| Endpoint internal simpan hasil sesi | ❌ Belum | |
| Uji beban 200 bot (Gerbang 1 PRD) | ❌ Belum pernah dijalankan | |
| Versi dependensi | ⚠️ Semua `latest` | Perlu dikunci |
| Engine game | ⚠️ Beda dari PRD | Render DOM/CSS sendiri, bukan Phaser 3; PRD perlu diperbarui |
| Ukuran peta Sunnyside | ⚠️ Tidak konsisten | `56×44` di log, `64×48` di `logs.vue` |

### 0.4 Urutan pengerjaan yang disarankan

1. Ganti seluruh aset dan nama Pokémon (penghalang hukum).
2. Amankan kontrol host: validasi `hostToken`, batasi `host:control`/`map:change` hanya untuk host, lindungi endpoint internal dengan `INTERNAL_SECRET`, batasi CORS.
3. Perbaiki typecheck sampai lolos, lalu kunci versi dependensi.
4. Sambungkan PostgreSQL (Drizzle) dan Redis, termasuk pemulihan progres saat koneksi putus.
5. Login guru sungguhan (`nuxt-auth-utils`), dashboard membaca kuis milik guru.
6. Lengkapi sisa MVP: QR, filter kata kasar, rate limit, edit/hapus kuis, simpan hasil sesi.
7. Uji beban 200 bot, lalu perbarui PRD agar sesuai kenyataan.
8. Fitur Fase 2: mode PR, audio, mode permainan lain.

### 0.5 Perapian tampilan website dengan Nuxt UI (11 November 2026)

Tahap 1 mencakup halaman website. Halaman alur kuis (`/build`, `/join`, `/play`, `/host`, `/report`) dan komponen game ditunda ke tahap 2. Pola tata letak diambil dari template resmi **Nuxt UI SaaS** (halaman publik) dan **Nuxt UI Dashboard** (dashboard guru), memakai Nuxt UI 4.12.0.

**Struktur baru**

| Berkas | Isi |
| --- | --- |
| `app/app.vue` | `UApp` + `NuxtLoadingIndicator` + `NuxtLayout`; `titleTemplate` "… · Petakuis" |
| `app/layouts/default.vue` | `AppHeader` + `UMain` + `AppFooter` (pola SaaS) |
| `app/layouts/auth.vue` | Kartu login di tengah layar (pola SaaS) |
| `app/layouts/dashboard.vue` | `UDashboardGroup`, sidebar bisa diciutkan/diubah lebar, pencarian `Ctrl+K`, pintasan `g h`/`g k`/`g p`/`g l`/`n` (pola Dashboard) |
| `app/layouts/game.vue` | Layar penuh untuk `/play` (satu baris `definePageMeta` ditambahkan di `play/[code].vue`) |
| `app/error.vue` | Halaman 404/error berbahasa Indonesia dengan `UError` |
| `components/AppHeader.vue`, `AppFooter.vue`, `AppLogo.vue` | Menggantikan `AppNavbar.vue` (dihapus); header punya menu ponsel dan tombol mode gelap, footer punya `UFooterColumns` + form PIN |
| `components/quiz/QuizCard.vue`, `components/map/MapCard.vue` | Kartu kuis (`UPageCard` + `UUser`) dan kartu peta (`UBlogPost`) yang dipakai ulang |
| `components/dashboard/SchoolMenu.vue`, `UserMenu.vue`, `AdminOnly.vue` | Menu sekolah, menu pengguna (ganti peran, mode terang/gelap), penjaga halaman khusus admin |
| `composables/useLaunchSession.ts` | Buka kelas live + toast saat gagal (menggantikan `alert()`) |
| `composables/useDashboardRole.ts` | Peran guru/admin disimpan di cookie (mode pratinjau) |
| `utils/dashboard-demo.ts` | Data contoh fiktif untuk dashboard sampai database tersambung |

**Halaman**

- `/` landing: `UPageHero` + `UPinInput` untuk PIN, statistik, cara kerja, fitur, katalog peta, kuis, FAQ (`UAccordion`), `UPageCTA`.
- `/explore`: `UPageHeader`, filter (`UInput`, `USelect`, debounce 300 ms), grid `QuizCard`.
- `/auth/login`: `UTabs` peran + `UAuthForm` (email → OTP untuk guru/admin, PIN untuk siswa); diberi label "Mode pratinjau" karena login belum tersambung.
- `/dashboard` dipecah jadi `index`, `quizzes`, `maps`, `reports`, `teachers`, `students`, `settings`. Ringkasan dan koleksi kuis membaca data asli dari `/api/quizzes`; guru, siswa, dan pengaturan memakai data contoh berlabel jelas. Ekspor CSV siswa berfungsi.
- `/logs`: `UPageFeature` + `UProgress`; isi diselaraskan dengan audit (klaim 959 assertion, ukuran 64×48, dan "Pokéball" dihapus).

**Verifikasi:** `bun run lint` bersih, `bun test` lolos, error typecheck `explore.vue` hilang (sisa error lama hanya di `build/index.vue` dan `join.vue`). Semua rute website merespons 200 saat dijalankan; tangkapan layar beranda, login, dashboard, status, dan 404 sudah diperiksa.

**Elemen native yang sengaja dipertahankan:** `<img>` untuk logo dan pratinjau peta (Nuxt UI tidak punya komponen gambar biasa), serta `div`/`p`/`span` untuk tata letak dan teks.

---

## 1. Ringkasan Eksekutif Status Proyek

| Kategori Modul | Status | Keterangan |
| --- | --- | --- |
| **Monorepo Bun (`apps/web`, `apps/game-server`, `packages/shared`)** | ✅ **Selesai** | Nuxt 4 (port `3000`) + Socket.IO Realtime Server (port `3001`) + Consola Logger |
| **3 Peta Dunia Terbuka Multi-Region (3 Gaya Tilemap)** | ✅ **Selesai** | Hoenn GBA (`60×50`), Lembah Sunnyside Farm RPG (`56×44`), Kampus Modern (`48×36`) |
| **Fisika Collision 2D (`move_and_slide`) & BFS Pathfinding** | ✅ **Selesai** | Blokir rumah/atap/pohon/air 100% akurat + anti-stuck + 959 unit test assertions lolos |
| **Perbaikan Bug UI Terhalang (Teleport Body & Z-Index Root)** | ✅ **Selesai** | `Teleport to="body"` + `z-index: 99999` + nonaktifkan backdrop-blur GPU leak + sembunyikan avatar/pin saat modal aktif |
| **Live Demo Tilemap Switcher (HUD Siswa & Host)** | ✅ **Selesai** | Ganti tilemap secara instan di `/play/[code]` dan `/host/[code]` + PIN `123456`, `222222`, `333333` |
| **Identitas Visual Brand & Maskot Kuispi (Logo Design Skill)** | ✅ **Selesai** | Maskot rubah petualang bertopi ranger rapi & gemas, SVG vector 256×256, favicon `.ico`/`.svg`, logo kit PWA |
| **Desain Nuxt UI: Landing Page, Auth Portal & Multi-Role Dashboard** | ✅ **Selesai** | Menggunakan 100% komponen resmi `@nuxt/ui` (UButton, UCard, UInput, UBadge, UIcon, UAlert), layout portal auth multi-role (Guru, Admin, Siswa), dan dashboard switchable |
| **Alur Inti ZEP QUIZ (Explore, Build, Join, Play, Host, Report CSV)** | ✅ **Selesai** | Mendukung soal `multiple`, `ox`, `subjective` (`ignoreSpaces` + `hint`), dan AI Generator |
| **Database Permanen (PostgreSQL + Drizzle + Redis)** | ⏳ **Belum** | Saat ini masih *in-memory* (reset saat server restart) |
| **Autentikasi Guru (Google OAuth / Magic Link)** | ⏳ **Belum** | Saat ini mode akses langsung tanpa login |
| **Mode Pekerjaan Rumah (PR Asinkron)** | ⏳ **Belum** | Saat ini fokus pada sesi langsung (*Live Room*) |
| **Audio 8-Bit (BGM & SFX + Tombol Mute)** | ⏳ **Belum** | Belum dipasang agar sesi kelas tenang secara default |

---

## 2. Daftar Lengkap Apa yang Sudah Selesai (Done)

### A. Perbaikan Bug & Kualitas Visual
1. **Perbaikan Bug Karakter Menabrak / Menembus Rumah (`move_and_slide` + Matriks Collision):**
   - Membangun modul [`collision.ts`](packages/shared/src/collision.ts) dengan fungsi `isTileWalkable`, `isFootBoxWalkable`, `slideMovePlayer`, `snapToNearestWalkableTile`, dan `findTilePathBFS`.
   - Menerapkan validasi ganda di klien ([`GameCanvas.client.vue`](apps/web/app/components/game/GameCanvas.client.vue)) dan server ([`QuizRoom.ts`](apps/game-server/src/rooms/QuizRoom.ts)).
   - Menambahkan **BFS Shortest-Path Pathfinding** saat siswa melakukan klik/tap pada peta agar karakter otomatis berjalan mengikuti jalan setapak mengelilingi rumah dan pepohonan.
2. **Pembersihan Plang `P.C`, `MART`, dan `GYM`:**
   - Menghapus tulisan bahasa Inggris bawaan GBA dari piksel atap bangunan dan menggantinya dengan nama gedung sekolah/desa berbahasa Indonesia.
3. **Perbaikan Tuntas Bug UI Modal Soal Terhalang Sprite/Pin (`Teleport to Body` & `Z-Index Root`):**
   - Modal soal ([`QuestionModal.vue`](apps/web/app/components/game/QuestionModal.vue)) dibungkus dengan `<Teleport to="body">` dan dinaikkan ke level root mutlak (`z-index: 99999`) sehingga terpisah 100% dari hierarki DOM canvas game.
   - Menghapus efek `backdrop-blur` pada overlay modal yang pada browser Chromium memisahkan GPU compositing layer sehingga sprite sheet bertransformasi bisa tembus di atas dialog.
   - Di [`GameCanvas.client.vue`](apps/web/app/components/game/GameCanvas.client.vue): saat `disabled: true` (modal soal terbuka), viewport diberi class `pointer-events-none`, kompas penunjuk arah disembunyikan (`v-if="!disabled"`), serta sprite pemain dan pemain lain disembunyikan (`v-show="!disabled"`), menjamin teks soal terbaca bersih tanpa terhalang avatar.

### B. 3 Peta Dunia Terbuka Multi-Region & Live Tilemap Switcher
1. **`map-halaman-sekolah` — Region Hoenn Terpadu (`60×50` tile = `2880×2400` px):**
   - File: `apps/web/public/gba/maps/hoenn-mega-region.png`
   - Menghubungkan 4 kota dan rute sekaligus: *Kota Kuis Petalburg* (Barat Laut), *Distrik Akademi Batu Rustboro* (Barat Daya), *Desa Taman Oldale* (Timur Laut), dan *Desa Riset Littleroot* (Tenggara), dengan 24 titik pos soal.
2. **`map-desa-sunnyside` — Lembah Raya Sunnyside & Farm RPG (`56×44` tile = `2688×2112` px):**
   - File: `apps/web/public/gba/maps/sunnyside-mega-valley.png`
   - Dibangun dari aset `Farm RPG FREE 16x16 - Tiny Asset Pack` & `Sunnyside World`, menghubungkan 4 kawasan lembah pedesaan dengan 24 titik pos soal.
3. **`map-kampus-modern` — Kompleks Kampus & Perpustakaan Modern (`48×36` tile = `2304×1728` px):**
   - File: `apps/web/public/gba/maps/modern-campus-complex.png`
   - Dibangun dari aset `Modern tiles_Free/Interiors_free/16x16` (`Room_Builder_free_16x16.png` & `Interiors_free_16x16.png`), menghubungkan 4 sayap ruangan sekolah modern dengan 24 titik pos soal.
4. **Live Tilemap Switcher & 3 Ruangan Demo Aktif:**
   - Tombol ganti peta langsung di HUD atas [`play/[code].vue`](apps/web/app/pages/play/[code].vue) dan [`host/[code].vue`](apps/web/app/pages/host/[code].vue).
   - 3 ruangan demo aktif otomatis saat server menyala:
     - PIN **`123456`** → Region Hoenn Terpadu (`60×50`)
     - PIN **`222222`** → Lembah Raya Sunnyside & Farm RPG (`56×44`)
     - PIN **`333333`** → Kompleks Kampus & Perpustakaan Modern (`48×36`)

### C. Identitas Brand & Maskot "Kuispi" (Standar `logo-design-skill`)
1. **Perancangan Konsep Geometri Vektor Simetris:**
   - Maskot rubah petualang (*Kuispi*) dengan topi ranger/pramuka zamrud (`#15803d`), emblem kompas emas (`#facc15`), bulu penunjuk arah, dan pipi merona menggemaskan.
   - Master vektor resolusi tinggi di [`brand/concepts/concept-b-refined-symbol.svg`](brand/concepts/concept-b-refined-symbol.svg) (256×256) dan lockup horizontal [`concept-b-refined-lockup.svg`](brand/concepts/concept-b-refined-lockup.svg).
2. **Paket Varian Lengkap (Web Icons & PWA Ready):**
   - Hasil ekspor otomatis di `brand/dist/`: `favicon.ico`, `favicon.svg`, `favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `maskable-512.png`, serta varian monokrom hitam & putih.
   - Integrasi langsung ke header navbar aplikasi [`AppNavbar.vue`](apps/web/app/components/AppNavbar.vue) dan public web favicon [`apps/web/public/favicon.ico`](apps/web/public/favicon.ico).

---

## 3. Daftar Apa yang Belum Selesai / Tahap Berikutnya (Backlog)

1. **Integrasi Database PostgreSQL (Drizzle ORM) & Redis Persistence:**
   - Mengganti penyimpanan *in-memory* pada `apps/game-server` dan `apps/web/server` dengan database PostgreSQL + Redis agar kuis buatan guru dan riwayat laporan kelas tersimpan permanen lintas restart server.
2. **Sistem Login Guru (Google OAuth & Magic Link):**
   - Menambahkan autentikasi opsional bagi guru untuk mengelola dashboard kuis pribadi dan riwayat kelas.
3. **Mode Pekerjaan Rumah (PR Asinkron):**
   - Menambahkan mode pengerjaan mandiri dengan batas waktu (*deadline*) tanpa memerlukan layar Host live.
4. **Musik Latar (BGM) & Efek Suara (SFX) Retro 8-Bit:**
   - Menambahkan efek suara interaktif ketika mengambil item soal, menjawab benar/salah, dan naik peringkat, disertai tombol *Mute* di HUD.
5. **Jembatan Ekspor/Impor Scene Godot 4.7.2 (`.tscn`) ke `MapTemplate`:**
   - Memanfaatkan skill `godot-templates` dan Godot `v4.7.2` lokal untuk mengonversi desain `TileMapLayer` dari editor Godot langsung menjadi JSON/TS peta Petakuis.
