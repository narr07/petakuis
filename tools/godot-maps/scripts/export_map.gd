extends SceneTree
## Mengekspor scene peta menjadi PNG + data tata letak untuk game.
##
## Jalankan (butuh jendela, jangan pakai --headless karena perlu merender):
##   godot --path tools/godot-maps --script res://scripts/export_map.gd -- res://maps/lembah_sunnyside.tscn
##
## Yang dibaca dari scene:
##   - semua node terlihat            -> gambar peta
##   - TileMapLayer "Collision"       -> collisionRows ('#' = terhalang)
##   - meta root "collision_fine"     -> collisionFineRows (grid setengah tile untuk gerak
##                                       pemain; diselaraskan dengan layer Collision supaya
##                                       suntingan tangan di layer itu tetap berlaku)
##   - Marker2D di bawah "QuizSpots"  -> spawnPoints (meta "kind")
##   - Marker2D "PlayerSpawn"         -> playerSpawn
##   - meta root "slug", "map_id"     -> nama berkas keluaran

const PNG_DIR := "../../apps/web/public/maps"
const TS_DIR := "../../packages/shared/src/generated"
const T := 16


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty():
		push_error("Sebutkan scene peta, contoh: -- res://maps/lembah_sunnyside.tscn")
		quit(1)
		return
	var packed: PackedScene = load(args[0])
	if packed == null:
		push_error("Scene tidak bisa dimuat: " + args[0])
		quit(1)
		return
	var map := packed.instantiate() as Node2D
	var w: int = map.get_meta("width_tiles")
	var h: int = map.get_meta("height_tiles")
	var slug: String = map.get_meta("slug")

	# --- data tata letak
	var collision := map.get_node("Collision") as TileMapLayer
	var rows: Array[String] = []
	for y in range(h):
		var row := ""
		for x in range(w):
			row += "#" if collision.get_cell_source_id(Vector2i(x, y)) != -1 else "."
		rows.append(row)

	var fine_rows: Array[String] = []
	var stored: PackedStringArray = map.get_meta("collision_fine", PackedStringArray())
	for fy in range(h * 2):
		var row := ""
		for fx in range(w * 2):
			var tile_solid := rows[fy / 2][fx / 2] == "#"
			var fine_solid := tile_solid
			if fy < stored.size() and fx < stored[fy].length():
				fine_solid = stored[fy][fx] == "#"
			if not tile_solid:
				fine_solid = false # sel dibuka tangan di layer Collision
			row += "#" if fine_solid else "."
		fine_rows.append(row)
	# Sel yang ditutup tangan di layer Collision tetapi kosong di grid halus: tutup penuh.
	for y in range(h):
		for x in range(w):
			if rows[y][x] != "#":
				continue
			var any := false
			for dy in 2:
				for dx in 2:
					if fine_rows[y * 2 + dy][x * 2 + dx] == "#":
						any = true
			if not any:
				for dy in 2:
					var r := fine_rows[y * 2 + dy]
					fine_rows[y * 2 + dy] = r.substr(0, x * 2) + "##" + r.substr(x * 2 + 2)

	var spawn_points: Array[Dictionary] = []
	for marker: Node2D in map.get_node("QuizSpots").get_children():
		var cell := Vector2i((marker.position / T).floor())
		if rows[cell.y][cell.x] == "#":
			push_warning("Pos soal %s berada di sel terhalang %s" % [marker.name, cell])
		spawn_points.append({
			"id": String(marker.name),
			"tileX": cell.x,
			"tileY": cell.y,
			"objectKind": marker.get_meta("kind", "chest"),
		})
	var spawn_cell := Vector2i(((map.get_node("PlayerSpawn") as Node2D).position / T).floor())

	# --- gambar
	collision.visible = false
	(map.get_node("QuizSpots") as Node2D).visible = false
	(map.get_node("PlayerSpawn") as Node2D).visible = false

	var viewport := SubViewport.new()
	viewport.size = Vector2i(w * T, h * T)
	viewport.transparent_bg = false
	viewport.disable_3d = true
	viewport.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.add_child(map)
	root.add_child(viewport)
	for i in range(4):
		await process_frame
	await RenderingServer.frame_post_draw
	var image := viewport.get_texture().get_image()
	image.convert(Image.FORMAT_RGB8)

	var base := ProjectSettings.globalize_path("res://")
	var png_dir := base.path_join(PNG_DIR).simplify_path()
	var ts_dir := base.path_join(TS_DIR).simplify_path()
	DirAccess.make_dir_recursive_absolute(png_dir)
	DirAccess.make_dir_recursive_absolute(ts_dir)
	var png_path := png_dir.path_join(slug + ".png")
	var err := image.save_png(png_path)
	if err != OK:
		push_error("Gagal menyimpan PNG (kode %d)" % err)
		quit(1)
		return
	print("gambar   ", png_path, "  ", image.get_size())

	var layout := {
		"mapImageUrl": "/maps/%s.png" % slug,
		"widthTiles": w,
		"heightTiles": h,
		"tileSizePx": T,
		"playerSpawn": {"tileX": spawn_cell.x, "tileY": spawn_cell.y},
		"collisionRows": rows,
		"collisionFineRows": fine_rows,
		"spawnPoints": spawn_points,
	}
	var const_name := slug.to_upper().replace("-", "_") + "_LAYOUT"
	var ts := "// Berkas ini dibuat otomatis oleh tools/godot-maps/scripts/export_map.gd.\n"
	ts += "// Jangan disunting tangan: ubah scene %s lalu ekspor ulang.\n" % args[0]
	ts += "import type { SpawnPoint } from '../types'\n\n"
	ts += "export const %s: {\n" % const_name
	ts += "\tmapImageUrl: string\n\twidthTiles: number\n\theightTiles: number\n\ttileSizePx: number\n"
	ts += "\tplayerSpawn: { tileX: number; tileY: number }\n\tcollisionRows: string[]\n"
	ts += "\tcollisionFineRows: string[]\n\tspawnPoints: SpawnPoint[]\n"
	ts += "} = %s\n" % JSON.stringify(layout, "\t", false)
	var ts_path := ts_dir.path_join("map-%s.ts" % slug)
	var file := FileAccess.open(ts_path, FileAccess.WRITE)
	file.store_string(ts)
	file.close()
	print("tata letak ", ts_path)
	quit(0)
