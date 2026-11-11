extends SceneTree
## Menyusun peta "Kota Pasar" (64x48 tile): kota berpetak dengan pasar di tengah.
## Jalan membentuk blok-blok rumah, kanal membelah kota dengan dua jembatan,
## balai kota di timur, dan menara kayu berkincir sebagai penanda di barat laut.
##
## Jalankan:  godot --headless --path tools/godot-maps --script res://scripts/build_kota_pasar.gd

const Kit := preload("res://scripts/sunnyside_kit.gd")

const W := 64
const H := 48
const SCENE := "res://maps/kota_pasar.tscn"

var kit: Kit


func _initialize() -> void:
	kit = Kit.new(W, H, 20261113)
	kit.fill_ground()
	_terrain()
	_buildings()
	_market()
	_details()
	kit.forest_ring(3)
	kit.scatter_nature(0.45)

	var problems := kit.validate()
	kit.auto_spots(24)
	print(kit.ascii())
	print("pos soal: %d" % kit.spots.size())
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://maps"))
	var err := kit.save_scene(SCENE, "KotaPasar", {
		"map_id": "map-kota-pasar",
		"slug": "kota-pasar",
	})
	if err != OK:
		push_error("Gagal menyimpan scene (kode %d)" % err)
		problems += 1
	else:
		print("tersimpan ", SCENE)
	quit(1 if problems > 0 else 0)


func _terrain() -> void:
	var water := {}
	Kit.polyline(water, [Vector2i(40, 1), Vector2i(40, 46)], 3) # kanal
	kit.add_terrain("water", water)

	var road := {}
	Kit.fill(road, 4, 19, 56, 2) # jalan utara
	Kit.fill(road, 4, 32, 56, 2) # jalan selatan
	Kit.fill(road, 14, 5, 2, 39) # jalan barat
	Kit.fill(road, 31, 5, 2, 39) # jalan tengah
	Kit.fill(road, 48, 5, 2, 39) # jalan timur
	Kit.fill(road, 16, 21, 15, 11) # alun-alun pasar
	for c: Vector2i in water:
		road.erase(c)
	kit.add_terrain("dark", road)

	kit.bridge(38, 19, 5, 2)
	kit.bridge(38, 32, 5, 2)
	kit.paint_terrains()


func _buildings() -> void:
	# Blok utara (baris bayangan menempel jalan utara di baris 19).
	kit.place("menara_kayu", Vector2i(5, 5))
	kit.place("rumah_ungu", Vector2i(16, 12))
	kit.place("rumah_merah", Vector2i(23, 13))
	kit.place("gudang_kecil", Vector2i(28, 15))
	kit.place("menara_merah", Vector2i(34, 12))
	kit.place("rumah_oranye", Vector2i(42, 13))
	kit.place("balai_biru", Vector2i(51, 12))
	kit.place("menara_biru", Vector2i(53, 4))
	kit.place("pondok_hijau3", Vector2i(18, 5))
	kit.place("pondok_merah", Vector2i(24, 6))
	# Blok tengah (menempel jalan selatan di baris 32).
	kit.place("rumah_biru_atas", Vector2i(4, 27))
	kit.place("pondok_hijau2", Vector2i(9, 27))
	kit.place("pondok_merah", Vector2i(34, 27))
	kit.place("rumah_hijau_tinggi", Vector2i(42, 26))
	kit.place("rumah_oranye_besar", Vector2i(51, 27))
	kit.place("gudang_hijau", Vector2i(57, 28))
	kit.place("rumah_biru", Vector2i(5, 21))
	# Blok selatan (di bawah jalan selatan).
	kit.place("pondok_hijau", Vector2i(5, 35))
	kit.place("lumbung_kembar", Vector2i(18, 35))
	kit.place("pondok_hijau", Vector2i(34, 35))
	kit.place("rumah_biru", Vector2i(42, 35))
	kit.place("rumah_oranye_samping", Vector2i(51, 35))
	kit.place("rumah_merah", Vector2i(55, 35))


func _market() -> void:
	# Deretan kios dengan lorong di antaranya, sumur dan patung di tengah.
	for pos: Vector2i in [Vector2i(17, 22), Vector2i(25, 22), Vector2i(17, 29), Vector2i(25, 29)]:
		kit.place("kios", pos, true)
	kit.multi(Vector2i(22, 25), Vector2i(37, 19), Vector2i(2, 2)) # sumur
	kit.multi(Vector2i(28, 25), Vector2i(44, 18), Vector2i(2, 4)) # patung
	kit.multi(Vector2i(17, 26), Vector2i(45, 10), Vector2i(2, 1)) # bangku
	kit.player_spawn = Vector2i(20, 27)
	kit.reserve_rect(19, 26, 3, 3)


func _details() -> void:
	# Sapi di belakang lumbung.
	kit.add_sprite("cow.png", Vector2i(20 * 16, 41 * 16 - 8), 4, [Vector2i(20, 41), Vector2i(21, 41)])
	kit.add_sprite("cow.png", Vector2i(25 * 16, 41 * 16 - 8), 4, [Vector2i(25, 41), Vector2i(26, 41)], 2)
	kit.reserve_rect(18, 41, 11, 2)
	# Bebek di kanal, ayam di kota.
	kit.add_sprite("duck.png", Vector2i(39 * 16 + 4, 10 * 16), 4)
	kit.add_sprite("duck.png", Vector2i(39 * 16 + 6, 27 * 16), 4, [], 2)
	kit.add_sprite("duck.png", Vector2i(39 * 16 + 2, 40 * 16), 4, [], 1)
	kit.add_sprite("chicken.png", Vector2i(12 * 16, 24 * 16 - 8), 4, [Vector2i(12, 24)])
	kit.add_sprite("chicken.png", Vector2i(46 * 16, 24 * 16 - 8), 4, [Vector2i(46, 24)], 1)
