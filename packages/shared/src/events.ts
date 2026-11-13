import type {
	AvatarColorway,
	Direction,
	GameMode,
	LeaderboardEntry,
	MapTemplate,
	PublicQuestionPayload
} from './types'

export type CompactPlayerTuple = [
	id: string,
	x: number,
	y: number,
	dir: Direction,
	nickname: string,
	colorway: AvatarColorway
]

export type HostPlayerTuple = [
	id: string,
	nickname: string,
	colorway: AvatarColorway,
	x: number,
	y: number,
	score: number,
	answeredCount: number
]

export interface AssignedMapObject {
	objectId: string
	questionId: string
	orderIndex: number
	tileX: number
	tileY: number
	objectKind: 'chest' | 'board' | 'crystal' | 'npc'
	/** Karakter yang membawa soal ini (id dari NPC_CHARACTERS). */
	npcId: string
	answered: boolean
}

export interface JoinRoomPayload {
	code: string
	nickname: string
	avatarId: string
	colorway: AvatarColorway
	reconnectToken?: string
	role?: 'player' | 'host'
	hostToken?: string
}

export interface JoinedRoomResponse {
	playerId: string
	reconnectToken: string
	sessionStatus: 'lobby' | 'active' | 'paused' | 'ended'
	quizTitle: string
	subject: string
	schoolLevel: string
	mode: GameMode
	mapConfig: MapTemplate
	assignedObjects: AssignedMapObject[]
	score: number
	answeredQuestionIds: string[]
	spawnX: number
	spawnY: number
	/** Room demo bawaan: pemain boleh mencoba mengganti peta. */
	isDemo: boolean
}

export interface AnswerSubmitPayload {
	objectId: string
	questionId: string
	value: string[]
}

export interface AnswerResultPayload {
	objectId: string
	questionId: string
	isCorrect: boolean
	pointsEarned: number
	speedBonus: number
	speedRank: number | null
	totalScore: number
	correctAnswer?: string[]
	nextAssignedObjects: AssignedMapObject[]
}

export interface HostControlPayload {
	action: 'start' | 'pause' | 'resume' | 'end' | 'kick' | 'allow_accessible'
	targetPlayerId?: string
}

export interface SessionEndPayload {
	podium: LeaderboardEntry[]
	leaderboard: LeaderboardEntry[]
	sessionCode: string
}

export const GAME_CONSTANTS = {
	TICK_RATE_HZ: 15,
	HOST_TICK_RATE_HZ: 5,
	AOI_RADIUS_PX: 720,
	MAX_OTHER_PLAYERS_RENDERED: 25,
	INTERACTION_RADIUS_PX: 96,
	MAX_SPEED_PX_PER_SEC: 340,
	ACCESSIBLE_COOLDOWN_MS: 4000,
	MAX_PLAYERS_PER_ROOM: 200,
	/** Satu soal satu pos: setiap peta punya 24 pos soal, jadi kuis dibatasi 24 soal. */
	MAX_QUESTIONS_PER_QUIZ: 24
} as const
