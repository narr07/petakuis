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

# Bangun ulang scene lalu ekspor PNG + data tata letak
bash tools/godot-maps/run.sh

# Sprite karakter pemberi soal
"$GD" --headless --path tools/godot-maps --script res://scripts/build_characters.gd
```

Ekspor peta merender scene, jadi langkah itu membuka jendela Godot sebentar.

## Isi

| Berkas | Fungsi |
| --- | --- |
| `scripts/sunnyside_kit.gd` | Autotile jalan/air, hutan, stamp bangunan dari contoh room paket, pemeriksaan keterjangkauan |
| `scripts/build_lembah_sunnyside.gd` | Rancangan peta Lembah Sunnyside, menghasilkan `maps/lembah_sunnyside.tscn` |
| `scripts/export_map.gd` | Scene peta ke `apps/web/public/maps/*.png` dan `packages/shared/src/generated/map-*.ts` |
| `scripts/build_characters.gd` | Badan + rambut ke `apps/web/public/characters/*.png` |

## Menyunting peta dengan tangan

Buka proyek ini di editor Godot, sunting `maps/lembah_sunnyside.tscn`, lalu
jalankan hanya `export_map.gd`. Yang dibaca saat ekspor:

- layer `Collision`: sel yang terisi tidak bisa dilewati,
- `Marker2D` di bawah `QuizSpots`: pos soal bawaan,
- `Marker2D` `PlayerSpawn`: titik mulai pemain.

`run.sh` menjalankan skrip pembangun dulu, sehingga suntingan tangan di scene
akan tertimpa. Perubahan yang harus bertahan sebaiknya ditulis di skrip
pembangunnya.
