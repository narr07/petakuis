extends SceneTree
## Menyusun peta "Pesisir Karang" (64x48 tile): kampung nelayan di tepi laut.
## Laut di selatan dan timur, pantai berpasir, dermaga kayu, rumah panggung,
## mercusuar batu, dan pulau kecil berpohon yang disambung titian.
##
## Jalankan:  godot --headless --path tools/godot-maps --script res://scripts/build_pesisir_karang.gd

const Kit := preload("res://scripts/sunnyside_kit.gd")

const W := 64
const H := 48
const SCENE := "res://maps/pesisir_karang.tscn"

var kit: Kit


func _initialize() -> void:
	kit = Kit.new(W, H, 20261111)
	kit.fill_ground()
	_terrain()
	_buildings()
	_details()
	kit.forest_ring(6)
	kit.scatter_nature(0.7)

	var problems := kit.validate()
	kit.auto_spots(24)
	print(kit.ascii())
	print("pos soal: %d" % kit.spots.size())
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://maps"))
	var err := kit.save_scene(SCENE, "PesisirKarang", {
		"map_id": "map-pesisir-karang",
		"slug": "pesisir-karang",
	})
	if err != OK:
		push_error("Gagal menyimpan scene (kode %d)" % err)
		problems += 1
	else:
		print("tersimpan ", SCENE)
	quit(1 if problems > 0 else 0)


func _terrain() -> void:
	# Laut: selatan dan timur, garis pantai dibuat tidak lurus.
	var water := {}
	Kit.fill(water, 0, 36, W, H - 36)
	Kit.fill(water, 48, 14, W - 48, 22)
	Kit.ellipse(water, 10.0, 35.5, 6.0, 2.0) # teluk barat
	Kit.ellipse(water, 34.0, 35.0, 5.0, 1.6) # teluk tengah
	Kit.ellipse(water, 49.0, 22.0, 3.0, 5.0) # teluk timur
	# Pulau kecil di timur.
	var island := {}
	Kit.ellipse(island, 57.0, 29.0, 4.6, 3.4)
	for c: Vector2i in island:
		water.erase(c)
	kit._normalize(water)

	# Pantai berpasir: jalur terang di sepanjang garis air.
	var beach := {}
	Kit.fill(beach, 3, 33, 45, 3)
	Kit.fill(beach, 45, 12, 3, 24)
	for c: Vector2i in water:
		beach.erase(c)

	var road := {}
	Kit.fill(road, 4, 30, 41, 2) # jalan pantai
	Kit.fill(road, 43, 6, 2, 26) # jalan timur ke mercusuar
	Kit.fill(road, 45, 9, 10, 2) # cabang ke mercusuar
	Kit.fill(road, 4, 20, 39, 2) # lorong kampung
	Kit.fill(road, 24, 9, 2, 22) # jalan utama utara-selatan
	Kit.fill(road, 18, 7, 14, 6) # lapangan kampung
	Kit.fill(road, 9, 11, 10, 2) # jalan ke balai nelayan

	kit.add_terrain("water", water)
	kit.add_terrain("dark", road)
	kit.add_terrain("light", beach)

	# Dermaga & titian (dibuat sebelum mengecat medan agar pinggiran tidak tergambar di atasnya).
	kit.bridge(18, 36, 2, 7, true) # dermaga selatan
	kit.bridge(14, 42, 6, 2) # ujung dermaga
	kit.bridge(31, 33, 2, 5, true) # titian ke rumah panggung (mulai di pasir supaya tersambung)
	kit.bridge(48, 28, 5, 2) # titian ke pulau
	kit.paint_terrains()
	kit.shoreline("light") # garis pantai berbuih di antara pasir dan laut


func _buildings() -> void:
	# Deret rumah menghadap jalan pantai (baris bayangan menempel jalan).
	kit.place("rumah_biru", Vector2i(5, 25))
	kit.place("pondok_merah", Vector2i(11, 25))
	kit.place("rumah_oranye", Vector2i(16, 24))
	kit.place("gudang_hijau", Vector2i(27, 26))
	kit.place("rumah_biru_atas", Vector2i(32, 25))
	kit.place("pondok_hijau2", Vector2i(38, 25))
	# Deret rumah menghadap lorong kampung.
	kit.place("rumah_ungu", Vector2i(5, 13))
	kit.place("rumah_merah", Vector2i(12, 14))
	kit.place("pondok_hijau", Vector2i(19, 15))
	kit.place("rumah_hijau_tinggi", Vector2i(27, 14))
	kit.place("rumah_oranye_samping", Vector2i(33, 14))
	kit.place("gudang_kecil", Vector2i(38, 16))
	# Balai nelayan di utara, mercusuar di tanjung timur laut.
	kit.place("balai_biru", Vector2i(9, 4))
	kit.place("menara_batu", Vector2i(55, 4), false, false) # mercusuar tanpa baling-baling
	# Rumah panggung di atas laut.
	kit.place("panggung_merah", Vector2i(21, 37), true)
	kit.place("panggung_merah", Vector2i(30, 38), true)
	kit.place("panggung_kincir", Vector2i(50, 33), true)


func _details() -> void:
	# Lapangan kampung: sumur, kios ikan, bangku.
	kit.multi(Vector2i(20, 8), Vector2i(37, 19), Vector2i(2, 2)) # sumur
	kit.place("kios", Vector2i(27, 7), true)
	kit.multi(Vector2i(22, 11), Vector2i(45, 10), Vector2i(2, 1)) # bangku
	kit.multi(Vector2i(28, 11), Vector2i(45, 10), Vector2i(2, 1))

	# Pohon di pulau.
	for v: Vector2i in [Vector2i(29, 14), Vector2i(30, 15), Vector2i(28, 16)]:
		kit.add_tree(v)

	# Bebek di laut dan teluk.
	kit.add_sprite("duck.png", Vector2i(8 * 16, 39 * 16), 4)
	kit.add_sprite("duck.png", Vector2i(26 * 16, 41 * 16), 4, [], 2)
	kit.add_sprite("duck.png", Vector2i(41 * 16, 39 * 16), 4, [], 1)
	kit.add_sprite("duck.png", Vector2i(54 * 16, 18 * 16), 4, [], 3)
	kit.add_sprite("duck.png", Vector2i(60 * 16, 38 * 16), 4)
	# Ayam di kampung.
	kit.add_sprite("chicken.png", Vector2i(9 * 16, 22 * 16 - 8), 4, [Vector2i(9, 22)])
	kit.add_sprite("chicken.png", Vector2i(36 * 16, 23 * 16 - 8), 4, [Vector2i(36, 23)], 1)

	kit.player_spawn = Vector2i(22, 31)
	kit.reserve_rect(20, 30, 4, 2)
