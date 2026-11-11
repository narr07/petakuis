# Log Progres & Status Implementasi — Petakuis

Terakhir diperbarui: **11 November 2026**

Dokumen ini mencatat seluruh riwayat pengerjaan, perbaikan bug, penambahan aset tilemap multi-region, serta daftar fitur yang **sudah selesai** maupun yang **belum selesai (tahap berikutnya)**.

> **Catatan:** bagian 0.3, 1, 2, dan 3 adalah catatan lama (10–11 November) dan sebagian sudah tidak berlaku. **Status terbaru ada di bagian "Status Terkini" di bawah**; riwayat lengkap tiap pekerjaan ada di bagian 0.5–0.14.

---

## Status Terkini (11 November 2026, malam)

Situs online: **https://petakuis.permadi.dev** (VPS Oracle + Cloudflare Tunnel).

### ✅ Sudah selesai

| Bagian | Isi | Catatan |
| --- | --- | --- |
| Tampilan website | Beranda, jelajah, login, daftar, dashboard memakai Nuxt UI (template SaaS & Dashboard) | 0.5 |
| Peta & game | 6 peta original (Godot), batas tabrakan setengah tile, pantai berbuih, avatar CC0; aset & nama Pokémon dihapus termasuk dari riwayat git | 0.6–0.8 |
| Keamanan sesi live | Kontrol host dengan token, room demo hanya tonton, endpoint internal pakai `INTERNAL_SECRET`, CORS dibatasi; penilaian di server | 0.9 |
| Kualitas kode | Typecheck & lint bersih, versi dependensi dikunci | 0.9 |
| Database | SQLite (libSQL + Drizzle) dengan migrasi; kuis & laporan sesi tetap ada setelah restart | 0.10 |
| Deploy | Docker Compose di VPS, Cloudflare Tunnel, situs lain di VPS tidak terganggu | 0.11 |
| Login | Email + kata sandi (wajib konfirmasi email), lupa/atur ulang sandi lewat Resend, Google; pilih Guru/Siswa saat daftar; admin dari email server | 0.12–0.13 (online) |
| Halaman Kebijakan Privasi & Ketentuan | Syarat Google OAuth produksi | 0.12 (online) |
| Cloudflare | Aturan blokir bot/scanner zona permadi.dev berlaku untuk Petakuis; rate limit disesuaikan agar satu kelas (satu IP sekolah) tidak terblokir; `/api/internal/` diblokir dari internet | 0.13 |
| Menu admin | Administrasi & **Log Server** hanya untuk admin (menu, middleware, API) | 0.14 (**lokal, belum di-push**) |
| Edit & hapus kuis | Pemilik atau admin; konfirmasi sebelum hapus | 0.14 (**lokal, belum di-push**) |
| Celah keamanan ditutup | Token reset/verifikasi bocor di log publik; kunci jawaban terkirim ke publik | 0.13–0.14 (**lokal, belum di-push**) |

### ⏳ Sedang berjalan

1. **Push & deploy pekerjaan 0.13 (perbaikan log) dan 0.14** ke VPS. Sampai itu terjadi, situs online masih mengirim kunci jawaban lewat `/api/quizzes`; `/logs` dan `/api/logs` sementara diblokir lewat aturan Cloudflare.
2. Setelah deploy: hapus blokir sementara `/logs`/`/api/logs` dari aturan Cloudflare "Petakuis: endpoint internal…".
3. Uji login di situs online oleh pemilik: Google sebagai admin, dan daftar email (memastikan email konfirmasi dari Resend sampai).

### ❌ Belum dikerjakan (urut prioritas)

| # | Pekerjaan | Keterangan |
| --- | --- | --- |
| 1 | ~~Halaman admin Guru, Siswa, Pengaturan Sekolah~~ | Selesai di lokal (0.15) |
| 2 | ~~Pengaman kelas~~ | Selesai di lokal (0.15); tangkapan layar QR & peringatan nama belum diperiksa |
| 3 | ~~Backup database harian di VPS~~ | Selesai (0.16): cron 02.30 WIB |
| 4 | ~~Halaman kuis dengan Nuxt UI~~ | Selesai & online (0.18) |
| 5 | ~~Uji beban 200 siswa~~ | Selesai (0.17); perbaikan batas 200 siswa sudah online |
| 6 | ~~Generator tilemap~~ | Selesai (0.19) |
| 7 | Fase berikutnya | Mode PR tanpa host live, efek suara + tombol mute, i18n (id/en), PWA |

Tidak lagi direncanakan: PostgreSQL dan Redis (diganti SQLite untuk satu VPS, lihat 0.10).
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

### 0.6 Tiga peta baru dan katalog bangunan (11 November 2026)

Permintaan meniru region Pokémon tidak dikerjakan (tata letak region adalah desain level milik game tersebut, dan PRD melarangnya). Sebagai gantinya dibuat tiga peta orisinal bergenre sama dari paket Sunnyside, lewat pipeline Godot di `tools/godot-maps`.

| Peta | ID / PIN demo | Isi |
| --- | --- | --- |
| Pesisir Karang | `map-pesisir-karang` / `444444` | Kampung nelayan 15 rumah, pantai, dermaga, rumah panggung, kincir panggung, mercusuar, pulau bertitian |
| Dataran Tinggi Angin | `map-dataran-angin` / `555555` | Tiga undakan tebing bertangga, dua kincir besar, kandang domba, telaga, kampung, ladang, sungai berjembatan |
| Kota Pasar | `map-kota-pasar` / `666666` | Blok kota, alun-alun pasar (kios, sumur, patung), kanal berjembatan, balai kota, menara kayu berkincir, 23 bangunan |

Semua berukuran 64×48 tile, masing-masing 24 pos soal yang dipilih otomatis dan diperiksa keterjangkauannya.

**Katalog bangunan** (`tools/godot-maps/scripts/buildings.gd`): 23 bangunan hasil deteksi otomatis kelompok tile di room contoh paket, termasuk 8 yang baru (mercusuar/menara batu, menara kayu besar, menara merah, rumah oranye atap samping, dua gudang, dua rumah panggung). Empat bangunan otomatis dipasangi baling-baling kincir sesuai posisinya di room contoh. Cermin bangunan tidak dipakai karena arah bayangan jadi terbalik.

**Perubahan lain:** `sunnyside_kit.gd` mendapat `place()`, `add_sprite_centered()`, dan fungsi dekorasi bersama (`fill_ground`, `forest_ring`, `scatter_nature`, `fence_row`, `crop_rows`); `run.sh` bisa membangun semua peta atau satu peta; peta didaftarkan di `maps.ts` lewat `godotMap()`; room demo baru di game server; label peta di pemilih peta `/play`.

**Verifikasi:** `bun test` lolos (828 pengecekan, naik dari 750 karena tiga peta baru ikut diuji), lint bersih, peta tampil dan bisa dimainkan di `/play/666666`.

**Belum:** medan pasir dengan tepi sendiri (pantai memakai jalan terang), dan sprite avatar pemain saat ini masih karakter "Red" dari Pokémon (`gba/raw`), yang harus diganti bersama aset Pokémon lainnya.

### 0.7 Batas tabrakan mengikuti gambar (11 November 2026)

**Masalah:** pemain berhenti terlalu jauh dari benda, misalnya kios pasar. Penyebabnya, sel 16 px ditandai terhalang asal berisi satu piksel benda, sehingga kolom yang hanya berisi ujung tiang kios ikut jadi tembok.

**Perbaikan:**

- Peta hasil Godot kini punya `collisionFineRows`: grid setengah tile (8 px). Untuk bangunan dan benda multi-tile, sel kecil ditutup hanya bila pikselnya menutupi ≥ 35% sel itu (`FINE_FILL` di `sunnyside_kit.gd`); air, hutan, tebing, dan dekor kecil tetap menutup sel penuh. Pada tile air diagonal, pojok rumputnya dibuka.
- `isFootBoxWalkable` (dipakai klien dan server) memakai grid halus bila ada. Pencarian jalan, validasi pos soal, dan tes keterjangkauan tetap memakai `collisionRows`; sel 16 px terhalang bila salah satu sel kecilnya terhalang.
- `export_map.gd` menyelaraskan grid halus dengan layer `Collision`, jadi suntingan tangan di editor Godot tetap berlaku.
- Ditemukan lewat overlay: titian ke rumah panggung tengah di Pesisir Karang tidak tersambung ke pantai sehingga tertutup sebagai kantong; titian kini dimulai di pasir.
- Gambar keempat peta Godot tidak berubah (hash sama); yang berubah hanya data tabrakan.

**Verifikasi (0.7):** overlay tabrakan diperiksa untuk keenam peta. Kampus Modern dan Hoenn dibuat manual tanpa data layer, jadi tetap memakai grid per tile; kotak penghalangnya sudah sesuai bangunan dan perabot. Tes baru `collision.test.ts`: ukuran dan keselarasan grid halus, dan pemain bisa merapat ke kios (berhenti di 28,8 tile; sebelumnya 29,3). Total 12 tes lolos.

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

### 0.8 Avatar baru, pantai berbuih, dan aset Pokémon dihapus (11 November 2026)

**Avatar pemain:** 8 sprite trainer Pokémon diganti karakter dari paket Ninja Adventure (Pixel-boy & AAA, lisensi CC0) lewat `tools/godot-maps/scripts/build_avatars.gd`. Keluaran `apps/web/public/avatars/<id-seragam>.png`, 9 frame 16×16 dengan urutan arah yang sama seperti sebelumnya, jadi logika animasi tidak berubah; ukuran tampilan di `GameCanvas` (48 px untuk diri sendiri, 40 px untuk pemain lain) dan `join.vue` disesuaikan. ID warna seragam tetap; label diganti julukan deskriptif (Si Rambut Merah, Si Ninja Biru, dan seterusnya). Karakter Child dan OldWoman tidak dipakai karena frame jalannya tidak lengkap.

**Pantai:** `kit.shoreline()` memasang garis pantai berbuih dari paket (tile 19..24 baris 5..6) di sel air yang menempel pasir, mengikuti cara pantai digambar di room contoh paket. Sudut pantai memakai air penuh plus potongan sudut berpasir supaya tidak ada rumput yang mengintip. Dipakai di Pesisir Karang.

**Aset Pokémon dihapus:**

- Peta Hoenn (`map-halaman-sekolah`) dihapus dari katalog; Pesisir Karang menjadi peta pertama dan peta room demo `123456` (room `444444` dihapus karena kini sama).
- Seluruh `apps/web/public/gba/` dihapus: peta GBA, sprite trainer, palet, dan data hasil ekstraksi ROM. Gambar Kampus Modern (dari paket Modern Tiles) dipindah ke `apps/web/public/maps/`.
- Nama dan istilah Pokémon di kuis contoh, label avatar, pemilih peta, dan teks "trainer" di halaman Join diganti.
- Tes yang khusus memakai peta Hoenn ditulis ulang memakai rumah di Kota Pasar; uji pencarian jalan kini berlaku untuk semua peta.
- Riwayat git dibersihkan dari `apps/web/public/gba/` (lihat catatan di bawah).

**Verifikasi:** `bun test` 12 tes lolos, lint bersih, typecheck tanpa error baru (sisa error lama di `build/index.vue` dan `join.vue`). Halaman beranda, join, jelajah, build, dashboard, dan game diperiksa berjalan; tangkapan layar game di room `123456` menampilkan avatar baru dan pantai berbuih.

### 0.9 Keamanan kontrol host, typecheck bersih, dan persiapan deploy (11 November 2026)

**Keamanan kontrol host (`apps/game-server`, `apps/web`):**

- Layar host wajib mengirim `hostToken` yang cocok (dibandingkan dengan `timingSafeEqual`). Token dibuat `crypto.randomUUID()` di `POST /api/sessions`, disimpan di browser guru (`app/utils/hostToken.ts`), lalu dikirim layar host.
- `host:control` hanya diterima dari socket host yang terverifikasi (`host:denied` untuk lainnya). `map:change` hanya dari host terverifikasi, kecuali di room demo (`map:denied`).
- Room demo memakai token acak yang tidak pernah dibagikan: layar host-nya bisa dibuka siapa saja dalam **mode pantau** (tombol kendali nonaktif), pemain boleh mencoba ganti peta.
- `POST /rooms` di game server wajib membawa header `x-internal-secret`; kode yang sedang dipakai ditolak (409) dan web mencoba kode lain, jadi room aktif tidak bisa tertimpa. Di produksi game server menolak menyala bila `INTERNAL_SECRET` kosong atau masih nilai bawaan.
- CORS Socket.IO dibatasi ke `ALLOWED_ORIGINS`; header CORS di endpoint HTTP antarserver dihapus.
- Peta di layar siswa baru berganti setelah server mengirim `map:changed`; pemilih peta di layar siswa hanya tampil di room demo.
- Token pemulihan koneksi siswa memakai `crypto.randomUUID()`, bukan `Math.random()`.
- Diuji langsung terhadap server lokal dengan skrip Socket.IO: 11 dari 11 skenario lulus (tanpa rahasia ditolak, host tanpa token ditolak, siswa tidak bisa mengakhiri sesi atau ganti peta, host sah bisa jeda, room demo hanya bisa dipantau).

**Typecheck & dependensi:**

- `bun run typecheck` kini lolos di ketiga workspace (exit 0).
- TypeScript dinaikkan dari 5.7.3 ke 5.9.3 (Nuxt sekarang memakai opsi `libReplacement`); TypeScript 7 belum dipakai karena `vue-tsc` belum terjamin mendukungnya.
- Semua dependensi `latest`/`^`/`~` dikunci ke versi persis yang terpasang.
- `game-server` dan `shared` memakai tipe `bun` (`@types/bun`).
- Bug nyata ikut diperbaiki: pilihan tingkat kelas di halaman Buat Kuis selalu "Semua Kelas" karena kode membaca `defaultGrades` yang tidak ada (seharusnya `grades`). Input PIN di halaman Join kini menerima teks digit, bukan angka.

**Persiapan deploy:**

- `docker-compose.yml`: variabel web memakai awalan `NUXT_` (sebelumnya web di container akan menghubungi `localhost:3001` dan gagal membuat sesi), `INTERNAL_SECRET`/`DOMAIN` wajib diisi, `ALLOWED_ORIGINS` diset ke domain, Postgres/Redis dipindah ke profil `db` karena belum dipakai.
- Dockerfile memakai `bun.lock` dengan `--frozen-lockfile`; image web dua tahap (hanya `.output` yang dibawa). `.dockerignore` baru.
- Build image belum diuji karena Docker tidak terpasang di laptop pengembang; akan diuji saat deploy di VPS.

### 0.10 Database SQLite (libSQL) + Drizzle (11 November 2026)

Keputusan: **SQLite lewat libSQL + Drizzle** (bukan D1 yang hanya untuk Cloudflare Workers, bukan PostgreSQL + Redis yang belum perlu untuk satu VPS). Untuk login dipilih **Better Auth**; dikerjakan berikutnya di atas database ini. PRD sudah diperbarui.

**Yang dibuat (`apps/web`):**

- `server/db/schema.ts`: tabel `quizzes` (soal disimpan sebagai JSON bersama kuisnya, kolom `owner_id` disiapkan untuk login) dan `game_sessions` (riwayat sesi + laporan akhir JSON). Migrasi pertama `server/db/migrations/0000_skema_awal.sql`; buat migrasi baru dengan `bun run db:generate`.
- `server/utils/db.ts`: koneksi dibuka saat pertama dipakai; membuat folder berkas, mode WAL + `busy_timeout`, menjalankan migrasi, lalu mengisi kuis contoh bila tabel kosong. Semua query menunggu proses ini selesai.
- `server/utils/store.ts` kini membaca/menulis database. Pencarian kuis memakai `LIKE ... ESCAPE` sehingga `%` dan `_` dicocokkan apa adanya.
- `POST /api/quizzes` selalu membuat ID di server (sebelumnya klien bisa mengirim `id` dan menimpa kuis orang lain).
- Sesi live dicatat saat dibuat; game server mengirim laporan akhir ke `POST /api/internal/sessions/:code/results` (wajib `x-internal-secret`, dicoba ulang 3 kali). Room demo tidak disimpan.
- `GET /api/sessions/:code/report` mengambil laporan dari game server selama room ada, lalu dari database setelahnya. `GET /api/sessions` untuk riwayat; halaman Dashboard → Laporan & Nilai menampilkannya.
- Lokasi berkas: `.data/petakuis.db` saat pengembangan (diabaikan git), `/data/petakuis.db` di Docker (volume `webdata`).

**Masalah yang ditemukan saat uji build produksi dan sudah diperbaiki:**

1. Binari native libSQL (`@libsql/<platform>`) tidak ikut ke `.output` karena dipilih lewat `require` dinamis. `nuxt.config.ts` kini mencari binari untuk platform mesin build dan memasukkannya ke `nitro.externals.traceInclude`; build gagal dengan pesan jelas bila binarinya tidak ada.
2. `.output` gagal dijalankan dengan Bun karena `@libsql/isomorphic-ws` memilih berkas khusus Bun yang tidak ikut terbawa. Server web produksi kini dijalankan dengan **Node 24 Alpine** (target build Nitro); tahap build Docker tetap Bun. Game server tetap Bun.

**Verifikasi:** typecheck tiga workspace lolos, lint bersih, 12 tes lolos. Uji langsung dengan skrip: tahap tulis 7/7 (kuis tersimpan, kuis contoh tidak bisa ditimpa, pencarian `%` benar, sesi tercatat berakhir dengan jumlah siswa) lalu **kedua server dimatikan dan dinyalakan ulang**, tahap baca 3/3 (kuis masih ada, room sudah hilang dari game server, laporan tetap terbuka dari database). Build produksi dijalankan dengan Node: database terbuat, migrasi jalan, kuis contoh terisi. Build image Docker belum diuji (Docker tidak terpasang di laptop pengembang).

**Berikutnya:** login guru dengan Better Auth (tabel akun ditambahkan lewat migrasi baru), lalu kuis dan riwayat sesi difilter per guru, plus fitur edit/hapus kuis dengan cek pemilik.

**Status 0.9 & 0.10:** di-commit dan di-push ke `main` pada 11 November 2026 dalam satu commit, karena perubahan keamanan host dan database bersinggungan di berkas yang sama (game server, `package.json`, `bun.lock`).

### 0.11 Deploy ke VPS Oracle: https://petakuis.permadi.dev (11 November 2026)

**Lingkungan:** VPS Oracle Cloud, Ubuntu 24.04 ARM64 (2 CPU, 11 GB RAM), Docker 29 + Compose 2.40. VPS yang sama menjalankan `majalengka-tech` (`127.0.0.1:3000`) dan `gurukampung` (`127.0.0.1:3001`); situs dibuka ke internet lewat **Cloudflare Tunnel `majalengka-vps`** yang dikelola dari dashboard (bukan port terbuka; firewall hanya membuka SSH).

**Susunan Petakuis:**

- Kode di `~/petakuis` (clone dari GitHub), `.env` berisi `PUBLIC_URL=https://petakuis.permadi.dev`, `INTERNAL_SECRET` acak (dibuat `openssl rand -hex 32`, izin berkas 600), `WEB_PORT=3100`, `GAME_PORT=3101`.
- `docker compose up -d --build` → `petakuis-web-1` di `127.0.0.1:3100`, `petakuis-game-server-1` di `127.0.0.1:3101`, database SQLite di volume `petakuis_webdata` (`/data/petakuis.db`). Caddy di Compose tidak dipakai (profil `caddy` hanya untuk VPS tanpa proxy).
- Cloudflare Tunnel, aturan ditambahkan sebelum aturan 404 (aturan situs lain tidak diubah):
  1. `petakuis.permadi.dev` path `^/socket.io` → `http://localhost:3101`
  2. `petakuis.permadi.dev` → `http://localhost:3100`
- DNS: `CNAME petakuis.permadi.dev → <tunnel-id>.cfargotunnel.com` (proxied).
- Pemakaian memori awal: web ±35 MB, game server ±24 MB.

**Masalah yang ditemukan saat deploy dan sudah diperbaiki:**

1. Docker Compose lama mengikat Caddy ke port 80/443 dan aplikasi ke port 3000/3001; di VPS ini keduanya sudah dipakai situs lain. Compose diubah: port lokal bisa diatur, Caddy jadi opsional (`d3caeed`).
2. Di build Linux, paket `ws` milik `@libsql/isomorphic-ws` tidak ikut ke `.output` sehingga semua API yang memakai database gagal (500). Penyebabnya **Bun punya modul `ws` bawaan**, jadi saat build berjalan di Bun, `require.resolve('ws')` tidak menunjuk ke paket. Perbaikan: hook Nitro `compiled` mencari paket `ws` langsung di `node_modules` terdekat dari `isomorphic-ws` lalu menyalinnya ke `.output` (`407682f`, `7f13356`, `daae668`; dua yang pertama tidak cukup, yang ketiga berhasil).

**Verifikasi:**

- Di VPS: kuis terbaca dari database, sesi bisa dibuat (token host ada, room muncul di game server, tercatat di riwayat), `POST /rooms` tanpa rahasia ditolak 401, semua halaman 200, tidak ada error di log. Sesi uji dihapus lagi dari database produksi.
- Dari internet: semua halaman 200 (0,2–1 detik), API dan handshake Socket.IO lewat HTTPS berhasil, endpoint internal game server tidak terbuka. Uji WebSocket publik 5/5 lulus (tersambung lewat Cloudflare dengan transport websocket, siswa bisa masuk room demo, layar host room demo hanya mode pantau, orang luar tidak bisa mengakhiri sesi). Tangkapan layar game di `https://petakuis.permadi.dev/play/123456` menampilkan peta, avatar, dan kompas.
- `majalengka.tech` dan `gurukampung.my.id` tetap 200 sebelum, selama, dan sesudah deploy.

**Operasional:**

- Memperbarui: `ssh ubuntu@<ip-vps>` → `cd ~/petakuis && git pull && docker compose up -d --build`. Build web sekitar 1 menit di VPS ini.
- Log: `cd ~/petakuis && docker compose logs -f web game-server`.
- Cadangan database: salin isi volume `petakuis_webdata` (berkas `petakuis.db*`) secara berkala; belum diotomatiskan.
- Membatalkan rute: hapus dua aturan `petakuis.permadi.dev` di Cloudflare Zero Trust → Networks → Tunnels → `majalengka-vps` → Public Hostname, lalu hapus record DNS `petakuis` di zona `permadi.dev`. Mematikan aplikasi: `cd ~/petakuis && docker compose down` (data tetap di volume).

**Catatan keamanan:** token Cloudflare yang dipakai untuk mengatur Tunnel/DNS ada di berkas lokal pengguna dan tidak disimpan di repo maupun server; sebaiknya dibatasi atau dicabut bila tidak dipakai lagi. Berkas kode cadangan 2FA Cloudflare sebaiknya dipindah ke pengelola kata sandi.

### 0.12 Login guru & siswa dengan Better Auth (11 November 2026)

**Keputusan:** login memakai pustaka **Better Auth 1.7.20 langsung** (bukan modul `@nuxtjs/better-auth` v0.3 yang dokumentasinya belum membahas SQLite). Cara masuk: **email + kata sandi** (dengan lupa kata sandi) dan **Google**. Sesuai permintaan: halaman masuk berupa satu formulir tanpa tab peran; pilihan **Guru / Siswa** (radio, tanpa Admin) ada di halaman daftar dan saat pertama kali masuk dengan Google; admin hanya dari daftar email server.

**Yang dibuat:**

- Tabel `user`, `session`, `account`, `verification` (migrasi `0001_akun_better_auth.sql`), kolom `role` (`teacher`/`student`, kosong untuk akun Google yang belum memilih).
- `server/utils/auth.ts`: konfigurasi Better Auth (adapter Drizzle SQLite, rate limit bawaan, telemetri mati), `effectiveRole`, `getCurrentUser`, `requireUser`. `server/api/auth/[...all].ts` meneruskan semua endpoint Better Auth. `/api/me` dan `/api/me/role` (pilih Guru/Siswa sekali).
- `server/utils/email.ts`: pengiriman lewat API Resend; tanpa kunci, isi email dicatat di log (untuk pengembangan).
- Halaman `/auth/login`, `/auth/daftar`, `/auth/lupa-sandi`, `/auth/reset-sandi`, `/auth/pilih-peran` (semua komponen Nuxt UI), middleware global, `useCurrentUser`, menu pengguna dashboard memakai akun asli (simulasi "ganti peran" dihapus), tombol header berubah menjadi Dashboard/Main saat sudah masuk.
- Proteksi API: membuat kuis, membuka sesi live, dan generator AI hanya untuk Guru/Admin; kuis dan sesi tercatat atas nama pembuatnya; riwayat sesi dan "kuis milikku" (`/api/quizzes?mine=1`) per guru, admin melihat semua. `/dashboard` dan `/build` wajib Guru/Admin; Siswa diarahkan ke `/join`.

**Keamanan:**

- Akun email + kata sandi **wajib konfirmasi email** sebelum bisa masuk. Ini mencegah orang mendaftar memakai email milik orang lain (termasuk email admin) lalu ikut tergabung saat pemilik asli masuk dengan Google.
- Peran admin hanya diberikan bila email ada di `NUXT_ADMIN_EMAILS` **dan** sudah terverifikasi. Daftar email admin disimpan di `.env` server, tidak di repo (repo publik).
- Ditemukan saat pengujian dan diperbaiki: endpoint bawaan `update-user` masih bisa mengubah `role` karena Better Auth menggabungkan data hasil hook dengan data asli. Pembaruan yang membawa `role` kini dibatalkan seluruhnya.
- Reset kata sandi mengeluarkan semua sesi lama; pesan "lupa kata sandi" sama untuk email terdaftar maupun tidak.

**Verifikasi (server dev lokal):** typecheck dan lint bersih; uji alur 24/24 lulus (daftar → wajib konfirmasi → masuk dengan peran benar; tamu/siswa ditolak dari dashboard dan pembuatan kuis; upaya menaikkan peran lewat daftar, `update-user`, dan `/api/me/role` gagal; email admin terverifikasi menjadi Admin; lupa kata sandi dari permintaan sampai kata sandi lama tidak berlaku dan sesi lama keluar). Tangkapan layar halaman Masuk dan Daftar diperiksa.

**Halaman Kebijakan Privasi dan Ketentuan Layanan** (`/privasi`, `/ketentuan`, komponen `LegalPage`): diwajibkan Google sebelum OAuth bisa *In production*. Isinya mengikuti data yang benar-benar disimpan (akun, sesi, kuis, nama panggilan dan skor siswa; tanpa iklan atau analitik pihak ketiga). Email kontak dibaca dari `CONTACT_EMAIL` di server, tidak ditulis di repo. Tautan ada di footer.

**Google OAuth:** client Web application di project Google Cloud `petakuis` (consent screen External, *In production*, hanya scope dasar `openid email profile` sehingga batas 100 pengguna tidak berlaku). Redirect URI: `https://petakuis.permadi.dev/api/auth/callback/google` dan `http://localhost:3000/api/auth/callback/google`. Diuji lokal: Google menerima client dan redirect URI (302 ke halaman pilih akun). Pengirim email memakai kunci Resend yang sama dengan proyek permadi (domain `permadi.dev` terverifikasi).

### 0.13 Login online dan pengamanan Cloudflare (11 November 2026)

**Login aktif di https://petakuis.permadi.dev:** `.env` VPS ditambah `AUTH_SECRET` acak, `ADMIN_EMAILS`, `CONTACT_EMAIL`, kunci Google, `GOOGLE_LOGIN_ENABLED=true`, kunci Resend, `MAIL_FROM` (cadangan `.env` lama disimpan dengan akhiran tanggal). Diuji online: `/privasi`, `/ketentuan`, `/auth/login`, `/auth/daftar` 200; `/dashboard` diarahkan ke login; tombol Google memakai redirect `https://petakuis.permadi.dev/api/auth/callback/google`.

**Celah yang ditemukan dan ditutup:**

- `/api/logs` dan halaman `/logs` terbuka untuk umum dan mencatat path lengkap termasuk query. Token konfirmasi email (`?token=`) dan token reset kata sandi (`/reset-password/<token>`) bisa dibaca siapa saja, sehingga akun (termasuk admin) bisa diambil alih. Perbaikan kode: log pindah ke dashboard admin (`/dashboard/logs`, menu **Log Server**), `/api/logs` menolak selain admin (401/403), `/logs` lama dialihkan 301; path dicatat tanpa query, token reset disamarkan, isi email cadangan (saat kunci Resend kosong) tidak dicatat di produksi. Belum ada akun terdaftar saat celah ditemukan. Sampai perbaikan ini ter-deploy, `/logs` dan `/api/logs` Petakuis diblokir sementara lewat aturan Cloudflare; **hapus bagian itu dari aturan setelah deploy**.
- Rate limit Better Auth membaca IP dari `cf-connecting-ip` (diisi Cloudflare; port hanya terikat ke 127.0.0.1). Batas masuk/daftar dilonggarkan untuk kelas yang memakai satu IP sekolah (masuk 30/menit, daftar 20/menit); kirim email reset/verifikasi tetap 3/menit.

**Cloudflare (zona permadi.dev, tempat subdomain Petakuis berada):** tiga aturan blokir yang sama dengan domain lain (bot scanner, user agent scanner, bot palsu) sudah otomatis berlaku. Aturan rate limit zona (20 request `/api/` per 10 detik per IP) akan memblokir satu kelas, jadi untuk host Petakuis dibatasi hanya pada endpoint masuk/daftar/reset sandi dan AI; perilaku untuk permadi.dev tidak berubah. Aturan baru: `/api/internal/` Petakuis diblokir dari internet (hanya dipanggil game server lewat jaringan Docker). Diuji: internal, `/.env`, dan UA sqlmap 403; 40 request `/api/me` beruntun semuanya 200; permadi.dev, majalengka.tech, gurukampung.my.id tetap 200.

### 0.14 Menu admin, edit & hapus kuis, kunci jawaban tidak lagi publik (11 November 2026)

- **Menu dashboard per peran:** grup Administrasi (Guru, Siswa, Pengaturan Sekolah, Log Server) dan tautan admin di menu sekolah hanya tampil untuk admin. Halamannya juga dijaga middleware (guru diarahkan ke `/dashboard`) dan API-nya di server. Tautan "Status" publik di header, footer, dan menu pengguna dihapus.
- **Edit kuis:** `/build?edit=<id>` memuat kuis utuh (hanya pemilik atau admin; lainnya 404), langsung di langkah Pertanyaan, tombol **Simpan Perubahan**. `PATCH /api/quizzes/:id` memakai validasi yang sama dengan membuat kuis (`server/utils/quizAccess.ts`), soal kosong ditolak 400. Pemilik, nama pembuat, dan tanggal dibuat tidak berubah.
- **Hapus kuis:** `DELETE /api/quizzes/:id` (pemilik atau admin) dengan jendela konfirmasi di Koleksi Kuis; laporan nilai sesi lama tetap tersimpan.
- **Celah ditutup:** `GET /api/quizzes` dan `/api/quizzes/:id` sebelumnya mengirim **kunci jawaban** ke siapa saja, termasuk kuis privat, sehingga siswa bisa mencontek. Sekarang daftar publik hanya kuis publik tanpa kunci jawaban, detail utuh hanya untuk pemilik/admin, dan sesi live dari kuis privat hanya bisa dibuka pemiliknya. Penilaian tetap jalan karena game server menerima kuis utuh dari server web, bukan dari browser.

**Verifikasi lokal:** uji alur 41/41 (ditambah: guru lain dan siswa tidak bisa edit/hapus, pemilik dan admin bisa, soal kosong ditolak, tamu tidak menerima kunci jawaban, API log 401/403 untuk tamu/guru, menu admin tidak tampil untuk guru, `/logs` dialihkan); lint dan typecheck bersih; tangkapan layar Koleksi Kuis (menu aksi dan konfirmasi hapus), halaman Edit Kuis, dan Log Server admin diperiksa.

### 0.15 Halaman admin dengan data asli dan pengaman kelas (11 November 2026) — lokal, belum di-commit

- **Guru / Siswa:** `/api/admin/users` (khusus admin) membaca akun asli beserta jumlah kuis & sesi live; aksi salin email, ubah peran Guru↔Siswa (`PATCH`, admin tidak bisa diberikan lewat API), hapus akun (`DELETE`, tidak bisa hapus diri sendiri; sesi ikut terhapus lewat foreign key). Pagination 20 per halaman, ekspor CSV siswa, tombol "Salin tautan daftar" menggantikan undangan. Data contoh `DEMO_TEACHERS/STUDENTS/SCHOOL` dihapus.
- **Pengaturan Sekolah:** tabel baru `school_settings` (migrasi `0002_pengaturan_sekolah.sql`), `GET/PUT /api/admin/school`, nama sekolah tampil di menu sekolah dashboard (`/api/school`); kartu kuota AI fiktif diganti statistik asli (akun, kuis, sesi).
- **Filter nama panggilan** (`packages/shared/src/nickname.ts`): normalisasi angka/simbol pengganti huruf, spasi/titik di tengah kata, huruf berulang; kata pendek (asu, babi, tai, …) hanya sebagai kata utuh agar nama seperti Asuka/Babinsa/Cokro tidak kena. Peringatan langsung di `/join`; game server tetap mengganti nama kasar menjadi "Siswa-xxx".
- **Batas tebakan PIN** (`failureLimiter.ts`): 40 PIN salah per 10 menit per IP (`cf-connecting-ip`) di `/api/sessions/lookup` (429) dan event `join` game server.
- **QR code** di layar host (`SessionQrCode.vue`, pustaka `uqr@0.1.3`), menuju `<siteUrl>/join?code=PIN`, bisa diperbesar layar penuh untuk proyektor.

**Verifikasi:** uji alur 50/50, uji pengaman kelas 7/7, unit test 45 lulus, lint & typecheck bersih; tangkapan layar halaman Guru, Siswa, Pengaturan diperiksa.

**Lanjutan berikutnya:** periksa tangkapan layar QR & peringatan nama (sudah diambil di scratchpad: `shots/host-qr.png`, `shots/join-nama.png`), lalu commit + push + deploy semua pekerjaan 0.13–0.15 (situs online masih membocorkan kunci jawaban), hapus blokir sementara `/logs` di Cloudflare. Setelah itu: backup database harian, halaman kuis Nuxt UI, uji beban 200 siswa, generator tilemap.

**Deploy 0.13–0.15 (11 November 2026):** commit `ec3011e` terpasang di VPS. Diuji online: `/api/quizzes` tanpa kunci jawaban, `/api/logs` 401 untuk tamu, `/dashboard/logs` diarahkan ke login, `/logs` dialihkan 301, `/api/internal/` 403, PIN salah 404; permadi.dev, majalengka.tech, gurukampung.my.id tetap 200. Blokir sementara `/logs` di Cloudflare sudah dicabut. Sisa: periksa tampilan QR & peringatan nama, backup database harian, halaman kuis Nuxt UI, uji beban 200 siswa, generator tilemap.

### 0.16 Cadangan database harian (12 November 2026)

- Tampilan QR code di layar host dan peringatan nama panggilan di `/join` diperiksa lewat tangkapan layar: sesuai.
- `scripts/backup-db.sh`: `VACUUM INTO` di dalam container web (salinan konsisten walau aplikasi berjalan), `PRAGMA integrity_check` pada salinan, disalin ke `~/petakuis-backups` di VPS, dikompres gzip, disimpan 14 hari (`BACKUP_DIR`, `BACKUP_KEEP_DAYS`). Cara memulihkan ditulis di kepala skrip. Catatan: `require()` gagal karena Nitro hanya membawa versi ESM `@libsql/client`, jadi skrip memakai `import()`.
- Diuji di VPS (dijalankan lewat stdin, tanpa menyimpan file di repo VPS): cadangan pertama `petakuis-20261111-170720.db.gz` (8 KB), file sementara di container terhapus.
- Di-push (`90f21ec`), di VPS `git pull` dan cron `30 19 * * *` (02.30 WIB) terpasang; entri crontab lain tidak diubah. Jalan kedua juga berhasil.

### 0.17 Uji beban 200 siswa (12 November 2026)

**Alat:** `apps/web/scripts/load-test.ts` (`bun scripts/load-test.ts --url <game server> --code <PIN> --bots 200 --seconds 60`): bot Socket.IO masuk bertahap lalu berjalan acak 5 langkah/detik; mengukur join, latensi `state`, laju update per bot, error.

**Hasil (laptop, game server lokal, room demo 555555, 200 bot):** join 200/200 (p95 11 ms); latensi update p50 4 ms · p95 9 ms · p99 12 ms (putaran berikutnya p99 ≤ 41 ms); 13,4 update/detik per bot (1 bot pun 13,2: batas timer Windows, bukan beban; target 15); CPU game server ±7% dari 1 core, memori 98 MB; 0 error.

**Bug ditemukan dan diperbaiki (`QuizRoom.ts`):** pemain yang sudah keluar tetap dihitung ke batas 200 dan room demo tidak pernah menghapus mereka, sehingga putaran uji kedua ditolak "Ruang kelas sudah penuh". Di produksi, room demo publik akan penuh permanen setelah 200 pengunjung. Sekarang batas hanya menghitung pemain tersambung (pemain yang keluar tetap disimpan agar nilainya masuk laporan), dan room demo menghapus pemain yang keluar lebih dari 10 menit. Diuji: dua putaran 200 bot berturut-turut di room yang sama, keduanya 200/200 tanpa error.

**Deploy:** `18a486d` terpasang di VPS (game server dibangun ulang). Uji asap 3 bot lewat Cloudflare: 3/3 masuk, 15 update/detik tepat (Linux), 0 error. Uji beban penuh 200 bot ke VPS belum dilakukan; jadwalkan di luar jam kelas.

### 0.18 Halaman kuis memakai Nuxt UI (12 November 2026)

Survei elemen native di halaman kuis: layar host, laporan, dan kanvas peta sudah Nuxt UI; sisanya diganti:

- **Penyusun kuis (`build`):** label jenjang & mapel → `UFormField`; impor CSV → `UFileUpload` (berkas diproses saat dipilih/di-drop lalu kotak dikosongkan); pemilih karakter NPC → `UButton` dengan sprite; radio kunci jawaban → `UButton` ikon (`aria-pressed`).
- **Layar main (`play`):** HUD dibangun ulang: `UButton` (keluar, ganti peta demo, mode aksesibel, peringkat), `UBadge` (PIN, sisa pos, skor), pesan galat `UAlert`, papan peringkat `USlideover`, layar selesai `UModal` (tidak bisa ditutup), tombol buka soal `UButton` xl.
- **Jendela soal (`QuestionModal`):** `UModal` (z-index di atas HUD & sprite; Esc dan klik luar ditangani UModal), pilihan jawaban `UButton` + `UKbd` (tombol 1–4 tetap jalan), petunjuk & hasil `UAlert`, isian singkat `UForm` + `UInput`.
- **Pemilih posisi di peta:** `UModal` dengan tombol `UButton`; area peta per tile tetap elemen sendiri (tidak ada padanan Nuxt UI).
- **D-Pad kanvas:** `UButton` ikon chevron.
- **Halaman join:** pilihan karakter → `URadioGroup` varian kartu (indikator tersembunyi, sprite di atas nama).
- Tetap native karena tidak ada padanan: judul `h1–h3`, gambar sprite/peta, permukaan klik peta.

**Verifikasi:** lint & typecheck bersih; tangkapan layar diperiksa: penyusun kuis (mode edit), pemilih posisi, join, layar main + peringkat, jendela soal isian. Di dev server, pemuatan pertama layar main bisa >5 detik sehingga peta tampak gelap di tangkapan layar awal; bukan regresi (dibandingkan dengan situs online).

**Deploy:** `b5c4d07` terpasang di VPS; `/`, `/join`, `/play/123456`, `/auth/login` 200, peta & avatar di layar main termuat; situs lain di VPS tetap 200.

### 0.19 Generator peta acak (12 November 2026)

- `tools/godot-maps/scripts/generate_map.gd` di atas `sunnyside_kit.gd` + katalog `buildings.gd`: input `slug`, `seed`, `tema` (desa/sungai/danau), `nama`, `lebar`, `tinggi`. Menyusun jalan utama, jalan kedua, 2–3 jalan tembus; air sesuai tema (sungai berkelok dengan jembatan otomatis dan jalan di seberang, danau, atau kolam); bangunan acak berderet menghadap jalan dengan jarak satu sel (tiap jenis maks. 2, tidak berurutan); ladang, ternak, cincin hutan, dekor; 24 pos soal otomatis. Pemeriksaan: semua pos terjangkau dari titik mulai, area jalan ≥ 30%, pos ≥ 20, bangunan ≥ 6; bila gagal coba seed berikutnya (maks. 12).
- `run.sh --gen slug=... seed=... tema=...`: generate + ekspor PNG/TS + cetak potongan kode pendaftaran untuk `maps.ts`. README diperbarui.
- **Diuji:** tiga tema (sungai seed 7, danau seed 21, desa seed 99) lolos di percobaan pertama: 14–20 bangunan, area jalan 51–55%, 24 pos soal; PNG diperiksa visual (jembatan di tiap persilangan sungai, rumah menghadap jalan, variasi bangunan). Berkas uji dihapus.

### 0.20 Tiga peta baru dari generator (12 November 2026)

| Peta | Tema / seed | Isi | Mode bawaan |
| --- | --- | --- | --- |
| `map-desa-tepi-sungai` Desa Tepi Sungai · Jembatan & Ladang | sungai / 12 | sungai di selatan, 2 jembatan, jalan seberang, 21 rumah | bebas |
| `map-kampung-danau` Kampung Danau · Kincir & Kebun | danau / 21 | danau di selatan, kebun di kedua tepi, kincir, 20 rumah | bebas |
| `map-desa-ladang` Desa Ladang · Kolam, Kebun & Kincir | desa / 99 | kolam kecil, 6 petak kebun, ternak, 2 kincir, 19 rumah | berurutan |

- Seed sungai dipilih dari 6 percobaan (seed 7 hanya 14 bangunan; seed 12 terbanyak, 21). Seed tercatat di deskripsi `maps.ts` supaya bisa dibangun ulang persis: `bash tools/godot-maps/run.sh --gen slug=<slug> seed=<seed> tema=<tema>`.
- Katalog kini 8 peta. Pemilih peta demo di HUD layar main diganti `USelect` (8 tombol terlalu lebar).
- **Verifikasi:** typecheck bersih; unit test 45 lulus (pengecekan naik 848 → 1217 karena uji tabrakan & pos soal ikut memeriksa peta baru); peta sungai dan danau dibuka di layar main lewat `?map=` (pemain muncul di persimpangan, petunjuk arah pos soal jalan).

