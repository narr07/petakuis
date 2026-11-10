extends SceneTree
## Menyusun peta "Lembah Sunnyside" (64x48 tile): dataran tinggi bertangga,
## sungai berjembatan, alun-alun, ladang, dan lahan kosong untuk rumah kuis.
## Peta ini sengaja tanpa rumah: rumah muncul sesuai kuis. Hasilnya disimpan sebagai
## res://maps/lembah_sunnyside.tscn.
##
## Jalankan:  godot --headless --path tools/godot-maps --script res://scripts/build_lembah_sunnyside.gd
##
## Scene hasilnya boleh disunting tangan di editor Godot. Menjalankan skrip ini
## lagi akan menimpanya, jadi ubah skrip ini kalau perubahan harus bertahan.

const Kit := preload("res://scripts/sunnyside_kit.gd")

const W := 64
const H := 48
const SCENE := "res://maps/lembah_sunnyside.tscn"

## Bangunan di contoh room paket (x, y, lebar, tinggi; baris terbawah = bayangan).
const B := {
	"rumah_merah": Rect2i(32, 19, 5, 6),
	"rumah_ungu": Rect2i(13, 26, 6, 7),
	"pondok_hijau": Rect2i(21, 25, 4, 5),
	"pondok_merah": Rect2i(30, 26, 4, 5),
	"balai_biru": Rect2i(39, 24, 7, 7),
	"lumbung_kembar": Rect2i(17, 33, 11, 6),
	"rumah_hijau_tinggi": Rect2i(40, 32, 5, 7),
	"pondok_hijau2": Rect2i(50, 25, 4, 5),
	"rumah_oranye": Rect2i(54, 24, 6, 6),
	"rumah_oranye_besar": Rect2i(55, 30, 6, 6),
	"kios": Rect2i(64, 28, 4, 2),
	"rumah_biru_atas": Rect2i(54, 0, 5, 5),
	"rumah_biru": Rect2i(51, 6, 5, 5),
	"pondok_hijau3": Rect2i(53, 12, 4, 5),
	"menara_biru": Rect2i(43, 1, 4, 6),
	"menara_kincir": Rect2i(72, 1, 4, 13),
}

var kit: Kit


func _initialize() -> void:
	kit = Kit.new(W, H, 20261110)
	_ground()
	_terrain()
	_sites()
	_plaza()
	_farm()
	_forest()
	_scatter()

	var problems := kit.validate()
	kit.auto_spots(24)
	print(kit.ascii())
	print("pos soal luar-ruang: %d, lahan rumah: %d" % [kit.spots.size(), kit.sites.size()])
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://maps"))
	var err := kit.save_scene(SCENE, "LembahSunnyside", {
		"map_id": "map-desa-sunnyside",
		"slug": "lembah-sunnyside",
	})
	if err != OK:
		push_error("Gagal menyimpan scene (kode %d)" % err)
		problems += 1
	else:
		print("tersimpan ", SCENE)
	quit(1 if problems > 0 else 0)


func _ground() -> void:
	var variants: Array[Vector2i] = [Vector2i(1, 2), Vector2i(2, 2), Vector2i(3, 2)]
	for y in range(H):
		for x in range(W):
			var atlas := Vector2i(1, 3)
			if kit.rng.randf() < 0.07:
				atlas = kit.pick(variants)
			kit.put("Ground", Vector2i(x, y), atlas)


func _terrain() -> void:
	# Dataran tinggi di utara: tepinya menjorok ke selatan di bagian tengah.
	var edge := PackedInt32Array()
	for x in range(W):
		if x <= 17 or x >= 43:
			edge.append(16)
		elif x == 18 or x == 42:
			edge.append(17)
		else:
			edge.append(18)

	var water := {}
	Kit.ellipse(water, 29.5, 8.0, 4.6, 2.6) # telaga di dataran tinggi
	Kit.ellipse(water, 44.5, 21.5, 2.6, 1.7) # mata air di kaki tebing
	Kit.polyline(water, [Vector2i(44, 22), Vector2i(44, 30), Vector2i(47, 33), Vector2i(47, 40)], 3)
	Kit.ellipse(water, 51.5, 41.5, 6.2, 2.4) # danau
	kit.add_terrain("water", water)

	var dark := {}
	Kit.fill(dark, 5, 13, 54, 2) # jalan dataran tinggi
	Kit.fill(dark, 29, 15, 2, 3) # menuju tangga tengah
	Kit.fill(dark, 9, 15, 2, 1) # menuju tangga barat
	Kit.fill(dark, 56, 15, 2, 1) # menuju tangga timur
	Kit.fill(dark, 9, 19, 2, 8) # dari tangga barat ke jalan raya
	Kit.fill(dark, 56, 19, 2, 8) # dari tangga timur ke jalan raya
	Kit.fill(dark, 4, 27, 56, 2) # jalan raya barat-timur
	Kit.fill(dark, 24, 23, 12, 10) # alun-alun
	Kit.fill(dark, 29, 21, 2, 17) # jalan utara-selatan
	Kit.fill(dark, 6, 37, 52, 2) # jalan selatan
	kit.add_terrain("dark", dark)

	var light := {}
	Kit.fill(light, 8, 40, 8, 4) # petak ladang
	kit.add_terrain("light", light)

	kit.bridge(42, 27, 5, 2)
	kit.bridge(45, 37, 5, 2)
	kit.paint_terrains()

	kit.add_cliff(edge)
	kit.stairs(29, 18, 2, 3)
	kit.stairs(9, 16, 2, 3)
	kit.stairs(56, 16, 2, 3)


func _sites() -> void:
	# Lahan 7x8 untuk rumah kuis; baris terbawah menempel ke jalan.
	for origin: Vector2i in [
		Vector2i(6, 5), Vector2i(15, 5), Vector2i(37, 5), Vector2i(46, 5),
		Vector2i(11, 19), Vector2i(48, 19),
		Vector2i(6, 29), Vector2i(14, 29), Vector2i(36, 29), Vector2i(50, 29),
	]:
		kit.add_site(Rect2i(origin, Vector2i(7, 8)))


func _plaza() -> void:
	kit.multi(Vector2i(29, 24), Vector2i(44, 18), Vector2i(2, 4)) # patung
	kit.stamp(B.kios, Vector2i(25, 24))
	kit.stamp(B.kios, Vector2i(32, 24))
	kit.multi(Vector2i(26, 30), Vector2i(37, 19), Vector2i(2, 2)) # sumur
	kit.multi(Vector2i(33, 31), Vector2i(45, 10), Vector2i(2, 1)) # bangku
	kit.deco(Vector2i(24, 25), Vector2i(37, 16), true)
	kit.deco(Vector2i(35, 25), Vector2i(38, 16), true)
	kit.deco(Vector2i(35, 26), Vector2i(39, 16), true)
	kit.player_spawn = Vector2i(29, 30)
	kit.reserve_rect(28, 29, 4, 3)
	# Tempat duduk memandang lembah di tepi dataran tinggi, dan api unggun.
	kit.multi(Vector2i(22, 16), Vector2i(45, 10), Vector2i(2, 1))
	kit.multi(Vector2i(36, 16), Vector2i(45, 10), Vector2i(2, 1))
	kit.multi(Vector2i(20, 22), Vector2i(37, 21), Vector2i(2, 2))


func _farm() -> void:
	# Ladang: gundukan tanah dengan tanaman, selang satu baris supaya bisa dilewati.
	var crops: Array[int] = [51, 52, 53, 55, 56, 57, 58, 59]
	for row in [41, 43]:
		for i in range(6):
			var c := Vector2i(9 + i, row)
			kit.deco(c, Vector2i(50, 12), false, "DecoGround")
			kit.deco(c, Vector2i(crops[(i + row) % crops.size()], 17), true)
	# Kandang: pagar atas-bawah, sapi dan domba di dalamnya.
	for row in [40, 44]:
		for x in range(19, 27):
			var atlas := Vector2i(39, 2) if (x % 2) == 0 else Vector2i(41, 2)
			if x == 19:
				atlas = Vector2i(38, 2)
			elif x == 26:
				atlas = Vector2i(42, 2)
			kit.deco(Vector2i(x, row), atlas, true)
	kit.reserve_rect(19, 41, 8, 3)
	kit.add_sprite("cow.png", Vector2i(19 * 16, 41 * 16 - 8), 4, [Vector2i(19, 41), Vector2i(20, 41)])
	kit.add_sprite("cow.png", Vector2i(24 * 16, 42 * 16 - 8), 4, [Vector2i(24, 42), Vector2i(25, 42)], 2)
	kit.add_sprite("sheep.png", Vector2i(21 * 16, 42 * 16 - 4), 4, [Vector2i(21, 43), Vector2i(22, 43)])
	kit.add_sprite("pig.png", Vector2i(34 * 16, 41 * 16), 4, [Vector2i(34, 41), Vector2i(35, 41)])
	kit.add_sprite("chicken.png", Vector2i(17 * 16, 41 * 16 - 8), 4, [Vector2i(17, 41)])
	kit.add_sprite("chicken.png", Vector2i(40 * 16, 22 * 16 - 4), 4, [Vector2i(40, 22)], 1)
	kit.add_sprite("duck.png", Vector2i(49 * 16, 41 * 16), 4)
	kit.add_sprite("duck.png", Vector2i(54 * 16 + 6, 42 * 16 - 4), 4, [], 2)
	kit.add_sprite("duck.png", Vector2i(28 * 16, 8 * 16 - 4), 4, [], 1)
	kit.add_sprite("duck.png", Vector2i(31 * 16 + 4, 7 * 16), 4, [], 3)


func _forest() -> void:
	# Cincin hutan di tepi peta, dengan tepi dalam yang tidak rata.
	for j in range(0, H / 2 + 1):
		for i in range(0, W / 2 + 1):
			var edge: int = mini(mini(i, W / 2 - i), mini(j, H / 2 - j))
			if edge <= 1:
				kit.add_tree(Vector2i(i, j))
			elif edge == 2 and kit.rng.randf() < 0.55:
				kit.add_tree(Vector2i(i, j))
	# Rumpun pohon di dalam lembah.
	var placed := 0
	var tries := 0
	while placed < 14 and tries < 4000:
		tries += 1
		var origin := Vector2i(kit.rng.randi_range(3, W / 2 - 4), kit.rng.randi_range(3, H / 2 - 4))
		var size := Vector2i(kit.rng.randi_range(1, 2), 1)
		var ok := true
		for y in range(size.y):
			for x in range(size.x):
				var base := (origin + Vector2i(x, y)) * 2
				if not kit.area_free(base + Vector2i(-2, -3), Vector2i(4, 5)):
					ok = false
		if not ok:
			continue
		for y in range(size.y):
			for x in range(size.x):
				kit.add_tree(origin + Vector2i(x, y), true)
				var base := (origin + Vector2i(x, y)) * 2
				kit.reserve_rect(base.x - 2, base.y - 3, 4, 5)
		placed += 1
	# Tepi peta selalu tertutup, juga di celah hutan (ujung tebing, jalan).
	for y in range(H):
		for x in range(W):
			if x < 3 or y < 3 or x >= W - 3 or y >= H - 3:
				kit.block(Vector2i(x, y))


func _scatter() -> void:
	# Dekor yang menghalangi: semak, cemara, tunggul, batu.
	_scatter_multi(10, Vector2i(52, 3), Vector2i(1, 3), 2) # cemara kecil
	_scatter_multi(6, Vector2i(51, 6), Vector2i(2, 3), 2) # cemara besar
	_scatter_multi(5, Vector2i(49, 1), Vector2i(2, 2), -1) # semak besar
	_scatter_multi(5, Vector2i(49, 3), Vector2i(2, 2), -1) # semak beri merah
	_scatter_multi(3, Vector2i(49, 5), Vector2i(2, 2), -1) # semak beri jingga
	_scatter_single(14, [Vector2i(51, 4)], true, "Deco")
	_scatter_single(5, [Vector2i(31, 5), Vector2i(32, 5)], true, "Deco")
	_scatter_single(6, [Vector2i(31, 4)], true, "Deco")
	# Dekor tanah: bunga, rumput, kerikil, jamur.
	_scatter_single(150, [
		Vector2i(31, 1), Vector2i(34, 1), Vector2i(31, 2), Vector2i(34, 2), Vector2i(31, 3),
		Vector2i(34, 3), Vector2i(35, 3), Vector2i(33, 1), Vector2i(33, 2), Vector2i(33, 3),
	], false, "DecoGround")
	_scatter_single(200, [
		Vector2i(27, 1), Vector2i(28, 1), Vector2i(29, 1), Vector2i(30, 1), Vector2i(27, 2),
		Vector2i(28, 2), Vector2i(29, 2), Vector2i(30, 2), Vector2i(27, 3), Vector2i(28, 3),
		Vector2i(27, 4), Vector2i(28, 4), Vector2i(29, 4), Vector2i(30, 4),
	], false, "DecoGround")
	_scatter_single(18, [Vector2i(32, 4), Vector2i(33, 4), Vector2i(34, 4)], false, "DecoGround")
	_scatter_single(12, [Vector2i(49, 7), Vector2i(50, 7), Vector2i(49, 8), Vector2i(50, 8)], false, "DecoGround")


func _random_cell() -> Vector2i:
	return Vector2i(kit.rng.randi_range(3, W - 4), kit.rng.randi_range(3, H - 4))


func _scatter_single(count: int, tiles: Array, blocking: bool, layer: String) -> void:
	var placed := 0
	var tries := 0
	while placed < count and tries < count * 40:
		tries += 1
		var c := _random_cell()
		# Dekor penghalang diberi jarak supaya tidak menyumbat jalan.
		if not kit.area_free(c, Vector2i.ONE, 1 if blocking else 0):
			continue
		kit.deco(c, kit.pick(tiles), blocking, layer)
		placed += 1


func _scatter_multi(count: int, atlas: Vector2i, size: Vector2i, solid_rows: int) -> void:
	var placed := 0
	var tries := 0
	while placed < count and tries < count * 60:
		tries += 1
		var c := _random_cell()
		if not kit.area_free(c, size, 1):
			continue
		kit.multi(c, atlas, size, solid_rows)
		placed += 1
