# Peta Petakuis (Godot 4.7)

Proyek Godot kecil untuk menyusun peta dan sprite karakter Petakuis dari paket
aset berlisensi, lalu mengekspornya ke format yang dipakai game web.

## Yang dibutuhkan

- Godot 4.7.2 (`Godot_v4.7.2-stable_win64_console.exe`).
- Paket `Sunnyside_World_ASSET_PACK_V2.1` di akar repositori. Paket ini tidak
  ikut di git, jadi salinannya di `assets/vendor/` juga diabaikan git.

## Menjalankan

```bash
GD="/c/Program Files/Godot_v4.7.2-stable_win64_console.exe"

# Sekali saja (atau setelah paket aset berubah)
"$GD" --headless --path tools/godot-maps --script res://scripts/setup_assets.gd
"$GD" --headless --path tools/godot-maps --import

# Bangun ulang semua scene lalu ekspor PNG + data tata letak
bash tools/godot-maps/run.sh

# Atau satu peta saja
bash tools/godot-maps/run.sh kota_pasar

# Sprite karakter pemberi soal
"$GD" --headless --path tools/godot-maps --script res://scripts/build_characters.gd
```

Ekspor peta merender scene, jadi langkah itu membuka jendela Godot sebentar.

## Isi

| Berkas | Fungsi |
| --- | --- |
| `scripts/sunnyside_kit.gd` | Autotile jalan/air, hutan, stamp bangunan dari contoh room paket, `place()` dari katalog, dekorasi umum, pemeriksaan keterjangkauan |
| `scripts/buildings.gd` | Katalog 23 bangunan Sunnyside (posisi di room contoh, label, baling-baling kincir) |
| `scripts/build_lembah_sunnyside.gd` | Peta Lembah Sunnyside: desa lembah, sungai, ladang |
| `scripts/build_pesisir_karang.gd` | Peta Pesisir Karang: kampung nelayan, dermaga, rumah panggung, mercusuar |
| `scripts/build_dataran_angin.gd` | Peta Dataran Tinggi Angin: tiga undakan tebing, kincir, kandang domba, sungai |
| `scripts/build_kota_pasar.gd` | Peta Kota Pasar: blok kota, alun-alun pasar, kanal, balai kota |
| `scripts/generate_map.gd` | Generator peta acak dari seed (tema desa/sungai/danau), lihat bagian di bawah |
| `scripts/build_avatars.gd` | Avatar pemain dari paket Ninja Adventure (CC0) ke `apps/web/public/avatars/*.png` (9 frame 16x16) |

Avatar dibangun ulang dengan:

```bash
"$GD" --headless --path tools/godot-maps --script res://scripts/build_avatars.gd
```

Pantai: panggil `kit.shoreline("light")` setelah `paint_terrains()` untuk memasang garis
pantai berbuih (tile 19..24, baris 5..6 paket) di sel air yang menempel pasir.
| `scripts/export_map.gd` | Scene peta ke `apps/web/public/maps/*.png` dan `packages/shared/src/generated/map-*.ts` |
| `scripts/build_characters.gd` | Badan + rambut ke `apps/web/public/characters/*.png` |

## Membuat peta baru

1. Salin salah satu `scripts/build_*.gd`, ganti `SCENE`, `map_id`, `slug`, dan seed.
2. Susun medan (`add_terrain`, `bridge`, `add_cliff`, `stairs`), lalu bangunan dengan
   `kit.place("nama_bangunan", Vector2i(x, y))`. Nama bangunan ada di `scripts/buildings.gd`.
   Letakkan baris terbawah bangunan (bayangan) tepat di atas jalan supaya pintunya menghadap jalan.
3. `bash tools/godot-maps/run.sh nama_scene`, lalu daftarkan hasilnya di
   `packages/shared/src/maps.ts` dengan `godotMap(...)`.
4. `bun test` memeriksa semua pos soal bisa dicapai dari titik mulai.

Peringatan "menimpa sel yang sudah terpakai" kadang muncul saat bangunan menempel
sudut jalan. Periksa gambarnya; kalau tidak ada yang bertumpuk, peringatan itu aman.

## Menyunting peta dengan tangan

Buka proyek ini di editor Godot, sunting `maps/lembah_sunnyside.tscn`, lalu
jalankan hanya `export_map.gd`. Yang dibaca saat ekspor:

- layer `Collision`: sel yang terisi tidak bisa dilewati,
- `Marker2D` di bawah `QuizSpots`: pos soal bawaan,
- `Marker2D` `PlayerSpawn`: titik mulai pemain.

`run.sh` menjalankan skrip pembangun dulu, sehingga suntingan tangan di scene
akan tertimpa. Perubahan yang harus bertahan sebaiknya ditulis di skrip
pembangunnya.

## Generator peta acak

```bash
bash tools/godot-maps/run.sh --gen slug=desa-sungai seed=42 tema=sungai nama="Desa Sungai"
```

- **tema**: `desa` (kolam kecil, banyak ladang & ternak), `sungai` (sungai berkelok melintang, jembatan otomatis di tiap persilangan jalan, jalan di seberang), `danau` (danau besar di satu sisi jalan utama).
- Opsional: `lebar=64 tinggi=48` (batas 40–96 × 32–72).
- Seed yang sama selalu menghasilkan peta yang sama. Bila hasil tidak lolos pemeriksaan (titik mulai terkurung, area jalan < 30%, pos soal < 20, bangunan < 6), seed berikutnya dicoba sampai 12 kali; seed yang dipakai dicetak dan disimpan di meta scene (`generator_seed`).
- Susunan: jalan utama + jalan kedua + 2–3 jalan tembus, air sesuai tema, bangunan acak dari katalog berderet menghadap jalan (tiap jenis maks. 2, tidak berurutan; rumah panggung & kios tidak dipakai), ladang, ternak, cincin hutan, dekor alam, 24 pos soal otomatis.
- Keluaran: `maps/gen_<slug>.tscn`, `apps/web/public/maps/<slug>.png`, `packages/shared/src/generated/map-<slug>.ts`. Perintah di atas mencetak potongan kode untuk mendaftarkan peta di `packages/shared/src/maps.ts` (`godotMap(...)`). Scene hasil generator bisa disunting tangan di editor Godot lalu diekspor ulang.

