import type { AvatarColorway, MapTemplate, QuizDefinition } from './types'

export const AVATAR_COLORWAYS: Array<{
	id: AvatarColorway
	label: string
	spriteUrl: string
	primaryHex: string
	secondaryHex: string
}> = [
	{
		id: 'merah-putih',
		label: 'Trainer Red (FireRed)',
		spriteUrl: '/gba/sprites/red.png',
		primaryHex: '#dc2626',
		secondaryHex: '#f8fafc'
	},
	{
		id: 'hijau-rimba',
		label: 'Trainer Leaf (LeafGreen)',
		spriteUrl: '/gba/sprites/leaf.png',
		primaryHex: '#15803d',
		secondaryHex: '#bbf7d0'
	},
	{
		id: 'batik-biru',
		label: 'Youngster Joey (GBA)',
		spriteUrl: '/gba/sprites/youngster.png',
		primaryHex: '#1d4ed8',
		secondaryHex: '#93c5fd'
	},
	{
		id: 'ungu-senja',
		label: 'Lass Haley (Emerald)',
		spriteUrl: '/gba/sprites/lass.png',
		primaryHex: '#7e22ce',
		secondaryHex: '#e9d5ff'
	},
	{
		id: 'pramuka',
		label: 'Bug Catcher (Emerald)',
		spriteUrl: '/gba/sprites/bug_catcher.png',
		primaryHex: '#92400e',
		secondaryHex: '#fde68a'
	},
	{
		id: 'kuning-emas',
		label: 'School Kid (Hoenn)',
		spriteUrl: '/gba/sprites/school_kid_m.png',
		primaryHex: '#ca8a04',
		secondaryHex: '#fef08a'
	},
	{
		id: 'toska-laut',
		label: 'Champion Steven (GBA)',
		spriteUrl: '/gba/sprites/steven.png',
		primaryHex: '#0f766e',
		secondaryHex: '#99f6e4'
	},
	{
		id: 'oranye-bata',
		label: 'Rich Boy Winston (GBA)',
		spriteUrl: '/gba/sprites/rich_boy.png',
		primaryHex: '#c2410c',
		secondaryHex: '#fed7aa'
	}
]

export const INDONESIAN_SUBJECTS = [
	'Matematika',
	'Bahasa Indonesia',
	'IPA (Sains)',
	'IPS & Sosiologi',
	'Bahasa Inggris',
	'Informatika / TIK',
	'Pendidikan Pancasila (PPKn)',
	'Sejarah',
	'Seni & Budaya',
	'PJOK (Olahraga)',
	'Pendidikan Agama',
	'Lainnya'
] as const

export const SCHOOL_LEVEL_OPTIONS = [
	{ id: 'sd', label: 'SD / MI', grades: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'] },
	{ id: 'smp', label: 'SMP / MTs', grades: ['Kelas 7', 'Kelas 8', 'Kelas 9'] },
	{ id: 'sma', label: 'SMA / SMK / MA', grades: ['Kelas 10', 'Kelas 11', 'Kelas 12'] },
	{ id: 'tk', label: 'TK / PAUD', grades: ['TK A', 'TK B'] },
	{ id: 'kuliah', label: 'Perguruan Tinggi', grades: ['Semester 1-2', 'Semester 3-4', 'Semester 5+'] },
	{ id: 'lainnya', label: 'Umum / Lainnya', grades: ['Semua Tingkat'] }
] as const

export const MAP_CATALOG: MapTemplate[] = [
	{
		id: 'map-halaman-sekolah',
		slug: 'hoenn-mega-region',
		name: 'Region Hoenn Terpadu · 4 Kota & Rute (GBA Open World)',
		description:
			'Peta dunia terbuka raksasa (60x50 tile / 2880x2400 px) yang menghubungkan 4 kota dan rute petualangan sekaligus: Kota Kuis Petalburg, Distrik Akademi Batu Rustboro, Desa Taman Oldale, dan Desa Riset Littleroot.',
		defaultMode: 'free',
		mapImageUrl: '/gba/maps/hoenn-mega-region.png',
		widthTiles: 60,
		heightTiles: 50,
		tileSizePx: 16,
		renderScale: 3,
		palette: {
			floorPrimary: '#78c8a0',
			floorSecondary: '#68b890',
			wallPrimary: '#d84038',
			wallAccent: '#3878d8',
			accentColor: '#eab308'
		},
		playerSpawn: { tileX: 15, tileY: 13 },
		collisionRows: [
			'############################################################',
			'############################################################',
			'###################...######################################',
			'############################################################',
			'############################################....############',
			'####.###################################............########',
			'####......##############################.........###########',
			'####......############################..####.....####.######',
			'####.....#############################..####.....####.######',
			'####....####......#.....##############..####.....####.######',
			'##...............#......##############..####..........######',
			'##......................####...........................#####',
			'#.......................####...................#.......#####',
			'##.................####................................#####',
			'#########..........####...............................######',
			'#########..........####...............................######',
			'#############....#.####..................####.....##########',
			'#############............................####.....##########',
			'#############.........................##.####.....##########',
			'#############.............##..........##.####.....##########',
			'#######...........##########..........##............########',
			'#######...........######################............########',
			'#######...........#########################......###########',
			'##############....#########################......###########',
			'##############.....####..##################......###########',
			'##############...........##################......###########',
			'##############...........##################......###########',
			'############........#######################......###########',
			'##...######.........#######################......###########',
			'############........##################................######',
			'#....#######........##################................######',
			'#......#####........#################.#####......#####.#####',
			'############........#################.#####......#####.#####',
			'############............#.....#######.#####......#####.#####',
			'############..................#######.#####......#####.#####',
			'############..........................######....######.#####',
			'############...........................................#####',
			'############...........................................#####',
			'############......############.........................#####',
			'############......#....................#######.........#####',
			'#...#..#...#......######...............#######.....#...#####',
			'#..........#.#..#.######.#####.........#######.........#####',
			'#..........#......######.#####.........#######........######',
			'#.#......#.#......######.#####.........#######........######',
			'#.........##.....#######.#####............#.........########',
			'#..#....#..#.............#####......................########',
			'#.....................................######################',
			'#.....................####............######################',
			'############..........#####...........######################',
			'############################################################'
		],
		obstacles: [
			{ tileX: 5, tileY: 2, width: 5, height: 4, label: 'Rumah Barat Utara (Petalburg)' },
			{ tileX: 12, tileY: 4, width: 6, height: 5, label: 'Aula Utama Kuis (Petalburg)' },
			{ tileX: 19, tileY: 13, width: 4, height: 4, label: 'Rumah Tengah (Petalburg)' },
			{ tileX: 24, tileY: 9, width: 4, height: 4, label: 'Pondok Timur (Petalburg)' },
			{ tileX: 9, tileY: 16, width: 4, height: 4, label: 'Rumah Barat Selatan (Petalburg)' },
			{ tileX: 19, tileY: 21, width: 4, height: 4, label: 'Rumah Tenggara (Petalburg)' },
			{ tileX: 1, tileY: 32, width: 10, height: 8, label: 'Gedung Akademi Devon (Rustboro)' },
			{ tileX: 18, tileY: 40, width: 6, height: 5, label: 'Aula Batu Selatan (Rustboro)' },
			{ tileX: 25, tileY: 41, width: 5, height: 5, label: 'Gedung Riset Timur (Rustboro)' },
			{ tileX: 40, tileY: 7, width: 4, height: 4, label: 'Pondok Oldale Barat' },
			{ tileX: 49, tileY: 6, width: 4, height: 4, label: 'Rumah Oldale Timur' },
			{ tileX: 41, tileY: 16, width: 4, height: 4, label: 'Pondok Taman Oldale' },
			{ tileX: 50, tileY: 16, width: 4, height: 4, label: 'Pondok Persimpangan' },
			{ tileX: 38, tileY: 31, width: 5, height: 5, label: 'Rumah Littleroot Barat' },
			{ tileX: 49, tileY: 31, width: 5, height: 5, label: 'Rumah Littleroot Timur' },
			{ tileX: 39, tileY: 39, width: 7, height: 5, label: 'Laboratorium Riset Prof. Birch' }
		],
		spawnPoints: [
			{ id: 'sp-1', tileX: 7, tileY: 8, objectKind: 'chest' },
			{ id: 'sp-2', tileX: 15, tileY: 10, objectKind: 'npc' },
			{ id: 'sp-3', tileX: 12, tileY: 12, objectKind: 'board' },
			{ id: 'sp-4', tileX: 25, tileY: 14, objectKind: 'chest' },
			{ id: 'sp-5', tileX: 16, tileY: 20, objectKind: 'chest' },
			{ id: 'sp-6', tileX: 11, tileY: 21, objectKind: 'chest' },
			{ id: 'sp-7', tileX: 32, tileY: 15, objectKind: 'crystal' },
			{ id: 'sp-8', tileX: 42, tileY: 12, objectKind: 'chest' },
			{ id: 'sp-9', tileX: 46, tileY: 8, objectKind: 'npc' },
			{ id: 'sp-10', tileX: 51, tileY: 11, objectKind: 'chest' },
			{ id: 'sp-11', tileX: 46, tileY: 17, objectKind: 'board' },
			{ id: 'sp-12', tileX: 51, tileY: 20, objectKind: 'chest' },
			{ id: 'sp-13', tileX: 45, tileY: 25, objectKind: 'chest' },
			{ id: 'sp-14', tileX: 41, tileY: 37, objectKind: 'chest' },
			{ id: 'sp-15', tileX: 46, tileY: 33, objectKind: 'npc' },
			{ id: 'sp-16', tileX: 51, tileY: 37, objectKind: 'chest' },
			{ id: 'sp-17', tileX: 47, tileY: 43, objectKind: 'board' },
			{ id: 'sp-18', tileX: 51, tileY: 41, objectKind: 'crystal' },
			{ id: 'sp-19', tileX: 32, tileY: 41, objectKind: 'chest' },
			{ id: 'sp-20', tileX: 15, tileY: 29, objectKind: 'chest' },
			{ id: 'sp-21', tileX: 15, tileY: 36, objectKind: 'npc' },
			{ id: 'sp-22', tileX: 8, tileY: 42, objectKind: 'board' },
			{ id: 'sp-23', tileX: 21, tileY: 36, objectKind: 'chest' },
			{ id: 'sp-24', tileX: 21, tileY: 46, objectKind: 'crystal' }
		],
		maxPlayers: 200
	},
	{
		id: 'map-desa-sunnyside',
		slug: 'sunnyside-mega-valley',
		name: 'Lembah Raya Sunnyside & Farm RPG (ZEP Open Village)',
		description:
			'Peta lembah pedesaan luas (56x44 tile / 2688x2112 px) dari paket aset Farm RPG 16x16 & Sunnyside World yang menghubungkan 4 kawasan: Alun-Alun Desa, Lembah Pertanian, Hutan Maple, dan Dermaga Danau Kembar.',
		defaultMode: 'free',
		mapImageUrl: '/gba/maps/sunnyside-mega-valley.png',
		widthTiles: 56,
		heightTiles: 44,
		tileSizePx: 16,
		renderScale: 3,
		palette: {
			floorPrimary: '#74c04c',
			floorSecondary: '#6eb848',
			wallPrimary: '#b84a28',
			wallAccent: '#2868b8',
			accentColor: '#facc15'
		},
		playerSpawn: { tileX: 19, tileY: 10 },
		collisionRows: [
			'########################################################',
			'########################################################',
			'##....................................................##',
			'##....................................................##',
			'##.#####....#####.....#####...#####.....#####....#######',
			'##.#####....#####.....#####...#####.....#####....#######',
			'##.#####....#####.....#####...#####.....#####....#######',
			'##.#####....#####.....#####...#####.....#####....#######',
			'##.#####....#####.....#####...#####.....#####....#######',
			'##....................................................##',
			'##....................................................##',
			'##....................................................##',
			'##....................................................##',
			'##....................................................##',
			'##.#####....#####.............#####...................##',
			'##.#####....#####.............#####...................##',
			'##.#####....#####.............#####...................##',
			'##.#####....#####.............#####...................##',
			'##.#####....#####.............#####...................##',
			'##....................................................##',
			'##....................................................##',
			'##....................................................##',
			'##....................................................##',
			'##....................................................##',
			'##.........######......................######....####.##',
			'##.#####...######......................######....####.##',
			'##.#####...######......................######....####.##',
			'##.#####...######......................######....####.##',
			'##.#####...######......................######....####.##',
			'##.#####...######......................######....####.##',
			'##.........######......................######....####.##',
			'##.....................................######....####.##',
			'##....................................................##',
			'##....................................................##',
			'##....................................................##',
			'##....................................................##',
			'##..........#####.............#####.....#####.........##',
			'##..........#####.............#####.....#####.........##',
			'##..........#####.............#####.....#####.........##',
			'##..........#####.............#####.....#####.........##',
			'##..........#####.............#####.....#####.........##',
			'##....................................................##',
			'########################################################',
			'########################################################'
		],
		obstacles: [
			{ tileX: 3, tileY: 4, width: 5, height: 5, label: 'Pondok Barat Laut' },
			{ tileX: 12, tileY: 4, width: 5, height: 5, label: 'Pondok Pustaka Biru' },
			{ tileX: 22, tileY: 4, width: 5, height: 5, label: 'Balai Desa Sunnyside' },
			{ tileX: 30, tileY: 4, width: 5, height: 5, label: 'Pondok Bukit Utara' },
			{ tileX: 40, tileY: 4, width: 5, height: 5, label: 'Pondok Menara Biru' },
			{ tileX: 49, tileY: 4, width: 5, height: 5, label: 'Pondok Timur Laut' },
			{ tileX: 3, tileY: 14, width: 5, height: 5, label: 'Pondok Kebun Barat' },
			{ tileX: 12, tileY: 14, width: 5, height: 5, label: 'Pondok Tengah' },
			{ tileX: 30, tileY: 14, width: 5, height: 5, label: 'Lumbung Panen' },
			{ tileX: 3, tileY: 25, width: 5, height: 5, label: 'Pondok Hutan Selatan' },
			{ tileX: 12, tileY: 36, width: 5, height: 5, label: 'Pondok Lembah Selatan' },
			{ tileX: 30, tileY: 36, width: 5, height: 5, label: 'Pondok Dermaga Danau' },
			{ tileX: 40, tileY: 36, width: 5, height: 5, label: 'Balai Belajar Danau' }
		],
		spawnPoints: [
			{ id: 'sp-1', tileX: 8, tileY: 10, objectKind: 'chest' },
			{ id: 'sp-2', tileX: 15, tileY: 10, objectKind: 'npc' },
			{ id: 'sp-3', tileX: 24, tileY: 10, objectKind: 'board' },
			{ id: 'sp-4', tileX: 8, tileY: 16, objectKind: 'chest' },
			{ id: 'sp-5', tileX: 19, tileY: 16, objectKind: 'chest' },
			{ id: 'sp-6', tileX: 8, tileY: 21, objectKind: 'crystal' },
			{ id: 'sp-7', tileX: 32, tileY: 10, objectKind: 'chest' },
			{ id: 'sp-8', tileX: 42, tileY: 10, objectKind: 'npc' },
			{ id: 'sp-9', tileX: 50, tileY: 10, objectKind: 'chest' },
			{ id: 'sp-10', tileX: 36, tileY: 16, objectKind: 'board' },
			{ id: 'sp-11', tileX: 46, tileY: 16, objectKind: 'chest' },
			{ id: 'sp-12', tileX: 46, tileY: 21, objectKind: 'crystal' },
			{ id: 'sp-13', tileX: 8, tileY: 28, objectKind: 'chest' },
			{ id: 'sp-14', tileX: 19, tileY: 28, objectKind: 'npc' },
			{ id: 'sp-15', tileX: 27, tileY: 28, objectKind: 'chest' },
			{ id: 'sp-16', tileX: 8, tileY: 34, objectKind: 'board' },
			{ id: 'sp-17', tileX: 19, tileY: 34, objectKind: 'chest' },
			{ id: 'sp-18', tileX: 27, tileY: 38, objectKind: 'chest' },
			{ id: 'sp-19', tileX: 36, tileY: 28, objectKind: 'chest' },
			{ id: 'sp-20', tileX: 46, tileY: 28, objectKind: 'npc' },
			{ id: 'sp-21', tileX: 36, tileY: 34, objectKind: 'board' },
			{ id: 'sp-22', tileX: 46, tileY: 34, objectKind: 'crystal' },
			{ id: 'sp-23', tileX: 33, tileY: 41, objectKind: 'chest' },
			{ id: 'sp-24', tileX: 43, tileY: 41, objectKind: 'chest' }
		],
		maxPlayers: 200
	},
	{
		id: 'map-kampus-modern',
		slug: 'modern-campus-complex',
		name: 'Kompleks Kampus & Perpustakaan Modern (Indoor 16x16)',
		description:
			'Denah kampus sekolah luas (48x36 tile / 2304x1728 px) dari paket Modern Tiles 16x16 yang menghubungkan 4 sayap gedung: Ruang Kelas Utama, Perpustakaan Raya, Laboratorium Sains, dan Aula Diskusi.',
		defaultMode: 'linear',
		mapImageUrl: '/gba/maps/modern-campus-complex.png',
		widthTiles: 48,
		heightTiles: 36,
		tileSizePx: 16,
		renderScale: 3,
		palette: {
			floorPrimary: '#d8b484',
			floorSecondary: '#c4a070',
			wallPrimary: '#485468',
			wallAccent: '#768498',
			accentColor: '#38bdf8'
		},
		playerSpawn: { tileX: 23, tileY: 17 },
		collisionRows: [
			'################################################',
			'################################################',
			'##....##.....##.....##....##.##.##.##.##.##...##',
			'##.......###........##....##.##.##.##.##.##.#.##',
			'##.......###........#......#................#.##',
			'##..................#......#..................##',
			'##..##...##...##....#......#.##..........##...##',
			'##..##...##...##....#......#.##..........##...##',
			'##............................................##',
			'##............................................##',
			'##..##...##...##....#......#.##..........##...##',
			'##..##...##...##....#......#.##..........##...##',
			'##..................#......#..................##',
			'##..................#......#..................##',
			'##########...########......########...##########',
			'#..............................................#',
			'#..............................................#',
			'#..............................................#',
			'#..............................................#',
			'#..............................................#',
			'#..............................................#',
			'##########...########......########...##########',
			'##...##........##...#......#..................##',
			'##..................#......#.......###........##',
			'##..................#......#.......###........##',
			'##..##...##...##....#......#..................##',
			'##..##...##...##....#......#..................##',
			'##............................................##',
			'##............................................##',
			'##..##...##...##....#......#..................##',
			'##..##...##...##....#......#..##....##....##..##',
			'##..................#......#..##....##....##..##',
			'##..................##....##..................##',
			'##..................##....##..................##',
			'#####################......#####################',
			'################################################'
		],
		obstacles: [
			{ tileX: 6, tileY: 1, width: 2, height: 2, label: 'Papan Tulis Utama' },
			{ tileX: 13, tileY: 1, width: 2, height: 2, label: 'Papan Rumus' },
			{ tileX: 9, tileY: 3, width: 3, height: 2, label: 'Meja Guru' },
			{ tileX: 4, tileY: 6, width: 2, height: 2, label: 'Meja Siswa' },
			{ tileX: 4, tileY: 10, width: 2, height: 2, label: 'Meja Siswa' },
			{ tileX: 9, tileY: 6, width: 2, height: 2, label: 'Meja Siswa' },
			{ tileX: 9, tileY: 10, width: 2, height: 2, label: 'Meja Siswa' },
			{ tileX: 14, tileY: 6, width: 2, height: 2, label: 'Meja Siswa' },
			{ tileX: 14, tileY: 10, width: 2, height: 2, label: 'Meja Siswa' },
			{ tileX: 29, tileY: 2, width: 2, height: 2, label: 'Rak Perpustakaan Utara' },
			{ tileX: 32, tileY: 2, width: 2, height: 2, label: 'Rak Perpustakaan Utara' },
			{ tileX: 35, tileY: 2, width: 2, height: 2, label: 'Rak Perpustakaan Utara' },
			{ tileX: 38, tileY: 2, width: 2, height: 2, label: 'Rak Perpustakaan Utara' },
			{ tileX: 41, tileY: 2, width: 2, height: 2, label: 'Rak Perpustakaan Utara' },
			{ tileX: 29, tileY: 6, width: 2, height: 2, label: 'Rak Buku Sains' },
			{ tileX: 29, tileY: 10, width: 2, height: 2, label: 'Rak Ensiklopedia' },
			{ tileX: 41, tileY: 6, width: 2, height: 2, label: 'Rak Buku Sains' },
			{ tileX: 41, tileY: 10, width: 2, height: 2, label: 'Rak Ensiklopedia' },
			{ tileX: 44, tileY: 3, width: 1, height: 2, label: 'Bola Dunia' },
			{ tileX: 5, tileY: 21, width: 2, height: 2, label: 'Tabel Periodik' },
			{ tileX: 15, tileY: 21, width: 2, height: 2, label: 'Poster Biologi' },
			{ tileX: 4, tileY: 25, width: 2, height: 2, label: 'Meja Praktikum' },
			{ tileX: 4, tileY: 29, width: 2, height: 2, label: 'Meja Praktikum' },
			{ tileX: 9, tileY: 25, width: 2, height: 2, label: 'Meja Praktikum' },
			{ tileX: 9, tileY: 29, width: 2, height: 2, label: 'Meja Praktikum' },
			{ tileX: 14, tileY: 25, width: 2, height: 2, label: 'Meja Praktikum' },
			{ tileX: 14, tileY: 29, width: 2, height: 2, label: 'Meja Praktikum' },
			{ tileX: 35, tileY: 23, width: 3, height: 2, label: 'Podium Diskusi' },
			{ tileX: 30, tileY: 30, width: 2, height: 2, label: 'Meja Kelompok' },
			{ tileX: 36, tileY: 30, width: 2, height: 2, label: 'Meja Kelompok' },
			{ tileX: 42, tileY: 30, width: 2, height: 2, label: 'Meja Kelompok' },
			{ tileX: 21, tileY: 2, width: 1, height: 2, label: 'Tanaman Kampus' },
			{ tileX: 26, tileY: 2, width: 1, height: 2, label: 'Tanaman Kampus' },
			{ tileX: 21, tileY: 32, width: 1, height: 2, label: 'Tanaman Kampus' },
			{ tileX: 26, tileY: 32, width: 1, height: 2, label: 'Tanaman Kampus' }
		],
		spawnPoints: [
			{ id: 'sp-1', tileX: 7, tileY: 4, objectKind: 'npc' },
			{ id: 'sp-2', tileX: 14, tileY: 4, objectKind: 'board' },
			{ id: 'sp-3', tileX: 7, tileY: 8, objectKind: 'chest' },
			{ id: 'sp-4', tileX: 12, tileY: 8, objectKind: 'chest' },
			{ id: 'sp-5', tileX: 7, tileY: 12, objectKind: 'chest' },
			{ id: 'sp-6', tileX: 16, tileY: 12, objectKind: 'crystal' },
			{ id: 'sp-7', tileX: 31, tileY: 5, objectKind: 'chest' },
			{ id: 'sp-8', tileX: 37, tileY: 5, objectKind: 'npc' },
			{ id: 'sp-9', tileX: 43, tileY: 5, objectKind: 'board' },
			{ id: 'sp-10', tileX: 34, tileY: 9, objectKind: 'chest' },
			{ id: 'sp-11', tileX: 39, tileY: 9, objectKind: 'crystal' },
			{ id: 'sp-12', tileX: 36, tileY: 12, objectKind: 'chest' },
			{ id: 'sp-13', tileX: 23, tileY: 8, objectKind: 'chest' },
			{ id: 'sp-14', tileX: 23, tileY: 27, objectKind: 'chest' },
			{ id: 'sp-15', tileX: 11, tileY: 17, objectKind: 'board' },
			{ id: 'sp-16', tileX: 36, tileY: 17, objectKind: 'board' },
			{ id: 'sp-17', tileX: 7, tileY: 23, objectKind: 'npc' },
			{ id: 'sp-18', tileX: 14, tileY: 23, objectKind: 'chest' },
			{ id: 'sp-19', tileX: 7, tileY: 27, objectKind: 'chest' },
			{ id: 'sp-20', tileX: 12, tileY: 27, objectKind: 'crystal' },
			{ id: 'sp-21', tileX: 33, tileY: 24, objectKind: 'npc' },
			{ id: 'sp-22', tileX: 40, tileY: 24, objectKind: 'chest' },
			{ id: 'sp-23', tileX: 34, tileY: 28, objectKind: 'chest' },
			{ id: 'sp-24', tileX: 39, tileY: 32, objectKind: 'crystal' }
		],
		maxPlayers: 200
	}
]

export const STARTER_QUIZZES: QuizDefinition[] = [
	{
		id: 'quiz-demo-nusantara',
		ownerName: 'Ibu Ratna (SDN 01 Menteng)',
		title: 'Eksplorasi Alam & Geografi Indonesia',
		description:
			'Kuis petualangan mengenal pulau, flora, fauna, dan fenomena alam kepulauan Indonesia di peta Pallet Town GBA.',
		schoolLevel: 'sd',
		gradeLabel: 'Kelas 5',
		subject: 'IPA (Sains)',
		visibility: 'public',
		mapId: 'map-halaman-sekolah',
		mode: 'free',
		settings: {
			isAllowPass: true,
			showIncorrectAnswer: true,
			answerRevealMode: 'always',
			shuffleQuestions: true,
			shuffleOptions: false
		},
		createdAt: '2026-11-10T08:00:00.000Z',
		updatedAt: '2026-11-10T08:00:00.000Z',
		questions: [
			{
				id: 'q-1',
				type: 'multiple',
				prompt: 'Garis khayal yang memisahkan fauna tipe Asiatis dan tipe Peralihan di Indonesia disebut garis...',
				hint: {
					type: 'text',
					value: 'Membentang dari Selat Lombok hingga Selat Makassar.'
				},
				options: [
					{ id: 'a', text: 'Garis Wallace' },
					{ id: 'b', text: 'Garis Weber' },
					{ id: 'c', text: 'Garis Khatulistiwa' },
					{ id: 'd', text: 'Garis Bujur Timur' }
				],
				answer: ['a'],
				timeLimitS: 30,
				points: 100,
				order: 1
			},
			{
				id: 'q-2',
				type: 'ox',
				prompt: 'Komodo secara alami hanya ditemukan di Kepulauan Nusa Tenggara Timur.',
				hint: {
					type: 'text',
					value: 'Ingat lokasi Taman Nasional Komodo (Pulau Komodo, Rinca, dan Padar).'
				},
				options: [
					{ id: 'o', text: 'Benar' },
					{ id: 'x', text: 'Salah' }
				],
				answer: ['o'],
				timeLimitS: 20,
				points: 100,
				order: 2
			},
			{
				id: 'q-3',
				type: 'subjective',
				prompt: 'Apa nama danau vulkanik terbesar di Indonesia yang terletak di Provinsi Sumatera Utara?',
				hint: {
					type: 'text',
					value: 'Di tengahnya terdapat Pulau Samosir.'
				},
				options: [],
				answer: ['toba', 'danau toba'],
				ignoreSpaces: true,
				timeLimitS: 30,
				points: 120,
				order: 3
			},
			{
				id: 'q-4',
				type: 'multiple',
				prompt: 'Tumbuhan langka Rafflesia arnoldii dikenal sebagai bunga padma raksasa yang hidup secara...',
				options: [
					{ id: 'a', text: 'Fotosintesis mandiri dengan daun lebar' },
					{ id: 'b', text: 'Parasit pada akar tumbuhan merambat Tetrastigma' },
					{ id: 'c', text: 'Epifit di batang pohon pinus' },
					{ id: 'd', text: 'Hidrofit mengapung di permukaan rawa' }
				],
				answer: ['b'],
				timeLimitS: 30,
				points: 100,
				order: 4
			},
			{
				id: 'q-5',
				type: 'multiple',
				prompt: 'Proses perubahan wujud benda dari gas langsung menjadi padat tanpa melalui zat cair disebut...',
				options: [
					{ id: 'a', text: 'Menyublim' },
					{ id: 'b', text: 'Mengembun' },
					{ id: 'c', text: 'Mengkristal' },
					{ id: 'd', text: 'Menguap' }
				],
				answer: ['c'],
				timeLimitS: 25,
				points: 100,
				order: 5
			},
			{
				id: 'q-6',
				type: 'subjective',
				prompt: 'Planet apakah dalam tata surya kita yang dijuluki sebagai Planet Merah?',
				hint: {
					type: 'text',
					value: 'Planet keempat dari Matahari.'
				},
				options: [],
				answer: ['mars', 'planet mars'],
				ignoreSpaces: true,
				timeLimitS: 25,
				points: 100,
				order: 6
			}
		]
	},
	{
		id: 'quiz-demo-matematika-smp',
		ownerName: 'Pak Hendra (SMPN 5 Bandung)',
		title: 'Petualangan Aljabar & Teorema Pythagoras',
		description:
			'Selesaikan teka-teki persamaan linear dan segitiga siku-siku secara berurutan di Route 101 Hoenn.',
		schoolLevel: 'smp',
		gradeLabel: 'Kelas 8',
		subject: 'Matematika',
		visibility: 'public',
		mapId: 'map-desa-sunnyside',
		mode: 'linear',
		settings: {
			isAllowPass: false,
			showIncorrectAnswer: true,
			answerRevealMode: 'always',
			shuffleQuestions: false,
			shuffleOptions: false
		},
		createdAt: '2026-11-10T09:15:00.000Z',
		updatedAt: '2026-11-10T09:15:00.000Z',
		questions: [
			{
				id: 'qm-1',
				type: 'subjective',
				prompt: 'Jika 3x + 7 = 22, berapakah nilai x?',
				hint: { type: 'text', value: 'Kurangi kedua ruas dengan 7 terlebih dahulu.' },
				options: [],
				answer: ['5', 'x=5'],
				ignoreSpaces: true,
				timeLimitS: 35,
				points: 100,
				order: 1
			},
			{
				id: 'qm-2',
				type: 'multiple',
				prompt: 'Sebuah segitiga siku-siku memiliki panjang alas 6 cm dan tinggi 8 cm. Berapakah panjang sisi miringnya (hipotenusa)?',
				options: [
					{ id: 'a', text: '10 cm' },
					{ id: 'b', text: '12 cm' },
					{ id: 'c', text: '14 cm' },
					{ id: 'd', text: '100 cm' }
				],
				answer: ['a'],
				timeLimitS: 35,
				points: 100,
				order: 2
			},
			{
				id: 'qm-3',
				type: 'ox',
				prompt: 'Gradien garis dengan persamaan y = -4x + 9 adalah 9.',
				hint: { type: 'text', value: 'Pada bentuk y = mx + c, gradien adalah koefisien m.' },
				options: [
					{ id: 'o', text: 'Benar' },
					{ id: 'x', text: 'Salah' }
				],
				answer: ['x'],
				timeLimitS: 25,
				points: 100,
				order: 3
			},
			{
				id: 'qm-4',
				type: 'multiple',
				prompt: 'Manakah di antara pasangan tripel berikut yang merupakan Tripel Pythagoras?',
				options: [
					{ id: 'a', text: '5, 12, 13' },
					{ id: 'b', text: '6, 7, 8' },
					{ id: 'c', text: '4, 5, 6' },
					{ id: 'd', text: '7, 10, 12' }
				],
				answer: ['a'],
				timeLimitS: 30,
				points: 100,
				order: 4
			}
		]
	}
]
