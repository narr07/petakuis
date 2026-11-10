extends SceneTree
## Menyalin aset yang dipakai peta dari paket mentah (di luar git) ke
## res://assets/vendor, lalu membuat tile penanda tabrakan.
##
## Jalankan:  godot --headless --path tools/godot-maps --script res://scripts/setup_assets.gd
## Setelah itu: godot --headless --path tools/godot-maps --import

const PACK := "../../Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Assets"

const SUNNYSIDE_FILES := {
	"Tileset/spr_tileset_sunnysideworld_16px.png": "tiles16.png",
	"Tileset/spr_tileset_sunnysideworld_forest_32px.png": "forest32.png",
	"Elements/Other/spr_deco_windmill_strip9.png": "windmill.png",
	"Elements/Animals/spr_deco_cow_strip4.png": "cow.png",
	"Elements/Animals/spr_deco_sheep_01_strip4.png": "sheep.png",
	"Elements/Animals/spr_deco_chicken_01_strip4.png": "chicken.png",
	"Elements/Animals/spr_deco_pig_01_strip4.png": "pig.png",
	"Elements/Animals/spr_deco_duck_01_strip4.png": "duck.png",
}


func _initialize() -> void:
	var root := ProjectSettings.globalize_path("res://")
	var src_dir := root.path_join(PACK).simplify_path()
	var dst_dir := root.path_join("assets/vendor/sunnyside")
	DirAccess.make_dir_recursive_absolute(dst_dir)
	DirAccess.make_dir_recursive_absolute(root.path_join("tilesets"))

	var failed := 0
	for rel: String in SUNNYSIDE_FILES:
		var from := src_dir.path_join(rel)
		var to := dst_dir.path_join(SUNNYSIDE_FILES[rel])
		var err := DirAccess.copy_absolute(from, to)
		if err != OK:
			failed += 1
			push_error("Gagal menyalin %s (kode %d)" % [from, err])
		else:
			print("disalin  ", SUNNYSIDE_FILES[rel])

	# Tile 16x16 merah transparan untuk layer "Collision".
	var img := Image.create(16, 16, false, Image.FORMAT_RGBA8)
	img.fill(Color(1.0, 0.15, 0.2, 0.45))
	for i in 16:
		for p: Vector2i in [Vector2i(i, 0), Vector2i(i, 15), Vector2i(0, i), Vector2i(15, i)]:
			img.set_pixelv(p, Color(1.0, 0.15, 0.2, 0.9))
	img.save_png(root.path_join("tilesets/collision_tile.png"))
	print("dibuat   tilesets/collision_tile.png")

	quit(1 if failed > 0 else 0)
