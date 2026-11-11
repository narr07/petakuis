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
