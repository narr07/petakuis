extends SceneTree
## Menyusun sprite karakter pemberi soal dari paket Sunnyside World:
## badan + gaya rambut digabung, lalu dipotong jadi strip animasi diam 32x32.
##
## Jalankan:  godot --headless --path tools/godot-maps --script res://scripts/build_characters.gd
## Keluaran:  apps/web/public/characters/<id>.png  (frame berjajar mendatar)

const PACK := "../../Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Assets/Characters"
const OUT := "../../apps/web/public/characters"

## Jendela potong di dalam frame asli 96x64 (karakter berdiri di tengahnya).
const SRC_FRAME := Vector2i(96, 64)
const CROP := Rect2i(32, 12, 32, 32)

## id -> [strip badan, strip rambut ("" = tanpa), jumlah frame]
const CHARACTERS := {
	"pak-botak": ["Human/IDLE/base_idle_strip9.png", "", 9],
	"rambut-mangkuk": ["Human/IDLE/base_idle_strip9.png", "Human/IDLE/bowlhair_idle_strip9.png", 9],
	"rambut-keriting": ["Human/IDLE/base_idle_strip9.png", "Human/IDLE/curlyhair_idle_strip9.png", 9],
	"rambut-kuncir": ["Human/IDLE/base_idle_strip9.png", "Human/IDLE/longhair_idle_strip9.png", 9],
	"rambut-jambul": ["Human/IDLE/base_idle_strip9.png", "Human/IDLE/mophair_idle_strip9.png", 9],
	"rambut-cepak": ["Human/IDLE/base_idle_strip9.png", "Human/IDLE/shorthair_idle_strip9.png", 9],
	"rambut-jabrik": ["Human/IDLE/base_idle_strip9.png", "Human/IDLE/spikeyhair_idle_strip9.png", 9],
	"goblin": ["Goblin/PNG/spr_idle_strip9.png", "", 9],
	"tengkorak": ["Skeleton/PNG/skeleton_idle_strip6.png", "", 6],
}


func _initialize() -> void:
	var base := ProjectSettings.globalize_path("res://")
	var src_dir := base.path_join(PACK).simplify_path()
	var out_dir := base.path_join(OUT).simplify_path()
	DirAccess.make_dir_recursive_absolute(out_dir)

	var failed := 0
	for id: String in CHARACTERS:
		var spec: Array = CHARACTERS[id]
		var body := Image.load_from_file(src_dir.path_join(spec[0]))
		if body == null:
			push_error("Tidak bisa memuat " + String(spec[0]))
			failed += 1
			continue
		body.convert(Image.FORMAT_RGBA8)
		if spec[1] != "":
			var hair := Image.load_from_file(src_dir.path_join(spec[1]))
			hair.convert(Image.FORMAT_RGBA8)
			body.blend_rect(hair, Rect2i(Vector2i.ZERO, hair.get_size()), Vector2i.ZERO)

		var frames: int = spec[2]
		var strip := Image.create(CROP.size.x * frames, CROP.size.y, false, Image.FORMAT_RGBA8)
		for i in range(frames):
			var src := Rect2i(Vector2i(i * SRC_FRAME.x, 0) + CROP.position, CROP.size)
			strip.blit_rect(body, src, Vector2i(i * CROP.size.x, 0))
		var err := strip.save_png(out_dir.path_join(id + ".png"))
		if err != OK:
			failed += 1
			push_error("Gagal menyimpan %s (kode %d)" % [id, err])
		else:
			print("karakter ", id, "  ", strip.get_size())
	quit(1 if failed > 0 else 0)
