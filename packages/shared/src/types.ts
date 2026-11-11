export type SchoolLevel = 'tk' | 'sd' | 'smp' | 'sma' | 'kuliah' | 'lainnya'

export type GameMode = 'free' | 'linear'

export type QuestionType = 'multiple' | 'ox' | 'subjective'

export type Direction = 'down' | 'left' | 'right' | 'up'

export type AvatarColorway =
	| 'merah-putih'
	| 'pramuka'
	| 'batik-biru'
	| 'hijau-rimba'
	| 'ungu-senja'
	| 'kuning-emas'
	| 'toska-laut'
	| 'oranye-bata'

export interface QuestionHint {
	type: 'text' | 'image'
	value: string
}

export interface QuestionOption {
	id: string
	text: string
}

export interface QuizQuestion {
	id: string
	type: QuestionType
	prompt: string
	imageUrl?: string
	hint?: QuestionHint
	options: QuestionOption[]
	answer: string[]
	isMultipleAnswer?: boolean
	ignoreSpaces?: boolean
	timeLimitS: number
	points: number
	order: number
	/** Karakter pemberi soal (id dari NPC_CHARACTERS). Kosong = dipilih otomatis. */
	npcId?: string
	/** Posisi karakter di peta kuis (koordinat tile). Kosong = pos bawaan peta. */
	placement?: TilePosition
}

export interface TilePosition {
	tileX: number
	tileY: number
}

export interface NpcCharacter {
	id: string
	label: string
	spriteUrl: string
	/** Jumlah frame animasi diam, berjajar mendatar, masing-masing 32x32 px. */
	frames: number
}

export interface PublicQuestionPayload {
	objectId: string
	questionId: string
	type: QuestionType
	prompt: string
	imageUrl?: string
	hint?: QuestionHint
	options: QuestionOption[]
	isMultipleAnswer?: boolean
	remainingTimeS: number
	points: number
	orderIndex: number
	totalQuestions: number
	npcId?: string
}

export interface QuizSettings {
	isAllowPass: boolean
	showIncorrectAnswer: boolean
	answerRevealMode: 'always' | 'after_end'
	shuffleQuestions: boolean
	shuffleOptions: boolean
}

export interface SpawnPoint {
	id: string
	tileX: number
	tileY: number
	objectKind: 'chest' | 'board' | 'crystal' | 'npc'
}

export interface MapTemplate {
	id: string
	slug: string
	name: string
	description: string
	defaultMode: GameMode
	mapImageUrl: string
	widthTiles: number
	heightTiles: number
	tileSizePx: number
	renderScale: number
	palette: {
		floorPrimary: string
		floorSecondary: string
		wallPrimary: string
		wallAccent: string
		accentColor: string
	}
	playerSpawn: {
		tileX: number
		tileY: number
	}
	collisionRows?: string[]
	/**
	 * Grid tabrakan setengah tile (lebar & tinggi 2x) untuk gerak pemain, supaya pemain
	 * bisa merapat sampai tepi gambar bangunan. Pencarian jalan tetap memakai collisionRows.
	 */
	collisionFineRows?: string[]
	obstacles: Array<{
		tileX: number
		tileY: number
		width: number
		height: number
		label?: string
	}>
	spawnPoints: SpawnPoint[]
	maxPlayers: number
}

export interface QuizDefinition {
	id: string
	ownerName: string
	title: string
	description: string
	schoolLevel: SchoolLevel
	gradeLabel: string
	subject: string
	visibility: 'public' | 'private'
	mapId: string
	mode: GameMode
	settings: QuizSettings
	questions: QuizQuestion[]
	createdAt: string
	updatedAt: string
}

export interface SessionPlayerSummary {
	id: string
	nickname: string
	avatarId: string
	colorway: AvatarColorway
	score: number
	correctCount: number
	answeredCount: number
	totalTimeMs: number
	isAccessibleMode: boolean
	x: number
	y: number
	dir: Direction
}

export interface LeaderboardEntry {
	id: string
	nickname: string
	colorway: AvatarColorway
	score: number
	correctCount: number
	answeredCount: number
	totalQuestions: number
}

export interface ReportPlayerEntry extends LeaderboardEntry {
	rank: number
	accuracyPercent: number
	totalTimeSeconds: number
}

export interface QuestionStatEntry {
	questionId: string
	order: number
	prompt: string
	type: string
	attemptsCount: number
	correctCount: number
	accuracyPercent: number
	avgResponseSeconds: number
}

export interface SessionReportData {
	code: string
	status: 'lobby' | 'active' | 'paused' | 'ended'
	quizTitle: string
	subject: string
	schoolLevel: string
	gradeLabel: string
	mapName: string
	mode: 'free' | 'linear'
	startedAt?: string
	endedAt?: string
	totalPlayers: number
	totalQuestions: number
	players: ReportPlayerEntry[]
	questionStats: QuestionStatEntry[]
	answers: Array<{
		playerId: string
		nickname: string
		questionId: string
		value: string[]
		isCorrect: boolean
		responseMs: number
	}>
}
