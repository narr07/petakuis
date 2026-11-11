extends RefCounted
## Perkakas penyusun peta dari paket Sunnyside World.
##
## - Autotile jalan/air bersudut 45 derajat (mengikuti cara tile dipakai di
##   contoh room bawaan paket).
## - Hutan dengan tileset 32 px berbasis titik sudut (pohon berdiri di titik kisi).
## - "Stamp" bangunan: susunan tile rumah diambil langsung dari Room1.yy milik
##   paket, jadi tidak ada data seni yang disimpan di repositori.
## - Menyimpan hasil sebagai scene TileMapLayer yang bisa disunting di editor.

const Buildings := preload("res://scripts/buildings.gd")

const PACK_ROOM := "../../Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Gamemaker/rooms/Room1/Room1.yy"
const VENDOR := "res://assets/vendor/sunnyside/"
const T := 16

const FLIP_H := TileSetAtlasSource.TRANSFORM_FLIP_H
const FLIP_V := TileSetAtlasSource.TRANSFORM_FLIP_V
const TRANSPOSE := TileSetAtlasSource.TRANSFORM_TRANSPOSE

const UP := Vector2i(0, -1)
const DOWN := Vector2i(0, 1)
const LEFT := Vector2i(-1, 0)
const RIGHT := Vector2i(1, 0)

## Urutan gambar dari bawah ke atas.
const LAYERS: Array[String] = [
	"Ground", "Water", "Shore", "Shore2", "PathDark", "PathLight", "Edge", "Edge2", "Cliff", "Bridge",
	"Shadows", "DecoGround", "Building", "Walls", "Deco", "DecoTop",
]

## Layer room GameMaker -> layer scene.
const STAMP_LAYERS := {
	"shadows": "Shadows",
	"building": "Building",
	"walls": "Walls",
	"decoration_02": "Deco",
	"decoration_03": "DecoTop",
}

## Sudut yang dipotong pada tile diagonal.
enum { CUT_TL, CUT_TR, CUT_BL, CUT_BR }

## Keluarga tile medan. `diag[c]` = tile yang sudut c-nya kosong.
const FAMILY := {
	"dark": {
		"layer": "PathDark",
		"solid": [Vector2i(12, 7), Vector2i(12, 7), Vector2i(12, 7), Vector2i(12, 7), Vector2i(12, 7),
			Vector2i(20, 7), Vector2i(21, 7), Vector2i(20, 8), Vector2i(21, 8)],
		"diag": [Vector2i(13, 7), Vector2i(14, 7), Vector2i(16, 7), Vector2i(12, 8)],
		"fringe": 12,
	},
	"light": {
		"layer": "PathLight",
		"solid": [Vector2i(1, 7), Vector2i(1, 7), Vector2i(1, 7), Vector2i(1, 7), Vector2i(1, 7), Vector2i(1, 7),
			Vector2i(9, 7), Vector2i(10, 7), Vector2i(11, 7), Vector2i(9, 8), Vector2i(10, 8)],
		"diag": [Vector2i(2, 7), Vector2i(3, 7), Vector2i(5, 7), Vector2i(1, 8)],
		"fringe": 1,
	},
	"water": {
		"layer": "Water",
		"solid": [Vector2i(22, 7)],
		"diag": [Vector2i(23, 7), Vector2i(24, 7), Vector2i(26, 7), Vector2i(22, 8)],
		"fringe": 12,
	},
}

## Tile hutan 32 px menurut bit sudut (TL=8, TR=4, BL=2, BR=1).
const FOREST := {
	0b0111: Vector2i(2, 1), 0b1011: Vector2i(3, 1), 0b0011: Vector2i(4, 1),
	0b1101: Vector2i(5, 1), 0b0101: Vector2i(6, 1), 0b1001: Vector2i(7, 1),
	0b0001: Vector2i(8, 1), 0b1110: Vector2i(1, 2), 0b0110: Vector2i(2, 2),
	0b1010: Vector2i(3, 2), 0b0010: Vector2i(4, 2), 0b1100: Vector2i(5, 2),
	0b0100: Vector2i(6, 2), 0b1000: Vector2i(7, 2),
}
const FOREST_FULL: Array[Vector2i] = [Vector2i(1, 1), Vector2i(8, 2), Vector2i(8, 3), Vector2i(8, 2)]

var width: int
var height: int
var rng := RandomNumberGenerator.new()

var cells := {} ## nama layer -> { Vector2i: [Vector2i atlas, int alt] }
var forest := {} ## titik kisi 32 px -> true
var blocked := {} ## sel 16 px -> true (dipakai pencarian jalan & pos soal)
## Sel 8 px (koordinat 2x) yang terhalang, untuk gerak pemain. Bangunan dan benda
## dihitung dari pikselnya, jadi pemain bisa merapat sampai tepi gambar; medan lain
## menutup keempat sel kecilnya. Sel 16 px terhalang bila salah satu sel kecilnya terhalang.
var fine := {}
var reserved := {} ## sel yang tidak boleh ditimpa dekor acak / pohon
var sprites: Array[Dictionary] = []
var spots: Array[Dictionary] = []
var sites: Array[Rect2i] = [] ## lahan kosong untuk rumah kuis
var walkable := {} ## sel yang terjangkau dari titik mulai (diisi validate())
var player_spawn := Vector2i.ZERO

var _room := {}
var _sheet: Image
var _invisible := {}
var _quarter_cache := {}
var _terrain := {} ## keluarga -> { "mask": {}, "diag": {} }

## Seperempat tile (8x8 px) dianggap padat bila piksel tak transparannya sebanyak ini.
const FINE_FILL := 0.35


func _init(w: int, h: int, seed_value: int) -> void:
	width = w
	height = h
	rng.seed = seed_value
	for layer in LAYERS:
		cells[layer] = {}
	_sheet = Image.load_from_file(ProjectSettings.globalize_path(VENDOR + "tiles16.png"))
	_load_room()


# ---------------------------------------------------------------- dasar

func put(layer: String, cell: Vector2i, atlas: Vector2i, alt := 0) -> void:
	if cell.x < 0 or cell.y < 0 or cell.x >= width or cell.y >= height:
		return
	cells[layer][cell] = [atlas, alt]


func block(cell: Vector2i) -> void:
	set_blocked(cell)
	reserved[cell] = true


## Menutup satu sel 16 px beserta keempat sel kecilnya.
func set_blocked(cell: Vector2i) -> void:
	blocked[cell] = true
	_fine_all(cell, true)


## Membuka satu sel 16 px beserta keempat sel kecilnya (jembatan, tangga).
func set_open(cell: Vector2i) -> void:
	blocked.erase(cell)
	_fine_all(cell, false)


func _fine_all(cell: Vector2i, on: bool) -> void:
	for dy in 2:
		for dx in 2:
			var f := cell * 2 + Vector2i(dx, dy)
			if on:
				fine[f] = true
			else:
				fine.erase(f)


## Persentase piksel padat di empat seperempat tile atlas (TL, TR, BL, BR), sebelum ditransformasi.
func _quarters(atlas: Vector2i) -> PackedFloat32Array:
	if _quarter_cache.has(atlas):
		return _quarter_cache[atlas]
	var img := _sheet.get_region(Rect2i(atlas * T, Vector2i(T, T)))
	var q := PackedFloat32Array([0.0, 0.0, 0.0, 0.0])
	for y in range(T):
		for x in range(T):
			if img.get_pixel(x, y).a > 0.0:
				q[(y / 8) * 2 + x / 8] += 1.0
	for i in range(4):
		q[i] /= 64.0
	_quarter_cache[atlas] = q
	return q


## Menutup sel kecil di `cell` yang benar-benar tertutup piksel tile `atlas`.
## Urutan transformasi sama dengan TileMapLayer: transpose dulu, lalu cermin.
func block_pixels(cell: Vector2i, atlas: Vector2i, alt := 0) -> void:
	var q := _quarters(atlas)
	for i in range(4):
		if q[i] < FINE_FILL:
			continue
		var qx := i % 2
		var qy := i / 2
		if alt & TRANSPOSE:
			var tmp := qx
			qx = qy
			qy = tmp
		if alt & FLIP_H:
			qx = 1 - qx
		if alt & FLIP_V:
			qy = 1 - qy
		fine[cell * 2 + Vector2i(qx, qy)] = true
		blocked[cell] = true


func reserve_rect(x: int, y: int, w: int, h: int) -> void:
	for cy in range(y, y + h):
		for cx in range(x, x + w):
			reserved[Vector2i(cx, cy)] = true


func is_free(cell: Vector2i) -> bool:
	return not reserved.has(cell) and cell.x >= 0 and cell.y >= 0 and cell.x < width and cell.y < height


func pick(options: Array) -> Variant:
	return options[rng.randi_range(0, options.size() - 1)]


# ---------------------------------------------------------------- mask

static func fill(mask: Dictionary, x: int, y: int, w: int, h: int) -> void:
	for cy in range(y, y + h):
		for cx in range(x, x + w):
			mask[Vector2i(cx, cy)] = true


static func ellipse(mask: Dictionary, cx: float, cy: float, rx: float, ry: float) -> void:
	for y in range(floori(cy - ry), ceili(cy + ry) + 1):
		for x in range(floori(cx - rx), ceili(cx + rx) + 1):
			var dx := (x + 0.5 - cx) / rx
			var dy := (y + 0.5 - cy) / ry
			if dx * dx + dy * dy <= 1.0:
				mask[Vector2i(x, y)] = true


## Garis patah selebar `thickness` sel (untuk sungai).
static func polyline(mask: Dictionary, points: Array, thickness: int) -> void:
	var lo := -(thickness / 2)
	for i in range(points.size() - 1):
		var a: Vector2 = Vector2(points[i])
		var b: Vector2 = Vector2(points[i + 1])
		var steps := int(maxf(absf(b.x - a.x), absf(b.y - a.y)))
		for s in range(steps + 1):
			var p := a.lerp(b, float(s) / maxf(steps, 1))
			fill(mask, roundi(p.x) + lo, roundi(p.y) + lo, thickness, thickness)


## Menutup celah yang tidak bisa digambar rapi (sel kosong terjepit).
func _normalize(mask: Dictionary) -> void:
	var changed := true
	while changed:
		changed = false
		for c: Vector2i in _outline(mask, false):
			var n := mask.has(c + UP)
			var s := mask.has(c + DOWN)
			var w := mask.has(c + LEFT)
			var e := mask.has(c + RIGHT)
			if int(n) + int(s) + int(w) + int(e) >= 3 or (n and s) or (w and e):
				mask[c] = true
				changed = true


func _outline(mask: Dictionary, with_diagonals: bool) -> Array:
	var out := {}
	var dirs: Array[Vector2i] = [UP, DOWN, LEFT, RIGHT]
	if with_diagonals:
		dirs.append_array([Vector2i(-1, -1), Vector2i(1, -1), Vector2i(-1, 1), Vector2i(1, 1)])
	for c: Vector2i in mask:
		for d in dirs:
			if not mask.has(c + d):
				out[c + d] = true
	return out.keys()


# ---------------------------------------------------------------- medan

## Mendaftarkan medan. Panggil `paint_terrains()` setelah semua terdaftar supaya
## pinggiran rumput tidak digambar di atas medan lain.
func add_terrain(family: String, mask: Dictionary) -> void:
	_normalize(mask)
	var diag := {}
	# Sudut cekung: sel kosong dengan dua tetangga padat yang bersebelahan.
	for c: Vector2i in _outline(mask, false):
		var n := mask.has(c + UP)
		var s := mask.has(c + DOWN)
		var w := mask.has(c + LEFT)
		var e := mask.has(c + RIGHT)
		if n and w:
			diag[c] = CUT_BR
		elif n and e:
			diag[c] = CUT_BL
		elif s and w:
			diag[c] = CUT_TR
		elif s and e:
			diag[c] = CUT_TL
	# Sudut cembung: pojok blok padat dipotong, kecuali sudah disambung sudut cekung.
	var fills := diag.duplicate()
	for c: Vector2i in mask:
		var n := mask.has(c + UP) or fills.has(c + UP)
		var s := mask.has(c + DOWN) or fills.has(c + DOWN)
		var w := mask.has(c + LEFT) or fills.has(c + LEFT)
		var e := mask.has(c + RIGHT) or fills.has(c + RIGHT)
		if not n and not w and mask.has(c + DOWN) and mask.has(c + RIGHT) and mask.has(c + Vector2i(1, 1)):
			diag[c] = CUT_TL
		elif not n and not e and mask.has(c + DOWN) and mask.has(c + LEFT) and mask.has(c + Vector2i(-1, 1)):
			diag[c] = CUT_TR
		elif not s and not w and mask.has(c + UP) and mask.has(c + RIGHT) and mask.has(c + Vector2i(1, -1)):
			diag[c] = CUT_BL
		elif not s and not e and mask.has(c + UP) and mask.has(c + LEFT) and mask.has(c + Vector2i(-1, -1)):
			diag[c] = CUT_BR
	_terrain[family] = {"mask": mask, "diag": diag}
	for c: Vector2i in mask:
		reserved[c] = true
	for c: Vector2i in diag:
		reserved[c] = true
	if family == "water":
		for c: Vector2i in mask:
			set_blocked(c)
		# Tile diagonal: pojok yang dipotong berisi rumput, jadi sel kecil di pojok itu dibuka.
		var corner_cell := [Vector2i(0, 0), Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1)]
		for c: Vector2i in diag:
			set_blocked(c)
			fine.erase(c * 2 + corner_cell[diag[c]])


## Garis pantai berbuih di sel air yang menempel medan `land` (biasanya pasir = "light"),
## meniru cara pantai digambar di contoh room paket. Panggil setelah paint_terrains().
## Tepi lurus memakai tile (20,5) yang diputar; tepi miring memakai (19,5)/(21,5)
## yang sudah berisi segitiga pasir, ditambah "ekor" (19,6)/(21,6) di sel sebelahnya.
func shoreline(land := "light") -> void:
	if not _terrain.has("water") or not _terrain.has(land):
		return
	var water_mask: Dictionary = _terrain["water"].mask
	var water_diag: Dictionary = _terrain["water"].diag
	var sand: Dictionary = _terrain[land].mask.duplicate()
	sand.merge(_terrain[land].diag)
	var straight := Vector2i(20, 5)
	var water := {}
	for c: Vector2i in water_mask:
		water[c] = true
	for c: Vector2i in water_diag:
		water[c] = true

	var around: Array[Vector2i] = [UP, DOWN, LEFT, RIGHT,
		Vector2i(-1, -1), Vector2i(1, -1), Vector2i(-1, 1), Vector2i(1, 1)]
	# Pasir miring yang menempel air dibuat penuh: sudut pantai digambar oleh potongan air.
	var land_def: Dictionary = FAMILY[land]
	for c: Vector2i in _terrain[land].diag:
		for d in around:
			if water.has(c + d):
				put(land_def.layer, c, land_def.solid[0])
				break

	for c: Vector2i in water:
		if cells["Bridge"].has(c):
			continue
		if water_diag.has(c):
			var touches_sand := false
			for d in around:
				if sand.has(c + d):
					touches_sand = true
					break
			if touches_sand:
				var cut: int = water_diag[c]
				var left_side := cut == CUT_TL or cut == CUT_BL
				var top_side := cut == CUT_TL or cut == CUT_TR
				# Tile air diagonal bawaan punya garis rumput; di pantai diganti air penuh.
				put("Water", c, FAMILY["water"].solid[0])
				var corner := Vector2i(19, 5) if left_side else Vector2i(21, 5)
				var tail := Vector2i(19, 6) if left_side else Vector2i(21, 6)
				var flip := 0 if top_side else FLIP_V
				_put_shore(c, corner, flip)
				var tail_cell := c + (DOWN if top_side else UP)
				if water.has(tail_cell) and not water_diag.has(tail_cell):
					_put_shore(tail_cell, tail, flip)
				continue
		if sand.has(c + UP):
			_put_shore(c, straight, 0)
		if sand.has(c + DOWN):
			_put_shore(c, straight, FLIP_V)
		if sand.has(c + LEFT):
			_put_shore(c, straight, TRANSPOSE)
		if sand.has(c + RIGHT):
			_put_shore(c, straight, TRANSPOSE | FLIP_H)


func _put_shore(cell: Vector2i, atlas: Vector2i, alt: int) -> void:
	if not cells["Shore"].has(cell):
		put("Shore", cell, atlas, alt)
	elif not cells["Shore2"].has(cell):
		put("Shore2", cell, atlas, alt)


func terrain_has(family: String, cell: Vector2i) -> bool:
	if not _terrain.has(family):
		return false
	return _terrain[family].mask.has(cell) or _terrain[family].diag.has(cell)


func paint_terrains(order: Array = ["water", "dark", "light"]) -> void:
	for family: String in order:
		if _terrain.has(family):
			_paint_family(family)


func _paint_family(family: String) -> void:
	var def: Dictionary = FAMILY[family]
	var mask: Dictionary = _terrain[family].mask
	var diag: Dictionary = _terrain[family].diag
	var layer: String = def.layer

	for c: Vector2i in mask:
		if diag.has(c):
			put(layer, c, def.diag[diag[c]])
		else:
			put(layer, c, pick(def.solid))
	for c: Vector2i in diag:
		if not mask.has(c):
			put(layer, c, def.diag[diag[c]])

	# Pinggiran rumput di sel sekitar.
	var f: int = def.fringe
	var edge_n := Vector2i(f + 4, 8) # tetangga utara padat -> garis di sisi atas
	var edge_s := Vector2i(f + 3, 7)
	var edge_w := Vector2i(f + 2, 8)
	var edge_e := Vector2i(f + 5, 7)
	var dot := [Vector2i(f + 6, 8), Vector2i(f + 5, 8), Vector2i(f + 3, 8), Vector2i(f + 7, 7)] # TL TR BL BR
	var dot_tl_br := Vector2i(f + 6, 7)
	var dot_tr_bl := Vector2i(f + 1, 8)

	var around := {}
	for c: Vector2i in mask:
		around[c] = true
	for c: Vector2i in diag:
		around[c] = true
	for c: Vector2i in _outline(around, true):
		if _is_other_terrain(family, c):
			continue
		var n := _solid(mask, diag, c + UP)
		var s := _solid(mask, diag, c + DOWN)
		var w := _solid(mask, diag, c + LEFT)
		var e := _solid(mask, diag, c + RIGHT)
		var tiles: Array[Vector2i] = []
		if n:
			tiles.append(edge_n)
		if s:
			tiles.append(edge_s)
		if w:
			tiles.append(edge_w)
		if e:
			tiles.append(edge_e)
		var tl := not (n or w) and _corner_touched(mask, diag, c, CUT_TL)
		var tr := not (n or e) and _corner_touched(mask, diag, c, CUT_TR)
		var bl := not (s or w) and _corner_touched(mask, diag, c, CUT_BL)
		var br := not (s or e) and _corner_touched(mask, diag, c, CUT_BR)
		if tl and br:
			tiles.append(dot_tl_br)
			tl = false
			br = false
		if tr and bl:
			tiles.append(dot_tr_bl)
			tr = false
			bl = false
		if tl:
			tiles.append(dot[CUT_TL])
		if tr:
			tiles.append(dot[CUT_TR])
		if bl:
			tiles.append(dot[CUT_BL])
		if br:
			tiles.append(dot[CUT_BR])
		for atlas in tiles:
			if not cells["Edge"].has(c):
				put("Edge", c, atlas)
			elif not cells["Edge2"].has(c):
				put("Edge2", c, atlas)


func _solid(mask: Dictionary, diag: Dictionary, c: Vector2i) -> bool:
	return mask.has(c) and not diag.has(c)


func _is_other_terrain(family: String, c: Vector2i) -> bool:
	for other: String in _terrain:
		if other != family and terrain_has(other, c):
			return true
	return cells["Bridge"].has(c)


## Apakah medan menyentuh titik sudut `corner` milik sel kosong `c`?
func _corner_touched(mask: Dictionary, diag: Dictionary, c: Vector2i, corner: int) -> bool:
	# Tiga sel lain yang berbagi titik sudut itu, beserta sudut mereka yang berimpit.
	var others: Array
	match corner:
		CUT_TL:
			others = [[c + Vector2i(-1, -1), CUT_BR], [c + UP, CUT_BL], [c + LEFT, CUT_TR]]
		CUT_TR:
			others = [[c + Vector2i(1, -1), CUT_BL], [c + UP, CUT_BR], [c + RIGHT, CUT_TL]]
		CUT_BL:
			others = [[c + Vector2i(-1, 1), CUT_TR], [c + DOWN, CUT_TL], [c + LEFT, CUT_BR]]
		_:
			others = [[c + Vector2i(1, 1), CUT_TL], [c + DOWN, CUT_TR], [c + RIGHT, CUT_BL]]
	for o: Array in others:
		var cell: Vector2i = o[0]
		if diag.has(cell):
			if diag[cell] != o[1]:
				return true
		elif mask.has(cell):
			return true
	return false


## Jembatan / dermaga papan di atas air. Selnya bisa dilewati.
## `vertical` = papan untuk berjalan utara-selatan.
func bridge(x: int, y: int, w: int, h: int, vertical := false) -> void:
	for cy in range(h):
		for cx in range(w):
			var c := Vector2i(x + cx, y + cy)
			put("Bridge", c, Vector2i(40, 12), TRANSPOSE if vertical else 0)
			set_open(c)
			reserved[c] = true


# ---------------------------------------------------------------- tebing

## Tebing menghadap selatan. `edge[x]` = baris terakhir dataran atas di kolom x;
## kolom bertetangga boleh berbeda paling banyak satu baris (jadi lereng 45 derajat).
## Dua baris di bawahnya adalah muka tebing yang tidak bisa dilewati.
func add_cliff(edge: PackedInt32Array) -> void:
	var rot := TRANSPOSE | FLIP_H
	for x in range(width):
		var r := edge[x]
		var down_right := x > 0 and edge[x] == edge[x - 1] + 1
		var up_right := x < width - 1 and edge[x] == edge[x + 1] + 1
		if down_right or up_right:
			put("Cliff", Vector2i(x, r), Vector2i(6, 4) if down_right else Vector2i(7, 4))
			put("Cliff", Vector2i(x, r + 1), Vector2i(10, 4), 0 if down_right else FLIP_H)
			put("Cliff", Vector2i(x, r + 2), Vector2i(10, 6) if down_right else Vector2i(12, 6))
			block(Vector2i(x, r))
		else:
			put("Cliff", Vector2i(x, r), Vector2i(5, 4))
			reserved[Vector2i(x, r)] = true
			for i in [1, 2]:
				if (x + i) % 2 == 0:
					put("Cliff", Vector2i(x, r + i), Vector2i(11, 3))
				else:
					put("Cliff", Vector2i(x, r + i), Vector2i(11, 4), rot)
		block(Vector2i(x, r + 1))
		block(Vector2i(x, r + 2))


## Tangga papan menuruni muka tebing di kolom x..x+w-1 (baris `top`..`top+h-1`).
func stairs(x: int, top: int, w: int, h: int) -> void:
	for cy in range(h):
		for cx in range(w):
			var c := Vector2i(x + cx, top + cy)
			put("Bridge", c, Vector2i(40, 12), TRANSPOSE)
			set_open(c)
			reserved[c] = true


## Lahan kosong tempat rumah kuis berdiri. Hanya dekor tanah yang boleh ada di sini.
func add_site(rect: Rect2i) -> void:
	sites.append(rect)
	reserve_rect(rect.position.x, rect.position.y, rect.size.x, rect.size.y)


func in_site(cell: Vector2i) -> bool:
	for rect in sites:
		if rect.has_point(cell):
			return true
	return false


## Memilih pos soal luar-ruang yang tersebar merata (dipakai kalau lahan rumah habis).
## Panggil setelah validate().
func auto_spots(count: int, min_gap := 5) -> void:
	var candidates: Array[Vector2i] = []
	for c: Vector2i in walkable:
		if in_site(c) or cells["Bridge"].has(c) or cells["Cliff"].has(c):
			continue
		var open := true
		for d: Vector2i in [UP, DOWN, LEFT, RIGHT]:
			if not walkable.has(c + d):
				open = false
		if open:
			candidates.append(c)
	candidates.sort()
	var chosen: Array[Vector2i] = [player_spawn]
	while spots.size() < count and not candidates.is_empty():
		var best := candidates[0]
		var best_dist := -1
		for c in candidates:
			var nearest := 1 << 30
			for o in chosen:
				nearest = mini(nearest, absi(c.x - o.x) + absi(c.y - o.y))
			if nearest > best_dist:
				best_dist = nearest
				best = c
		if best_dist < min_gap:
			break
		chosen.append(best)
		spots.append({"cell": best, "kind": "npc"})


# ---------------------------------------------------------------- hutan

func add_tree(vertex: Vector2i, force := false) -> bool:
	# Batang + tajuk menutup 2x2 sel di sekitar titik, tajuk menjulur satu baris ke atas.
	var base := vertex * 2
	if not force:
		for y in range(base.y - 2, base.y + 1):
			for x in range(base.x - 1, base.x + 1):
				if reserved.has(Vector2i(x, y)):
					return false
	forest[vertex] = true
	return true


func _commit_forest() -> void:
	for v: Vector2i in forest:
		var base := v * 2
		for y in range(base.y - 1, base.y + 1):
			for x in range(base.x - 1, base.x + 1):
				block(Vector2i(x, y))


# ---------------------------------------------------------------- dekor

func deco(cell: Vector2i, atlas: Vector2i, blocking := false, layer := "Deco") -> void:
	put(layer, cell, atlas)
	reserved[cell] = true
	if blocking:
		set_blocked(cell)


## Objek multi-tile. `cell` = pojok kiri atas. `solid_rows` = jumlah baris
## terbawah yang menghalangi jalan (-1 = semua).
func multi(cell: Vector2i, atlas: Vector2i, size: Vector2i, solid_rows := -1, layer := "Deco") -> void:
	for y in range(size.y):
		for x in range(size.x):
			var c := cell + Vector2i(x, y)
			put(layer, c, atlas + Vector2i(x, y))
			reserved[c] = true
			if solid_rows < 0 or y >= size.y - solid_rows:
				block_pixels(c, atlas + Vector2i(x, y))


func area_free(cell: Vector2i, size: Vector2i, margin := 0) -> bool:
	for y in range(-margin, size.y + margin):
		for x in range(-margin, size.x + margin):
			if not is_free(cell + Vector2i(x, y)):
				return false
	return true


func add_sprite(file: String, top_left: Vector2i, hframes: int, solid_cells: Array = [], frame := 0) -> void:
	sprites.append({"file": file, "pos": top_left, "hframes": hframes, "frame": frame})
	for c: Vector2i in solid_cells:
		block(c)


## Sprite yang diposisikan dari titik tengahnya, bisa diskalakan dan dicerminkan.
func add_sprite_centered(file: String, center: Vector2, hframes: int, scale := 1.0, flip := false, frame := 0) -> void:
	sprites.append({
		"file": file, "pos": center, "hframes": hframes, "frame": frame,
		"centered": true, "scale": scale, "flip": flip,
	})


# ---------------------------------------------------------------- katalog bangunan

## Meletakkan bangunan dari katalog (scripts/buildings.gd) dengan pojok kiri atas
## di `dest`. Memberi peringatan bila menimpa jalan, air, atau bangunan lain.
## `overlap_ok` untuk yang memang menimpa medan: rumah panggung di atas air, kios di lapangan.
## `with_mill = false` memasang menara tanpa baling-baling (misalnya mercusuar).
func place(building: String, dest: Vector2i, overlap_ok := false, with_mill := true) -> void:
	if not Buildings.ALL.has(building):
		push_error("Bangunan tidak ada di katalog: " + building)
		return
	var info: Dictionary = Buildings.ALL[building]
	var rect: Rect2i = info.rect
	if not overlap_ok and not area_free(dest, rect.size):
		push_warning("%s di %s menimpa sel yang sudah terpakai" % [building, dest])
	stamp(rect, dest)
	if with_mill and info.has("mill"):
		var mill: Dictionary = info.mill
		add_sprite_centered("windmill.png", Vector2(dest * T) + mill.center, 9, mill.scale, mill.flip)


# ---------------------------------------------------------------- dekorasi umum

## Rumput dasar dengan sedikit variasi.
func fill_ground(variation := 0.07) -> void:
	var variants: Array[Vector2i] = [Vector2i(1, 2), Vector2i(2, 2), Vector2i(3, 2)]
	for y in range(height):
		for x in range(width):
			var atlas := Vector2i(1, 3)
			if rng.randf() < variation:
				atlas = pick(variants)
			put("Ground", Vector2i(x, y), atlas)


## Cincin hutan di tepi peta (tepi dalam tidak rata), lalu tepi peta ditutup.
func forest_ring(clumps: int) -> void:
	var gw := width / 2
	var gh := height / 2
	for j in range(0, gh + 1):
		for i in range(0, gw + 1):
			var edge: int = mini(mini(i, gw - i), mini(j, gh - j))
			if edge <= 1:
				add_tree(Vector2i(i, j))
			elif edge == 2 and rng.randf() < 0.55:
				add_tree(Vector2i(i, j))
	var placed := 0
	var tries := 0
	while placed < clumps and tries < 4000:
		tries += 1
		var origin := Vector2i(rng.randi_range(3, gw - 4), rng.randi_range(3, gh - 4))
		var size := Vector2i(rng.randi_range(1, 2), 1)
		var ok := true
		for y in range(size.y):
			for x in range(size.x):
				var base := (origin + Vector2i(x, y)) * 2
				if not area_free(base + Vector2i(-2, -3), Vector2i(4, 5)):
					ok = false
		if not ok:
			continue
		for y in range(size.y):
			for x in range(size.x):
				add_tree(origin + Vector2i(x, y), true)
				var base := (origin + Vector2i(x, y)) * 2
				reserve_rect(base.x - 2, base.y - 3, 4, 5)
		placed += 1
	seal_border()


func seal_border(thickness := 3) -> void:
	for y in range(height):
		for x in range(width):
			if x < thickness or y < thickness or x >= width - thickness or y >= height - thickness:
				block(Vector2i(x, y))


func random_cell() -> Vector2i:
	return Vector2i(rng.randi_range(3, width - 4), rng.randi_range(3, height - 4))


func scatter_single(count: int, tiles: Array, blocking: bool, layer: String) -> void:
	var placed := 0
	var tries := 0
	while placed < count and tries < count * 40:
		tries += 1
		var c := random_cell()
		# Dekor penghalang diberi jarak supaya tidak menyumbat jalan.
		if not area_free(c, Vector2i.ONE, 1 if blocking else 0):
			continue
		deco(c, pick(tiles), blocking, layer)
		placed += 1


func scatter_multi(count: int, atlas: Vector2i, size: Vector2i, solid_rows: int) -> void:
	var placed := 0
	var tries := 0
	while placed < count and tries < count * 60:
		tries += 1
		var c := random_cell()
		if not area_free(c, size, 1):
			continue
		multi(c, atlas, size, solid_rows)
		placed += 1


## Semak, cemara, batu, bunga, dan rumput dalam takaran `amount` (1.0 = seperti Lembah).
func scatter_nature(amount := 1.0) -> void:
	scatter_multi(roundi(10 * amount), Vector2i(52, 3), Vector2i(1, 3), 2) # cemara kecil
	scatter_multi(roundi(6 * amount), Vector2i(51, 6), Vector2i(2, 3), 2) # cemara besar
	scatter_multi(roundi(5 * amount), Vector2i(49, 1), Vector2i(2, 2), -1) # semak besar
	scatter_multi(roundi(5 * amount), Vector2i(49, 3), Vector2i(2, 2), -1) # semak beri merah
	scatter_multi(roundi(3 * amount), Vector2i(49, 5), Vector2i(2, 2), -1) # semak beri jingga
	scatter_single(roundi(14 * amount), [Vector2i(51, 4)], true, "Deco")
	scatter_single(roundi(5 * amount), [Vector2i(31, 5), Vector2i(32, 5)], true, "Deco")
	scatter_single(roundi(6 * amount), [Vector2i(31, 4)], true, "Deco")
	scatter_single(roundi(150 * amount), [
		Vector2i(31, 1), Vector2i(34, 1), Vector2i(31, 2), Vector2i(34, 2), Vector2i(31, 3),
		Vector2i(34, 3), Vector2i(35, 3), Vector2i(33, 1), Vector2i(33, 2), Vector2i(33, 3),
	], false, "DecoGround")
	scatter_single(roundi(200 * amount), [
		Vector2i(27, 1), Vector2i(28, 1), Vector2i(29, 1), Vector2i(30, 1), Vector2i(27, 2),
		Vector2i(28, 2), Vector2i(29, 2), Vector2i(30, 2), Vector2i(27, 3), Vector2i(28, 3),
		Vector2i(27, 4), Vector2i(28, 4), Vector2i(29, 4), Vector2i(30, 4),
	], false, "DecoGround")
	scatter_single(roundi(18 * amount), [Vector2i(32, 4), Vector2i(33, 4), Vector2i(34, 4)], false, "DecoGround")
	scatter_single(roundi(12 * amount), [Vector2i(49, 7), Vector2i(50, 7), Vector2i(49, 8), Vector2i(50, 8)], false, "DecoGround")


## Pagar mendatar dari x0 sampai x1 (inklusif) di baris `row`.
func fence_row(x0: int, x1: int, row: int) -> void:
	for x in range(x0, x1 + 1):
		var atlas := Vector2i(39, 2) if (x % 2) == 0 else Vector2i(41, 2)
		if x == x0:
			atlas = Vector2i(38, 2)
		elif x == x1:
			atlas = Vector2i(42, 2)
		deco(Vector2i(x, row), atlas, true)


## Petak ladang: gundukan tanah bertanaman, `rows` = daftar baris (beri selang).
func crop_rows(x0: int, count: int, rows: Array) -> void:
	var crops: Array[int] = [51, 52, 53, 55, 56, 57, 58, 59]
	for row: int in rows:
		for i in range(count):
			var c := Vector2i(x0 + i, row)
			deco(c, Vector2i(50, 12), false, "DecoGround")
			deco(c, Vector2i(crops[(i + row) % crops.size()], 17), true)


func add_spot(cell: Vector2i, kind: String) -> void:
	spots.append({"cell": cell, "kind": kind})
	for y in range(-1, 2):
		for x in range(-1, 2):
			reserved[cell + Vector2i(x, y)] = true


# ---------------------------------------------------------------- stamp

func _load_room() -> void:
	var path := ProjectSettings.globalize_path("res://").path_join(PACK_ROOM).simplify_path()
	var text := FileAccess.get_file_as_string(path)
	if text.is_empty():
		push_error("Room1.yy tidak ditemukan: " + path)
		return
	# File .yy GameMaker memakai koma di akhir daftar; buang dulu supaya jadi JSON sah.
	var re := RegEx.create_from_string(",(\\s*[}\\]])")
	var data: Dictionary = JSON.parse_string(re.sub(text, "$1", true))
	for layer: Dictionary in data["layers"]:
		if layer["resourceType"] != "GMRTileLayer":
			continue
		var tiles: Dictionary = layer["tiles"]
		var out := PackedInt64Array()
		if tiles.has("TileSerialiseData"):
			for v in tiles["TileSerialiseData"]:
				out.append(int(v))
		else:
			var packed: Array = tiles["TileCompressedData"]
			var i := 0
			while i < packed.size():
				var n := int(packed[i])
				i += 1
				if n < 0:
					var v := int(packed[i])
					i += 1
					for k in range(-n):
						out.append(v)
				else:
					for k in range(n):
						out.append(int(packed[i + k]))
					i += n
		_room[layer["name"]] = {"w": int(tiles["SerialiseWidth"]), "data": out}


func _tile_invisible(atlas: Vector2i) -> bool:
	if not _invisible.has(atlas):
		_invisible[atlas] = _sheet.get_region(Rect2i(atlas * T, Vector2i(T, T))).is_invisible()
	return _invisible[atlas]


static func _is_plant_tile(a: Vector2i) -> bool:
	return (a.x >= 48 and a.y <= 8) or (a.x >= 50 and a.y >= 10 and a.y <= 17) or (a.x >= 50 and a.y >= 32 and a.y <= 33)


## Menyalin bangunan dari contoh room paket. `src` dalam koordinat tile room.
func stamp(src: Rect2i, dest: Vector2i) -> void:
	for gm: String in STAMP_LAYERS:
		var layer: Dictionary = _room[gm]
		var data: PackedInt64Array = layer.data
		for y in range(src.size.y):
			for x in range(src.size.x):
				var index: int = (src.position.y + y) * layer.w + src.position.x + x
				var v: int = data[index] & 0xFFFFFFFF
				var tile := v & 0x7FFFF
				if tile == 0:
					continue
				var atlas := Vector2i(tile % 64, tile / 64)
				if _is_plant_tile(atlas) or _tile_invisible(atlas):
					continue
				# GameMaker: putar 90 derajat searah jarum jam, lalu cermin, lalu balik.
				var rotate := (v >> 30) & 1
				var mirror := (v >> 28) & 1
				var flip := (v >> 29) & 1
				var alt := 0
				if rotate == 1:
					alt |= TRANSPOSE
				if rotate != mirror:
					alt |= FLIP_H
				if flip == 1:
					alt |= FLIP_V
				var c := dest + Vector2i(x, y)
				put(STAMP_LAYERS[gm], c, atlas, alt)
				if gm != "shadows":
					block_pixels(c, atlas, alt)
	reserve_rect(dest.x, dest.y, src.size.x, src.size.y)


## Membuang tile dekor (bukan dinding) di `rect`, misalnya potongan benda
## tetangga yang ikut tersalin oleh stamp.
func clear_deco(rect: Rect2i) -> void:
	for y in range(rect.position.y, rect.end.y):
		for x in range(rect.position.x, rect.end.x):
			var c := Vector2i(x, y)
			cells["Deco"].erase(c)
			cells["DecoTop"].erase(c)
			if not cells["Building"].has(c) and not cells["Walls"].has(c):
				set_open(c)


# ---------------------------------------------------------------- hasil

## Menutup kantong yang tidak terjangkau dari titik mulai, lalu melaporkan pos
## soal yang bermasalah. Mengembalikan jumlah masalah.
func validate() -> int:
	_commit_forest()
	for x in range(width):
		set_blocked(Vector2i(x, 0))
		set_blocked(Vector2i(x, height - 1))
	for y in range(height):
		set_blocked(Vector2i(0, y))
		set_blocked(Vector2i(width - 1, y))

	var problems := 0
	if blocked.has(player_spawn):
		push_error("Titik mulai pemain ada di sel terhalang: %s" % player_spawn)
		return 1
	var seen := {player_spawn: true}
	var queue: Array[Vector2i] = [player_spawn]
	while not queue.is_empty():
		var c: Vector2i = queue.pop_back()
		for d: Vector2i in [UP, DOWN, LEFT, RIGHT]:
			var n := c + d
			if n.x < 0 or n.y < 0 or n.x >= width or n.y >= height:
				continue
			if blocked.has(n) or seen.has(n):
				continue
			seen[n] = true
			queue.append(n)
	var pockets := 0
	for y in range(height):
		for x in range(width):
			var c := Vector2i(x, y)
			if not blocked.has(c) and not seen.has(c):
				set_blocked(c)
				pockets += 1
	walkable = seen
	for spot: Dictionary in spots:
		if not seen.has(spot.cell):
			push_error("Pos soal tidak terjangkau: %s" % spot.cell)
			problems += 1
	print("sel bisa dilewati: %d, kantong ditutup: %d, pos soal: %d" % [seen.size(), pockets, spots.size()])
	return problems


func ascii() -> String:
	var marks := {}
	for i in range(spots.size()):
		marks[spots[i].cell] = "abcdefghijklmnopqrstuvwxyz"[i % 26]
	marks[player_spawn] = "@"
	var out := ""
	for y in range(height):
		for x in range(width):
			var c := Vector2i(x, y)
			out += marks.get(c, "#" if blocked.has(c) else ".")
		out += "\n"
	return out


static func _make_tileset(texture_path: String, tile_size: int, save_path: String) -> TileSet:
	if ResourceLoader.exists(save_path):
		return load(save_path)
	var image := Image.load_from_file(ProjectSettings.globalize_path(texture_path))
	var source := TileSetAtlasSource.new()
	source.texture = load(texture_path)
	source.texture_region_size = Vector2i(tile_size, tile_size)
	for y in range(image.get_height() / tile_size):
		for x in range(image.get_width() / tile_size):
			var region := Rect2i(x * tile_size, y * tile_size, tile_size, tile_size)
			if not image.get_region(region).is_invisible():
				source.create_tile(Vector2i(x, y))
	var tileset := TileSet.new()
	tileset.tile_size = Vector2i(tile_size, tile_size)
	tileset.add_source(source, 0)
	ResourceSaver.save(tileset, save_path)
	return load(save_path)


## Menyusun pohon node peta (TileMapLayer, sprite, penanda).
func make_node(root_name: String, meta: Dictionary = {}) -> Node2D:
	var ts16 := _make_tileset(VENDOR + "tiles16.png", 16, "res://tilesets/sunnyside16.tres")
	var ts32 := _make_tileset(VENDOR + "forest32.png", 32, "res://tilesets/sunnyside_forest32.tres")
	var ts_col := _make_tileset("res://tilesets/collision_tile.png", 16, "res://tilesets/collision.tres")

	var root := Node2D.new()
	root.name = root_name
	root.set_meta("width_tiles", width)
	root.set_meta("height_tiles", height)
	for key: String in meta:
		root.set_meta(key, meta[key])

	for layer_name in LAYERS:
		var layer := TileMapLayer.new()
		layer.name = layer_name
		layer.tile_set = ts16
		root.add_child(layer)
		var data: Dictionary = cells[layer_name]
		for c: Vector2i in data:
			layer.set_cell(c, 0, data[c][0], data[c][1])

	var forest_layer := TileMapLayer.new()
	forest_layer.name = "Forest"
	forest_layer.tile_set = ts32
	root.add_child(forest_layer)
	for y in range(-1, height / 2 + 1):
		for x in range(-1, width / 2 + 1):
			var bits := 0
			if forest.has(Vector2i(x, y)):
				bits |= 8
			if forest.has(Vector2i(x + 1, y)):
				bits |= 4
			if forest.has(Vector2i(x, y + 1)):
				bits |= 2
			if forest.has(Vector2i(x + 1, y + 1)):
				bits |= 1
			if bits == 15:
				forest_layer.set_cell(Vector2i(x, y), 0, pick(FOREST_FULL))
			elif bits != 0:
				forest_layer.set_cell(Vector2i(x, y), 0, FOREST[bits])

	var sprite_root := Node2D.new()
	sprite_root.name = "Sprites"
	root.add_child(sprite_root)
	for i in range(sprites.size()):
		var info: Dictionary = sprites[i]
		var sprite := Sprite2D.new()
		sprite.name = "%s_%02d" % [String(info.file).get_basename().capitalize().replace(" ", ""), i + 1]
		sprite.texture = load(VENDOR + info.file)
		sprite.hframes = info.hframes
		sprite.frame = info.frame
		sprite.centered = info.get("centered", false)
		sprite.position = Vector2(info.pos)
		var s: float = info.get("scale", 1.0)
		sprite.scale = Vector2(s, s)
		sprite.flip_h = info.get("flip", false)
		sprite_root.add_child(sprite)

	var collision := TileMapLayer.new()
	collision.name = "Collision"
	collision.tile_set = ts_col
	collision.visible = false
	root.add_child(collision)
	for c: Vector2i in blocked:
		if c.x >= 0 and c.y >= 0 and c.x < width and c.y < height:
			collision.set_cell(c, 0, Vector2i.ZERO)

	# Grid tabrakan setengah tile, disimpan sebagai meta karena TileMapLayer hanya 16 px.
	# Sel 16 px yang terhalang tanpa satu pun sel kecil (mis. dari sumber lain) ditutup penuh.
	var fine_rows := PackedStringArray()
	for fy in range(height * 2):
		var row := ""
		for fx in range(width * 2):
			var f := Vector2i(fx, fy)
			var tile := Vector2i(fx / 2, fy / 2)
			var solid := fine.has(f)
			if not solid and blocked.has(tile):
				solid = not (fine.has(tile * 2) or fine.has(tile * 2 + Vector2i(1, 0)) \
					or fine.has(tile * 2 + Vector2i(0, 1)) or fine.has(tile * 2 + Vector2i(1, 1)))
			row += "#" if solid else "."
		fine_rows.append(row)
	root.set_meta("collision_fine", fine_rows)

	var spot_root := Node2D.new()
	spot_root.name = "QuizSpots"
	root.add_child(spot_root)
	for i in range(spots.size()):
		var marker := Marker2D.new()
		marker.name = "sp-%d" % (i + 1)
		marker.position = Vector2(spots[i].cell * T) + Vector2(T / 2.0, T / 2.0)
		marker.set_meta("kind", spots[i].kind)
		spot_root.add_child(marker)

	var site_root := Node2D.new()
	site_root.name = "BuildSites"
	root.add_child(site_root)
	for i in range(sites.size()):
		var marker := Marker2D.new()
		marker.name = "lahan-%d" % (i + 1)
		marker.position = Vector2(sites[i].position * T)
		marker.set_meta("size", sites[i].size)
		site_root.add_child(marker)

	var spawn := Marker2D.new()
	spawn.name = "PlayerSpawn"
	spawn.position = Vector2(player_spawn * T) + Vector2(T / 2.0, T / 2.0)
	root.add_child(spawn)

	_own(root, root)
	return root


## Menyusun scene dan menyimpannya ke `scene_path`.
func save_scene(scene_path: String, root_name: String, meta: Dictionary) -> Error:
	var root := make_node(root_name, meta)
	var packed := PackedScene.new()
	var err := packed.pack(root)
	if err == OK:
		err = ResourceSaver.save(packed, scene_path)
	root.free()
	return err


static func _own(node: Node, owner: Node) -> void:
	for child in node.get_children():
		child.owner = owner
		_own(child, owner)
