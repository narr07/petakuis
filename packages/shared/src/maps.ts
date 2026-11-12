import { DATARAN_ANGIN_LAYOUT } from './generated/map-dataran-angin'
import { DESA_LADANG_LAYOUT } from './generated/map-desa-ladang'
import { DESA_TEPI_SUNGAI_LAYOUT } from './generated/map-desa-tepi-sungai'
import { KAMPUNG_DANAU_LAYOUT } from './generated/map-kampung-danau'
import { KOTA_PASAR_LAYOUT } from './generated/map-kota-pasar'
import { LEMBAH_SUNNYSIDE_LAYOUT } from './generated/map-lembah-sunnyside'
import { PESISIR_KARANG_LAYOUT } from './generated/map-pesisir-karang'
import { CURRICULUM_QUIZZES } from './starterQuizzes'
import type { AvatarColorway, MapTemplate, QuizDefinition } from './types'

type GodotLayout = typeof LEMBAH_SUNNYSIDE_LAYOUT

/** Peta yang disusun di tools/godot-maps: data tata letak diambil dari berkas hasil ekspor. */
function godotMap(
	base: Pick<MapTemplate, 'id' | 'slug' | 'name' | 'description' | 'defaultMode' | 'palette'>,
	layout: GodotLayout
): MapTemplate {
	return {
		...base,
		mapImageUrl: layout.mapImageUrl,
		widthTiles: layout.widthTiles,
		heightTiles: layout.heightTiles,
		tileSizePx: layout.tileSizePx,
		renderScale: 3,
		playerSpawn: layout.playerSpawn,
		collisionRows: layout.collisionRows,
		collisionFineRows: layout.collisionFineRows,
		obstacles: [],
		spawnPoints: layout.spawnPoints,
		maxPlayers: 200
	}
}

/** Avatar pemain: sprite dari paket Ninja Adventure (CC0), dibuat oleh tools/godot-maps/scripts/build_avatars.gd. */
export const AVATAR_COLORWAYS: Array<{
	id: AvatarColorway
	label: string
	spriteUrl: string
	primaryHex: string
	secondaryHex: string
}> = [
	{
		id: 'merah-putih',
		label: 'Si Rambut Merah',
		spriteUrl: '/avatars/merah-putih.png',
		primaryHex: '#dc2626',
		secondaryHex: '#f8fafc'
	},
	{
		id: 'hijau-rimba',
		label: 'Si Penjelajah Rimba',
		spriteUrl: '/avatars/hijau-rimba.png',
		primaryHex: '#15803d',
		secondaryHex: '#bbf7d0'
	},
	{
		id: 'batik-biru',
		label: 'Si Ninja Biru',
		spriteUrl: '/avatars/batik-biru.png',
		primaryHex: '#1d4ed8',
		secondaryHex: '#93c5fd'
	},
	{
		id: 'ungu-senja',
		label: 'Si Mahkota',
		spriteUrl: '/avatars/ungu-senja.png',
		primaryHex: '#7e22ce',
		secondaryHex: '#e9d5ff'
	},
	{
		id: 'pramuka',
		label: 'Si Pandu',
		spriteUrl: '/avatars/pramuka.png',
		primaryHex: '#92400e',
		secondaryHex: '#fde68a'
	},
	{
		id: 'kuning-emas',
		label: 'Si Rambut Pirang',
		spriteUrl: '/avatars/kuning-emas.png',
		primaryHex: '#ca8a04',
		secondaryHex: '#fef08a'
	},
	{
		id: 'toska-laut',
		label: 'Si Rambut Panjang',
		spriteUrl: '/avatars/toska-laut.png',
		primaryHex: '#0f766e',
		secondaryHex: '#99f6e4'
	},
	{
		id: 'oranye-bata',
		label: 'Si Petani',
		spriteUrl: '/avatars/oranye-bata.png',
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
	godotMap(
		{
			id: 'map-pesisir-karang',
			slug: 'pesisir-karang',
			name: 'Pesisir Karang · Kampung Nelayan & Dermaga',
			description:
				'Kampung nelayan di tepi laut (64x48 tile): deretan rumah menghadap pantai berpasir, dermaga kayu, rumah panggung di atas laut, mercusuar batu, dan pulau kecil yang disambung titian.',
			defaultMode: 'free',
			palette: {
				floorPrimary: '#62c44c',
				floorSecondary: '#e0b070',
				wallPrimary: '#2c8fd6',
				wallAccent: '#30d8e8',
				accentColor: '#facc15'
			}
		},
		PESISIR_KARANG_LAYOUT
	),
	{
		id: 'map-desa-sunnyside',
		slug: 'lembah-sunnyside',
		name: 'Lembah Sunnyside · Desa, Ladang & Danau',
		description:
			'Desa lembah (64x48 tile / 3072x2304 px) yang disusun di Godot dari paket Sunnyside World: alun-alun berpatung, sungai berjembatan, ladang dan kincir angin, serta danau berdermaga, dikelilingi hutan.',
		defaultMode: 'free',
		mapImageUrl: LEMBAH_SUNNYSIDE_LAYOUT.mapImageUrl,
		widthTiles: LEMBAH_SUNNYSIDE_LAYOUT.widthTiles,
		heightTiles: LEMBAH_SUNNYSIDE_LAYOUT.heightTiles,
		tileSizePx: LEMBAH_SUNNYSIDE_LAYOUT.tileSizePx,
		renderScale: 3,
		palette: {
			floorPrimary: '#62c44c',
			floorSecondary: '#5ab846',
			wallPrimary: '#c8443c',
			wallAccent: '#30d8e8',
			accentColor: '#facc15'
		},
		playerSpawn: LEMBAH_SUNNYSIDE_LAYOUT.playerSpawn,
		collisionRows: LEMBAH_SUNNYSIDE_LAYOUT.collisionRows,
		collisionFineRows: LEMBAH_SUNNYSIDE_LAYOUT.collisionFineRows,
		obstacles: [],
		spawnPoints: LEMBAH_SUNNYSIDE_LAYOUT.spawnPoints,
		maxPlayers: 200
	},
	{
		id: 'map-kampus-modern',
		slug: 'modern-campus-complex',
		name: 'Kompleks Kampus & Perpustakaan Modern (Indoor 16x16)',
		description:
			'Denah kampus sekolah luas (48x36 tile / 2304x1728 px) dari paket Modern Tiles 16x16 yang menghubungkan 4 sayap gedung: Ruang Kelas Utama, Perpustakaan Raya, Laboratorium Sains, dan Aula Diskusi.',
		defaultMode: 'linear',
		mapImageUrl: '/maps/modern-campus-complex.png',
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
	},
	godotMap(
		{
			id: 'map-dataran-angin',
			slug: 'dataran-angin',
			name: 'Dataran Tinggi Angin · Kincir & Undakan Tebing',
			description:
				'Tiga undakan tebing yang disambung tangga papan (64x48 tile): kincir angin dan kandang domba di atas, kampung dan ladang di tengah, sungai berjembatan di lembah bawah.',
			defaultMode: 'linear',
			palette: {
				floorPrimary: '#62c44c',
				floorSecondary: '#5ab846',
				wallPrimary: '#b5603a',
				wallAccent: '#30d8e8',
				accentColor: '#f97316'
			}
		},
		DATARAN_ANGIN_LAYOUT
	),
	godotMap(
		{
			id: 'map-kota-pasar',
			slug: 'kota-pasar',
			name: 'Kota Pasar · Alun-Alun, Kanal & Balai Kota',
			description:
				'Kota berpetak (64x48 tile) dengan pasar di alun-alun tengah, kanal berjembatan, balai kota beratap biru, menara kayu berkincir, dan lebih dari 20 bangunan beragam.',
			defaultMode: 'free',
			palette: {
				floorPrimary: '#62c44c',
				floorSecondary: '#c98f5a',
				wallPrimary: '#c8443c',
				wallAccent: '#30d8e8',
				accentColor: '#a855f7'
			}
		},
		KOTA_PASAR_LAYOUT
	),
	// Tiga peta berikut dibuat generator (tools/godot-maps/scripts/generate_map.gd);
	// seed tercatat di sini supaya bisa dibangun ulang persis sama.
	godotMap(
		{
			id: 'map-desa-tepi-sungai',
			slug: 'desa-tepi-sungai',
			name: 'Desa Tepi Sungai · Jembatan & Ladang',
			description:
				'Desa berpetak (64x48 tile) dengan sungai berkelok di selatan, dua jembatan papan, jalan di seberang sungai, dan 21 rumah beragam. Generator: tema sungai, seed 12.',
			defaultMode: 'free',
			palette: {
				floorPrimary: '#62c44c',
				floorSecondary: '#c98f5a',
				wallPrimary: '#c8443c',
				wallAccent: '#30d8e8',
				accentColor: '#0ea5e9'
			}
		},
		DESA_TEPI_SUNGAI_LAYOUT
	),
	godotMap(
		{
			id: 'map-kampung-danau',
			slug: 'kampung-danau',
			name: 'Kampung Danau · Kincir & Kebun',
			description:
				'Kampung (64x48 tile) dengan danau di tengah selatan, kebun di kedua tepinya, kincir angin, dan 20 rumah menghadap jalan. Generator: tema danau, seed 21.',
			defaultMode: 'free',
			palette: {
				floorPrimary: '#62c44c',
				floorSecondary: '#5ab846',
				wallPrimary: '#8b5cf6',
				wallAccent: '#30d8e8',
				accentColor: '#14b8a6'
			}
		},
		KAMPUNG_DANAU_LAYOUT
	),
	godotMap(
		{
			id: 'map-desa-ladang',
			slug: 'desa-ladang',
			name: 'Desa Ladang · Kolam, Kebun & Kincir',
			description:
				'Desa pertanian (64x48 tile) dengan kolam kecil, enam petak kebun, ternak, dua kincir angin, dan 19 rumah. Generator: tema desa, seed 99.',
			defaultMode: 'linear',
			palette: {
				floorPrimary: '#62c44c',
				floorSecondary: '#c98f5a',
				wallPrimary: '#c8443c',
				wallAccent: '#facc15',
				accentColor: '#84cc16'
			}
		},
		DESA_LADANG_LAYOUT
	)
]

/** Dua kuis demo awal (dipakai juga oleh room demo di game server). */
const DEMO_QUIZZES: QuizDefinition[] = [
	{
		id: 'quiz-demo-nusantara',
		ownerName: 'Ibu Ratna (SDN 01 Menteng)',
		title: 'Eksplorasi Alam & Geografi Indonesia',
		description:
			'Kuis petualangan mengenal pulau, flora, fauna, dan fenomena alam kepulauan Indonesia di peta Pesisir Karang.',
		schoolLevel: 'sd',
		gradeLabel: 'Kelas 5',
		subject: 'IPA (Sains)',
		visibility: 'public',
		mapId: 'map-pesisir-karang',
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
			'Selesaikan teka-teki persamaan linear dan segitiga siku-siku secara berurutan di Lembah Sunnyside.',
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

/** Semua kuis contoh yang dimasukkan ke database: demo awal + kuis kurikulum SD kelas 1–6. */
export const STARTER_QUIZZES: QuizDefinition[] = [...DEMO_QUIZZES, ...CURRICULUM_QUIZZES]
