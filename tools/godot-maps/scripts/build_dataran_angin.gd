extends SceneTree
## Menyusun peta "Dataran Tinggi Angin" (64x48 tile): tiga undakan tebing.
## Undakan atas: kincir angin, kandang domba, dan telaga. Undakan tengah: kampung
## dan ladang. Lembah bawah: sungai berjembatan. Undakan disambung tangga papan.
##
## Jalankan:  godot --headless --path tools/godot-maps --script res://scripts/build_dataran_angin.gd

const Kit := preload("res://scripts/sunnyside_kit.gd")

const W := 64
const H := 48
const SCENE := "res://maps/dataran_angin.tscn"

var kit: Kit


func _initialize() -> void:
	kit = Kit.new(W, H, 20261112)
	kit.fill_ground()
	_terrain()
	_buildings()
	_details()
	kit.forest_ring(5)
	kit.scatter_nature(0.8)

	var problems := kit.validate()
	kit.auto_spots(24)
	print(kit.ascii())
	print("pos soal: %d" % kit.spots.size())
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://maps"))
	var err := kit.save_scene(SCENE, "DataranAngin", {
		"map_id": "map-dataran-angin",
		"slug": "dataran-angin",
	})
	if err != OK:
		push_error("Gagal menyimpan scene (kode %d)" % err)
		problems += 1
	else:
		print("tersimpan ", SCENE)
	quit(1 if problems > 0 else 0)


func _terrain() -> void:
	# Tepi undakan: baris terakhir dataran di atas tebing (beda antarkolom maks 1).
	var upper := PackedInt32Array()
	var middle := PackedInt32Array()
	for x in range(W):
		upper.append(17 if x <= 36 else 18)
		if x <= 20:
			middle.append(32)
		elif x <= 44:
			middle.append(33)
		else:
			middle.append(32)

	var water := {}
	Kit.ellipse(water, 35.5, 9.5, 2.6, 1.8) # telaga di undakan atas
	Kit.polyline(water, [Vector2i(2, 38), Vector2i(22, 37), Vector2i(42, 39), Vector2i(62, 38)], 3) # sungai
	kit.add_terrain("water", water)

	var road := {}
	Kit.fill(road, 5, 14, 54, 2) # jalan undakan atas
	Kit.fill(road, 18, 16, 2, 1) # ke tangga barat atas
	Kit.fill(road, 50, 16, 2, 2) # ke tangga timur atas
	Kit.fill(road, 18, 20, 2, 7) # turun dari tangga barat atas
	Kit.fill(road, 50, 21, 2, 6) # turun dari tangga timur atas
	Kit.fill(road, 4, 27, 56, 2) # jalan undakan tengah
	Kit.fill(road, 10, 29, 2, 3) # ke tangga bawah barat
	Kit.fill(road, 32, 29, 2, 4) # ke tangga bawah tengah
	Kit.fill(road, 56, 29, 2, 3) # ke tangga bawah timur
	for x in [10, 56]:
		Kit.fill(road, x, 35, 2, 6) # menyeberang sungai
	Kit.fill(road, 32, 36, 2, 5)
	Kit.fill(road, 4, 41, 56, 2) # jalan lembah bawah
	kit.add_terrain("dark", road)

	for x in [10, 32, 56]:
		kit.bridge(x, 36, 2, 4, true)
	kit.paint_terrains()

	kit.add_cliff(upper)
	kit.add_cliff(middle)
	kit.stairs(18, 17, 2, 3)
	kit.stairs(50, 18, 2, 3)
	kit.stairs(10, 32, 2, 3)
	kit.stairs(32, 33, 2, 3)
	kit.stairs(56, 32, 2, 3)


func _buildings() -> void:
	# Undakan atas: dua kincir angin besar mengapit padang.
	kit.place("menara_batu", Vector2i(6, 4))
	kit.place("menara_batu", Vector2i(40, 4))
	kit.place("pondok_hijau3", Vector2i(12, 9))
	kit.place("rumah_biru_atas", Vector2i(46, 9))
	kit.place("menara_biru", Vector2i(53, 7))
	# Undakan tengah: kampung menghadap jalan.
	kit.place("rumah_merah", Vector2i(4, 21))
	kit.place("rumah_oranye", Vector2i(10, 21))
	kit.place("balai_biru", Vector2i(21, 20))
	kit.place("pondok_merah", Vector2i(29, 22))
	kit.place("menara_merah", Vector2i(34, 20))
	kit.place("rumah_hijau_tinggi", Vector2i(38, 21))
	kit.place("rumah_oranye_samping", Vector2i(44, 21))
	kit.place("pondok_hijau", Vector2i(53, 22))
	kit.place("gudang_hijau", Vector2i(57, 23))


func _details() -> void:
	# Kandang domba di undakan atas.
	kit.fence_row(18, 30, 6)
	kit.fence_row(18, 30, 11)
	kit.reserve_rect(18, 7, 13, 4)
	kit.add_sprite("sheep.png", Vector2i(19 * 16, 7 * 16 - 4), 4, [Vector2i(19, 8), Vector2i(20, 8)])
	kit.add_sprite("sheep.png", Vector2i(23 * 16, 8 * 16 - 4), 4, [Vector2i(23, 9), Vector2i(24, 9)], 1)
	kit.add_sprite("sheep.png", Vector2i(27 * 16, 7 * 16 - 4), 4, [Vector2i(27, 8), Vector2i(28, 8)], 2)
	kit.add_sprite("duck.png", Vector2i(34 * 16, 9 * 16), 4)

	# Ladang di undakan tengah, di bawah jalan.
	kit.crop_rows(14, 8, [30])
	kit.crop_rows(36, 10, [30])
	kit.add_sprite("chicken.png", Vector2i(26 * 16, 30 * 16 - 8), 4, [Vector2i(26, 30)])

	# Lembah bawah: hewan di tepi sungai.
	kit.add_sprite("cow.png", Vector2i(20 * 16, 35 * 16 - 8), 4, [Vector2i(20, 35), Vector2i(21, 35)])
	kit.add_sprite("cow.png", Vector2i(46 * 16, 35 * 16 - 8), 4, [Vector2i(46, 35), Vector2i(47, 35)], 2)
	kit.add_sprite("duck.png", Vector2i(16 * 16, 37 * 16), 4, [], 1)
	kit.add_sprite("duck.png", Vector2i(48 * 16, 38 * 16), 4, [], 3)

	kit.player_spawn = Vector2i(25, 28)
	kit.reserve_rect(23, 27, 4, 2)
