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
