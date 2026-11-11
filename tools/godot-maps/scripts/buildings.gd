extends RefCounted
## Katalog bangunan dari contoh room paket Sunnyside (Room1.yy, 86x48 tile).
##
## `rect` = posisi di room dalam tile (x, y, lebar, tinggi); baris terbawah adalah
## bayangan dan tetap bisa dilewati. Kotak ini hasil deteksi otomatis kelompok tile
## di layer `building` + `walls`, lalu diperiksa satu per satu.
##
## `mill` = baling-baling kincir (sprite terpisah di paket) yang dipasang di atas
## bangunan: titik tengah dalam piksel relatif ke pojok kiri atas `rect`, skala,
## dan cermin. Nilainya diambil dari posisi sprite di room yang sama.

const ALL := {
	# --- rumah
	"rumah_merah": {"rect": Rect2i(32, 19, 5, 6), "label": "Rumah atap merah"},
	"rumah_ungu": {"rect": Rect2i(13, 26, 6, 7), "label": "Rumah atap ungu"},
	"rumah_biru": {"rect": Rect2i(51, 6, 5, 5), "label": "Rumah atap biru"},
	"rumah_biru_atas": {"rect": Rect2i(54, 0, 5, 5), "label": "Rumah biru beranda"},
	"rumah_oranye": {"rect": Rect2i(54, 24, 6, 6), "label": "Rumah atap oranye"},
	"rumah_oranye_besar": {"rect": Rect2i(55, 31, 6, 5), "label": "Rumah oranye panjang"},
	"rumah_oranye_samping": {"rect": Rect2i(62, 20, 4, 6), "label": "Rumah oranye atap samping"},
	"rumah_hijau_tinggi": {"rect": Rect2i(40, 33, 5, 6), "label": "Rumah hijau bertingkat"},
	# --- pondok & gudang
	"pondok_hijau": {"rect": Rect2i(21, 25, 4, 5), "label": "Pondok hijau"},
	"pondok_hijau2": {"rect": Rect2i(50, 25, 4, 5), "label": "Pondok hijau kecil"},
	"pondok_hijau3": {"rect": Rect2i(53, 12, 4, 5), "label": "Pondok hijau lereng"},
	"pondok_merah": {"rect": Rect2i(30, 26, 4, 5), "label": "Pondok merah"},
	"gudang_kecil": {"rect": Rect2i(22, 17, 3, 4), "label": "Gudang kecil"},
	"gudang_hijau": {"rect": Rect2i(70, 26, 4, 4), "label": "Gudang hijau"},
	"lumbung_kembar": {"rect": Rect2i(17, 33, 11, 6), "label": "Lumbung kembar"},
	# --- bangunan umum
	"balai_biru": {"rect": Rect2i(39, 24, 7, 7), "label": "Balai atap biru"},
	"kios": {"rect": Rect2i(64, 28, 4, 2), "label": "Kios pasar"},
	# --- menara & kincir
	"menara_biru": {"rect": Rect2i(43, 1, 4, 7), "label": "Menara biru berbalkon"},
	"menara_batu": {
		"rect": Rect2i(72, 3, 4, 10), "label": "Kincir angin menara batu",
		"mill": {"center": Vector2(32, 26), "scale": 1.0, "flip": false},
	},
	"menara_merah": {
		"rect": Rect2i(40, 14, 3, 7), "label": "Kincir angin menara merah",
		"mill": {"center": Vector2(24, 39), "scale": 1.0, "flip": false},
	},
	"menara_kayu": {
		"rect": Rect2i(28, 2, 8, 14), "label": "Menara kayu besar berkincir",
		"mill": {"center": Vector2(41.25, 78.75), "scale": 0.7366, "flip": true},
	},
	# --- di atas air
	"panggung_merah": {"rect": Rect2i(76, 39, 4, 7), "label": "Rumah panggung"},
	"panggung_kincir": {
		"rect": Rect2i(71, 41, 4, 6), "label": "Kincir panggung",
		"mill": {"center": Vector2(33, 38), "scale": 1.0, "flip": false},
	},
}
