extends SceneTree
## Menyusun sprite avatar pemain dari paket Ninja Adventure (Pixel-boy & AAA, lisensi CC0).
##
## Sumber: NinjaAdventure_CC0/Characters/<nama>.png, 64x112 = 4 kolom arah
## (bawah, atas, kiri, kanan) x 7 baris; baris 0..3 adalah siklus jalan.
## Keluaran: apps/web/public/avatars/<id>.png, 9 frame 16x16 berjajar mendatar
## dengan urutan yang dibaca GameCanvas:
##   0 diam bawah, 1 diam atas, 2 diam samping (menghadap kiri; kanan = dicerminkan),
##   3-4 jalan bawah, 5-6 jalan atas, 7-8 jalan samping.
##
## Jalankan:  godot --headless --path tools/godot-maps --script res://scripts/build_avatars.gd

const PACK := "../../NinjaAdventure_CC0/Characters"
const OUT := "../../apps/web/public/avatars"
const F := 16

## id warna seragam -> berkas karakter Ninja Adventure
const AVATARS := {
	"merah-putih": "Boy",
	"hijau-rimba": "Cavegirl",
	"batik-biru": "BlueNinja", # Child & OldWoman tidak punya baris jalan ke-4
	"ungu-senja": "Princess",
	"pramuka": "Villager3",
	"kuning-emas": "Villager4",
	"toska-laut": "Woman",
	"oranye-bata": "Villager2",
}

## [kolom arah, baris] untuk tiap frame keluaran.
const FRAMES := [
	[0, 0], [1, 0], [2, 0],
	[0, 1], [0, 3],
	[1, 1], [1, 3],
	[2, 1], [2, 3],
]


func _initialize() -> void:
	var base := ProjectSettings.globalize_path("res://")
	var src_dir := base.path_join(PACK).simplify_path()
	var out_dir := base.path_join(OUT).simplify_path()
	DirAccess.make_dir_recursive_absolute(out_dir)

	var failed := 0
	for id: String in AVATARS:
		var src := Image.load_from_file(src_dir.path_join(AVATARS[id] + ".png"))
		if src == null:
			push_error("Tidak bisa memuat " + String(AVATARS[id]))
			failed += 1
			continue
		src.convert(Image.FORMAT_RGBA8)
		var strip := Image.create(F * FRAMES.size(), F, false, Image.FORMAT_RGBA8)
		for i in range(FRAMES.size()):
			var cell: Array = FRAMES[i]
			strip.blit_rect(src, Rect2i(cell[0] * F, cell[1] * F, F, F), Vector2i(i * F, 0))
		var err := strip.save_png(out_dir.path_join(id + ".png"))
		if err != OK:
			failed += 1
			push_error("Gagal menyimpan %s (kode %d)" % [id, err])
		else:
			print("avatar ", id, " <- ", AVATARS[id], "  ", strip.get_size())
	quit(1 if failed > 0 else 0)
