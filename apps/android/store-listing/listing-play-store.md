# Listing Google Play: Petakuis

Salin-tempel ke **Play Console → Grow users → Store presence → Main store listing**.

## App name (maks. 30 karakter)

```
Petakuis: Kuis Petualangan Peta
```

## Short description (maks. 80 karakter)

```
Kuis petualangan peta 2D untuk kelas: masukkan PIN, jelajahi peta, jawab soal!
```

## Full description (maks. 4.000 karakter)

```
Petakuis mengubah latihan soal menjadi petualangan. Siswa menggerakkan karakter di peta piksel, mengikuti penunjuk arah ke pos-pos soal, lalu berlomba menjawab dengan tepat dan cepat.

CARA BERMAIN
1. Masukkan PIN 6 digit dari layar guru.
2. Pilih nama panggilan dan karakter.
3. Jelajahi peta dengan joystick, temui tokoh pembawa soal, dan jawab soalnya.
Siswa tidak perlu membuat akun untuk bermain.

UNTUK SISWA
• 8 peta untuk dijelajahi: pesisir, lembah, kampus, dataran tinggi berkincir, kota pasar, desa tepi sungai, kampung danau, dan desa ladang.
• Joystick di layar: geser ke segala arah, termasuk serong.
• Soal pilihan ganda, benar/salah, dan isian singkat, sebagian dilengkapi petunjuk.
• Papan peringkat kelas yang diperbarui langsung.
• Mode aksesibel: buka soal berikutnya tanpa harus berjalan ke pos.

UNTUK GURU
• Buat kuis sendiri: pilih peta, jenjang, mata pelajaran, lalu tulis soal atau impor dari CSV.
• Buka kelas live, tampilkan PIN dan QR code di proyektor, pantau posisi siswa di peta radar.
• Laporan nilai per siswa dan ekspor CSV.
• Tersedia kuis contoh SD kelas 1–6 yang disusun dari buku Kurikulum Merdeka: Matematika, Bahasa Indonesia, IPAS, Pendidikan Pancasila, Informatika, dan Bahasa Inggris.

AMAN UNTUK KELAS
• Nama panggilan yang kasar otomatis disaring.
• Kunci jawaban tidak dikirim ke perangkat siswa; penilaian dilakukan di server.
• Tanpa iklan.

Petakuis gratis untuk sekolah Indonesia. Aplikasi ini memerlukan koneksi internet.
Kebijakan privasi: https://petakuis.permadi.dev/privasi
```

## Grafik

| Aset | Berkas | Ketentuan Play |
| --- | --- | --- |
| App icon | `ikon-512.png` | 512×512, PNG 32-bit |
| Feature graphic | `feature-graphic-1024x500.png` | 1024×500 |
| Phone screenshots | `screenshot-1-masuk-pin.png` … `screenshot-5-jelajah.png` | 1080×1920 (9:16), 2–8 berkas |

Urutan screenshot yang disarankan: 2 (peta) → 4 (soal) → 1 (masuk PIN) → 3 (menu) → 5 (jelajah kuis).

## Kategori & kontak

- **App category:** Education (atau Game → Educational)
- **Tags:** Education, Trivia, Puzzle
- **Email kontak:** email dukunganmu
- **Website:** https://petakuis.permadi.dev

## Membuat ulang gambar

```bash
cd apps/android/store-listing
bun sumber/capture.ts sumber/feature-graphic.html 1024 500 feature-graphic-1024x500.png 1 0 3500
bun sumber/screenshots.ts            # memotret situs online
```
