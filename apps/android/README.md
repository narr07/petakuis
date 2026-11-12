# Aplikasi Android Petakuis (TWA)

Aplikasi Android yang membuka **https://petakuis.permadi.dev** layar penuh lewat mesin Chrome
(Trusted Web Activity). Semua data, login, peta, dan game berasal dari website; update website
langsung sampai ke aplikasi tanpa unggah ulang ke Play Store.

| | |
| --- | --- |
| Nama paket | `dev.permadi.petakuis` (permanen) |
| Halaman awal | `/join?sumber=aplikasi` (masuk PIN siswa) |
| Android minimum | 7.0 (API 24), target API 36 |
| Kunci upload | `E:/vps-oracle/Petakuis/petakuis-upload.jks`, alias `petakuis-upload`, kata sandi di `petakuis-upload-key.txt` (tidak di repo) |
| Proyek dibuat dengan | Bubblewrap 1.27.0 dari `twa-manifest.json` |

## Membangun ulang

Butuh JDK 17 (`E:/website/android/openjdk`) dan Android SDK (`E:/website/android/sdk`).

```bash
cd apps/android

# 1. Bila twa-manifest.json berubah (nama, warna, ikon, versi): buat ulang proyek
bunx --bun @bubblewrap/cli@1.27.0 update --skipVersionUpgrade
#    lalu pastikan app/build.gradle tetap minSdkVersion 24 (androidbrowserhelper 2.7.4 butuh API 24)

# 2. Build (local.properties: sdk.dir=E\:/website/android/sdk)
./gradlew.bat --no-daemon bundleRelease assembleRelease

# 3. Tanda tangani (BT = SDK build-tools/36.0.0, PW = kata sandi kunci upload)
zipalign -f -p 4 app/build/outputs/apk/release/app-release-unsigned.apk dist/aligned.apk
apksigner sign --ks E:/vps-oracle/Petakuis/petakuis-upload.jks --ks-key-alias petakuis-upload \
  --ks-pass pass:$PW --key-pass pass:$PW --out dist/petakuis-<versi>.apk dist/aligned.apk
cp app/build/outputs/bundle/release/app-release.aab dist/petakuis-<versi>.aab
jarsigner -keystore E:/vps-oracle/Petakuis/petakuis-upload.jks -storepass $PW -keypass $PW \
  -sigalg SHA256withRSA -digestalg SHA-256 dist/petakuis-<versi>.aab petakuis-upload
```

`bubblewrap build` tidak dipakai karena Bubblewrap mengharapkan susunan SDK lama (folder `tools`
atau `bin` di akar SDK); hasil build Gradle + penandatanganan di atas setara.

Setiap rilis baru ke Play Store: naikkan `appVersionCode` (dan `appVersionName`) di
`twa-manifest.json` serta `versionCode`/`versionName` di `app/build.gradle`.

## Menghubungkan situs dan aplikasi (wajib)

Situs menyajikan `/.well-known/assetlinks.json` dari variabel `TWA_SHA256_FINGERPRINTS` di
`~/petakuis/.env` VPS (dipisah koma, tanpa build ulang: cukup `docker compose up -d web`).

1. Sidik jari kunci upload (sudah terpasang):
   `A5:4F:0C:2C:9F:9D:2C:82:E2:43:39:3B:14:73:8C:3F:DD:3C:90:D4:F8:A5:ED:E8:99:19:4A:59:C1:C3:AA:33`
2. **Setelah unggahan pertama ke Play Console**, Google menandatangani ulang aplikasi dengan kunci
   "App signing". Salin SHA-256-nya dari *Play Console → Test and release → App integrity → App
   signing* dan tambahkan ke `TWA_SHA256_FINGERPRINTS`. Tanpa ini, aplikasi yang dipasang dari Play
   Store menampilkan bilah alamat browser.

Cek: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://petakuis.permadi.dev&relation=delegate_permission/common.handle_all_urls`

## Mencoba di HP

Aktifkan *Opsi pengembang → Debugging USB*, sambungkan HP, lalu:

```bash
E:/website/android/sdk/platform-tools/adb.exe install -r dist/petakuis-<versi>.apk
```

Atau kirim berkas APK ke HP dan pasang manual (izinkan "Instal aplikasi tidak dikenal").
