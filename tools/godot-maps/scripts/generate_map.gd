extends SceneTree
## Generator peta acak dari seed, di atas sunnyside_kit.gd dan katalog buildings.gd.
##
##   godot --headless --path tools/godot-maps --script res://scripts/generate_map.gd -- \
##       slug=desa-acak seed=42 tema=sungai nama="Desa Acak" lebar=64 tinggi=48
##
## Tema:
##   desa   : jalan utama + jalan tembus, kolam kecil, banyak ladang dan ternak
##   sungai : sungai berkelok melintang peta, jembatan otomatis di tiap persilangan jalan
##   danau  : danau besar di salah satu sisi jalan utama
##
## Seed yang sama selalu menghasilkan peta yang sama. Bila hasilnya tidak lolos pemeriksaan
## (titik mulai terkurung, area jalan terlalu sempit, pos soal kurang), generator mencoba
## seed berikutnya sampai MAX_ATTEMPTS kali. Hasil: res://maps/gen_<slug>.tscn, lalu ekspor
## dengan export_map.gd seperti peta lain (lihat run.sh --gen).

const Kit := preload("res://scripts/sunnyside_kit.gd")
const Buildings := preload("res://scripts/buildings.gd")

const MAX_ATTEMPTS := 12
const SPOT_COUNT := 24
## Bangunan yang tidak cocok diletakkan acak di darat (panggung harus di atas air).
const EXCLUDED := ["panggung_merah", "panggung_kincir", "kios"]
const ROAD := 2 ## lebar jalan (tile)

var W := 64
var H := 48
var theme := "desa"
var slug := "peta-acak"
var map_name := "Peta Acak"
var base_seed := 1

var kit: Kit
var rng := RandomNumberGenerator.new()
var main_y := 0 ## baris atas jalan utama
var second_y := -1 ## baris atas jalan kedua (-1 bila tidak ada)
var streets: Array[int] = [] ## kolom kiri tiap jalan tembus
var street_span := {} ## kolom jalan tembus -> Vector2i(baris awal, baris akhir)
var water := {}
var placed: Array[String] = []
const MAX_SAME := 2 ## tiap jenis bangunan paling banyak dipakai sekian kali per peta


func _initialize() -> void:
	_read_args()
	for attempt in range(MAX_ATTEMPTS):
		var seed_value := base_seed + attempt
		var report := _build(seed_value)
		if report.ok:
			print(kit.ascii())
			print("seed %d (percobaan %d): %s" % [seed_value, attempt + 1, report.summary])
			_save(seed_value)
			return
		print("seed %d ditolak: %s" % [seed_value, report.summary])
	push_error("Tidak menemukan peta yang lolos dalam %d percobaan." % MAX_ATTEMPTS)
	quit(1)


func _read_args() -> void:
	for arg in OS.get_cmdline_user_args():
		var parts := arg.split("=", true, 1)
		if parts.size() != 2:
			continue
		match parts[0]:
			"seed": base_seed = int(parts[1])
			"tema": theme = parts[1]
			"slug": slug = parts[1]
			"nama": map_name = parts[1]
			"lebar": W = clampi(int(parts[1]), 40, 96)
			"tinggi": H = clampi(int(parts[1]), 32, 72)
	if theme not in ["desa", "sungai", "danau"]:
		push_warning("Tema tidak dikenal '%s', memakai 'desa'." % theme)
		theme = "desa"
	if not slug.is_valid_filename() or slug.contains(" "):
		push_error("slug hanya boleh huruf kecil, angka, dan tanda hubung.")
		quit(1)


# ---------------------------------------------------------------- satu percobaan

func _build(seed_value: int) -> Dictionary:
	kit = Kit.new(W, H, seed_value)
	rng.seed = seed_value
	streets.clear()
	street_span.clear()
	water = {}
	placed.clear()
	second_y = -1

	kit.fill_ground()
	_layout_roads()
	_layout_water()
	_paint_roads()
	_place_buildings()
	_place_details()
	kit.forest_ring(4 + rng.randi_range(0, 3))
	kit.scatter_nature(0.7 + rng.randf() * 0.4)

	var problems := kit.validate()
	kit.auto_spots(SPOT_COUNT)
	var walk_ratio := float(kit.walkable.size()) / float(W * H)
	var summary := "tema %s, %d bangunan, area jalan %d%%, pos soal %d" % [
		theme, placed.size(), roundi(walk_ratio * 100), kit.spots.size()
	]
	var ok := problems == 0 and walk_ratio >= 0.3 and kit.spots.size() >= SPOT_COUNT - 4 and placed.size() >= 6
	return {"ok": ok, "summary": summary}


# ---------------------------------------------------------------- jalan

func _layout_roads() -> void:
	main_y = H / 2 + rng.randi_range(-3, 3)
	# Jalan kedua di atas atau di bawah jalan utama (tema sungai/danau memakai sisi lain untuk air).
	var up := rng.randf() < 0.5
	var gap := rng.randi_range(11, 13)
	second_y = main_y - gap if up else main_y + gap
	if second_y < 7 or second_y > H - 9:
		second_y = main_y + gap if up else main_y - gap

	# 2-3 jalan tembus vertikal, berjarak minimal 14 kolom.
	var count := rng.randi_range(2, 3)
	var tries := 0
	while streets.size() < count and tries < 200:
		tries += 1
		var x := rng.randi_range(8, W - 10)
		var far := true
		for s in streets:
			if absi(s - x) < 14:
				far = false
		if far:
			streets.append(x)
	streets.sort()


func _water_band() -> Vector2i:
	## Rentang baris di sisi jalan utama yang tidak dipakai jalan kedua.
	if second_y < main_y:
		return Vector2i(main_y + ROAD + 3, H - 7)
	return Vector2i(6, main_y - 4)


func _layout_water() -> void:
	var band := _water_band()
	match theme:
		"sungai":
			var mid := (band.x + band.y) / 2
			var pts: Array = []
			var steps := 5
			for i in range(steps + 1):
				var x := int(round(lerpf(-1, W, float(i) / steps)))
				var y := clampi(mid + rng.randi_range(-2, 2), band.x + 1, band.y - 2)
				pts.append(Vector2i(x, y))
			Kit.polyline(water, pts, 3)
		"danau":
			var cx := rng.randf_range(W * 0.3, W * 0.7)
			var cy := (band.x + band.y) / 2.0
			Kit.ellipse(water, cx, cy, rng.randf_range(6.0, 9.0), clampf((band.y - band.x) / 2.0 - 1.0, 2.5, 4.5))
		_:
			var cx := rng.randf_range(W * 0.2, W * 0.8)
			var cy := (band.x + band.y) / 2.0
			Kit.ellipse(water, cx, cy, rng.randf_range(2.5, 3.5), 1.8)
	# Air tidak boleh menutup jalan utama atau jalan kedua.
	for c: Vector2i in water.keys():
		if (c.y >= main_y - 1 and c.y <= main_y + ROAD) or (second_y >= 0 and c.y >= second_y - 1 and c.y <= second_y + ROAD):
			water.erase(c)
	if not water.is_empty():
		kit.add_terrain("water", water)


func _paint_roads() -> void:
	var road := {}
	Kit.fill(road, 4, main_y, W - 8, ROAD)
	# Jalan kedua lebih pendek dan tidak selalu dari ujung ke ujung.
	var x0 := rng.randi_range(4, 10)
	var x1 := W - rng.randi_range(4, 10)
	Kit.fill(road, x0, second_y, x1 - x0, ROAD)

	for s in streets:
		# Ke arah jalan kedua: selalu tersambung.
		var a := mini(main_y, second_y)
		var b := maxi(main_y, second_y) + ROAD
		# Ke arah air: diteruskan sampai seberang (dengan jembatan) bila memotong sungai.
		var band := _water_band()
		var crosses := _water_rows(s)
		if theme == "sungai" and crosses.x >= 0:
			if band.x > main_y:
				b = maxi(b, mini(crosses.y + 4, H - 6))
			else:
				a = mini(a, maxi(crosses.x - 4, 5))
		Kit.fill(road, s, a, ROAD, b - a)
		street_span[s] = Vector2i(a, b)
		if crosses.x >= 0 and theme == "sungai":
			kit.bridge(s, crosses.x, ROAD, crosses.y - crosses.x + 1, true)

	# Tema sungai: jalan kecil di seberang sungai yang menyambung jembatan.
	if theme == "sungai" and streets.size() >= 2:
		var band := _water_band()
		var far_y := band.y - 1 if band.x > main_y else band.x - 1
		far_y = clampi(far_y, 5, H - 7)
		var far_x0: int = streets[0]
		var far_x1: int = streets[streets.size() - 1] + ROAD
		var clear := true
		for x in range(far_x0, far_x1):
			for dy in range(ROAD):
				if water.has(Vector2i(x, far_y + dy)):
					clear = false
		if clear:
			Kit.fill(road, far_x0, far_y, far_x1 - far_x0, ROAD)
			for s in streets:
				var span: Vector2i = street_span[s]
				var top := mini(span.x, far_y)
				var bottom := maxi(span.y, far_y + ROAD)
				Kit.fill(road, s, top, ROAD, bottom - top)

	kit.add_terrain("dark", road)
	kit.paint_terrains()

	var sx: int = streets[0] if not streets.is_empty() else W / 2
	kit.player_spawn = Vector2i(sx, main_y)
	kit.reserve_rect(sx - 1, main_y - 1, ROAD + 2, ROAD + 2)


## Baris air pertama dan terakhir yang dilewati jalan tembus di kolom x ((-1, -1) bila tidak ada).
func _water_rows(x: int) -> Vector2i:
	var first := -1
	var last := -1
	for y in range(H):
		var hit := false
		for dx in range(ROAD):
			if water.has(Vector2i(x + dx, y)):
				hit = true
		if hit:
			if first < 0:
				first = y
			last = y
	return Vector2i(-1, -1) if first < 0 else Vector2i(first, last)


# ---------------------------------------------------------------- bangunan

func _catalog() -> Array[String]:
	var names: Array[String] = []
	for key: String in Buildings.ALL:
		if key not in EXCLUDED:
			names.append(key)
	return names


## Muat di `dest` dengan jarak satu sel di kiri, kanan, dan sisi yang menjauhi jalan.
func _fits(dest: Vector2i, size: Vector2i, road_below: bool) -> bool:
	var top := -1 if road_below else 0
	var bottom := size.y if road_below else size.y + 1
	for y in range(top, bottom):
		for x in range(-1, size.x + 1):
			if not kit.is_free(dest + Vector2i(x, y)):
				return false
	return dest.x >= 3 and dest.y >= 3 and dest.x + size.x <= W - 3 and dest.y + size.y <= H - 3


func _place_row(road_y: int, above: bool, catalog: Array[String]) -> void:
	var x := rng.randi_range(4, 7)
	while x < W - 6:
		var bname: String = catalog[rng.randi_range(0, catalog.size() - 1)]
		# Variasi: jenis yang sama tidak berurutan dan dibatasi jumlahnya.
		if placed.count(bname) >= MAX_SAME or (not placed.is_empty() and placed[-1] == bname):
			x += 1
			continue
		var size: Vector2i = Buildings.ALL[bname].rect.size
		# Rumah di atas jalan: baris bayangan tepat di atas jalan. Di bawah jalan: satu baris jeda.
		var dest := Vector2i(x, road_y - size.y) if above else Vector2i(x, road_y + ROAD + 1)
		if _fits(dest, size, above):
			kit.place(bname, dest)
			placed.append(bname)
			x += size.x + rng.randi_range(1, 4)
		else:
			x += 1


func _place_buildings() -> void:
	var catalog := _catalog()
	_place_row(main_y, true, catalog)
	_place_row(main_y, false, catalog)
	_place_row(second_y, true, catalog)
	_place_row(second_y, false, catalog)


# ---------------------------------------------------------------- detail

func _place_details() -> void:
	var crop_patches := 4 if theme == "desa" else 2
	var made := 0
	var tries := 0
	while made < crop_patches and tries < 400:
		tries += 1
		var count := rng.randi_range(6, 10)
		var x := rng.randi_range(4, W - count - 4)
		var y := rng.randi_range(5, H - 8)
		if kit.area_free(Vector2i(x - 1, y - 1), Vector2i(count + 2, 5)):
			kit.crop_rows(x, count, [y, y + 2])
			kit.reserve_rect(x - 1, y - 1, count + 2, 5)
			made += 1

	var animals := [["sheep.png", 2], ["cow.png", 2], ["chicken.png", 1], ["duck.png", 0]]
	var herd := 6 if theme == "desa" else 3
	made = 0
	tries = 0
	while made < herd and tries < 400:
		tries += 1
		var a: Array = animals[rng.randi_range(0, animals.size() - 1)]
		var cell := Vector2i(rng.randi_range(4, W - 6), rng.randi_range(5, H - 7))
		if not kit.area_free(cell - Vector2i(1, 1), Vector2i(4, 3)):
			continue
		var solid: Array = []
		for i in range(int(a[1])):
			solid.append(cell + Vector2i(i, 0))
		kit.add_sprite(a[0], Vector2i(cell.x * 16, cell.y * 16 - 8), 4, solid, rng.randi_range(0, 3))
		kit.reserve_rect(cell.x - 1, cell.y - 1, 4, 3)
		made += 1


# ---------------------------------------------------------------- simpan

func _save(seed_value: int) -> void:
	var scene := "res://maps/gen_%s.tscn" % slug.replace("-", "_")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://maps"))
	var err := kit.save_scene(scene, "PetaAcak", {
		"map_id": "map-" + slug,
		"slug": slug,
		"generator_seed": seed_value,
		"generator_theme": theme,
		"generator_name": map_name,
	})
	if err != OK:
		push_error("Gagal menyimpan scene (kode %d)" % err)
		quit(1)
		return
	print("tersimpan ", scene)
	quit(0)
