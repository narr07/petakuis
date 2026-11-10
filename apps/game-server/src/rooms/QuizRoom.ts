import {
	calculateScore,
	evaluateAnswer,
	GAME_CONSTANTS,
	isFootBoxWalkable,
	MAP_CATALOG,
	slideMovePlayer,
	type AnswerResultPayload,
	type AnswerSubmitPayload,
	type AssignedMapObject,
	type AvatarColorway,
	type CompactPlayerTuple,
	type Direction,
	type HostControlPayload,
	type HostPlayerTuple,
	type JoinedRoomResponse,
	type JoinRoomPayload,
	type LeaderboardEntry,
	type MapTemplate,
	type PublicQuestionPayload,
	type QuizDefinition,
	type QuizQuestion
} from '@petakuis/shared'
import type { Server, Socket } from 'socket.io'
import {
	clampMovementStep,
	isWithinInteractionDistance,
	sanitizeNickname
} from '../antiCheat'
import { logGameEvent } from '../logger'

export interface AnswerRecord {
	playerId: string
	nickname: string
	questionId: string
	value: string[]
	isCorrect: boolean
	responseMs: number
	speedRank: number | null
	points: number
	answeredAt: string
}

interface InternalPlayer {
	id: string
	socketId: string
	reconnectToken: string
	nickname: string
	avatarId: string
	colorway: AvatarColorway
	x: number
	y: number
	dir: Direction
	score: number
	correctCount: number
	totalTimeMs: number
	isAccessibleMode: boolean
	lastAccessibleActionAt: number
	answeredQuestionIds: Set<string>
	passedQuestionIds: Set<string>
	assignedObjects: AssignedMapObject[]
	firstOpenedAt: Map<string, number>
	connected: boolean
}

export class QuizRoom {
	public readonly code: string
	public readonly hostToken: string
	public readonly quiz: QuizDefinition
	public mapConfig: MapTemplate
	public status: 'lobby' | 'active' | 'paused' | 'ended' = 'lobby'
	public startedAt: string | null = null
	public endedAt: string | null = null

	private io: Server
	private players = new Map<string, InternalPlayer>()
	private reconnectIndex = new Map<string, string>()
	private socketToPlayerId = new Map<string, string>()
	private hostSocketIds = new Set<string>()
	private questionCorrectCounts = new Map<string, number>()
	private answerRecords: AnswerRecord[] = []
	private playerTickTimer: ReturnType<typeof setInterval> | null = null
	private hostTickTimer: ReturnType<typeof setInterval> | null = null

	constructor(io: Server, code: string, quiz: QuizDefinition, hostToken: string) {
		this.io = io
		this.code = code
		this.quiz = quiz
		this.hostToken = hostToken
		const foundMap = MAP_CATALOG.find((m) => m.id === quiz.mapId)
		this.mapConfig = (foundMap ?? MAP_CATALOG[0]) as MapTemplate
		this.startLoops()
	}

	private get effectiveTilePx(): number {
		return this.mapConfig.tileSizePx * this.mapConfig.renderScale
	}

	private get maxMapWidthPx(): number {
		return this.mapConfig.widthTiles * this.effectiveTilePx
	}

	private get maxMapHeightPx(): number {
		return this.mapConfig.heightTiles * this.effectiveTilePx
	}

	private startLoops(): void {
		const playerIntervalMs = Math.round(1000 / GAME_CONSTANTS.TICK_RATE_HZ)
		const hostIntervalMs = Math.round(1000 / GAME_CONSTANTS.HOST_TICK_RATE_HZ)

		this.playerTickTimer = setInterval(() => {
			this.broadcastPlayerStates()
		}, playerIntervalMs)

		this.hostTickTimer = setInterval(() => {
			this.broadcastHostState()
		}, hostIntervalMs)
	}

	public destroy(): void {
		if (this.playerTickTimer) clearInterval(this.playerTickTimer)
		if (this.hostTickTimer) clearInterval(this.hostTickTimer)
	}

	private buildAssignedObjects(playerId: string): AssignedMapObject[] {
		const questions = [...this.quiz.questions].sort((a, b) => a.order - b.order)
		const spawnPool = [...this.mapConfig.spawnPoints]

		if (this.quiz.mode === 'free') {
			let seed = 0
			for (let i = 0; i < playerId.length; i++) {
				seed = (seed * 31 + playerId.charCodeAt(i)) >>> 0
			}
			for (let i = spawnPool.length - 1; i > 0; i--) {
				seed = (seed * 1664525 + 1013904223) >>> 0
				const j = seed % (i + 1)
				const temp = spawnPool[i]!
				spawnPool[i] = spawnPool[j]!
				spawnPool[j] = temp
			}
		}

		return questions.map((q, idx) => {
			const sp = spawnPool[idx % spawnPool.length]!
			return {
				objectId: `${sp.id}__${q.id}`,
				questionId: q.id,
				orderIndex: idx + 1,
				tileX: sp.tileX,
				tileY: sp.tileY,
				objectKind: sp.objectKind,
				answered: false
			}
		})
	}

	public handleMapChange(mapIdOrSlug: string): void {
		const nextMap = MAP_CATALOG.find(
			(m) => m.id === mapIdOrSlug || m.slug === mapIdOrSlug
		)
		if (!nextMap) return
		this.mapConfig = nextMap
		const tilePx = this.effectiveTilePx
		const spawnX = Math.round(
			nextMap.playerSpawn.tileX * tilePx + tilePx / 2
		)
		const spawnY = Math.round(
			nextMap.playerSpawn.tileY * tilePx + tilePx / 2
		)

		for (const player of this.players.values()) {
			player.x = spawnX
			player.y = spawnY
			const rebuilt = this.buildAssignedObjects(player.id).map((obj) => ({
				...obj,
				answered: player.answeredQuestionIds.has(obj.questionId)
			}))
			player.assignedObjects = rebuilt
			this.io.to(player.socketId).emit('map:changed', {
				mapConfig: this.mapConfig,
				assignedObjects: player.assignedObjects,
				spawnX: player.x,
				spawnY: player.y
			})
		}

		this.io.to(`host:${this.code}`).emit('host:init', {
			code: this.code,
			status: this.status,
			quizTitle: this.quiz.title,
			subject: this.quiz.subject,
			schoolLevel: this.quiz.schoolLevel,
			mode: this.quiz.mode,
			mapConfig: this.mapConfig,
			totalQuestions: this.quiz.questions.length,
			leaderboard: this.getLeaderboard()
		})
		this.broadcastHostState()
		logGameEvent(
			'info',
			`room:${this.code}`,
			`Room map switched to ${nextMap.name} (${nextMap.id})`
		)
	}

	public handleJoin(socket: Socket, payload: JoinRoomPayload): void {
		socket.join(`room:${this.code}`)

		if (payload.role === 'host') {
			this.hostSocketIds.add(socket.id)
			socket.join(`host:${this.code}`)
			socket.emit('host:init', {
				code: this.code,
				status: this.status,
				quizTitle: this.quiz.title,
				subject: this.quiz.subject,
				schoolLevel: this.quiz.schoolLevel,
				mode: this.quiz.mode,
				mapConfig: this.mapConfig,
				totalQuestions: this.quiz.questions.length,
				leaderboard: this.getLeaderboard()
			})
			this.broadcastHostState()
			return
		}

		if (
			this.players.size >= GAME_CONSTANTS.MAX_PLAYERS_PER_ROOM &&
			(!payload.reconnectToken || !this.reconnectIndex.has(payload.reconnectToken))
		) {
			socket.emit('room:error', { message: 'Ruang kelas sudah penuh (maksimal 200 siswa).' })
			return
		}

		let player: InternalPlayer | undefined
		if (payload.reconnectToken && this.reconnectIndex.has(payload.reconnectToken)) {
			const existingId = this.reconnectIndex.get(payload.reconnectToken)!
			player = this.players.get(existingId)
		}

		if (!player) {
			const playerId = 'p_' + Math.random().toString(36).slice(2, 10)
			const reconnectToken = 'rt_' + Math.random().toString(36).slice(2, 14)
			const baseSpawnX = Math.round(
				this.mapConfig.playerSpawn.tileX * this.effectiveTilePx +
					this.effectiveTilePx / 2
			)
			const baseSpawnY = Math.round(
				this.mapConfig.playerSpawn.tileY * this.effectiveTilePx +
					this.effectiveTilePx / 2
			)
			const jitterX = Math.round((Math.random() - 0.5) * 24)
			const jitterY = Math.round((Math.random() - 0.5) * 24)
			const candidateX = baseSpawnX + jitterX
			const candidateY = baseSpawnY + jitterY
			const canJitter = isFootBoxWalkable(
				this.mapConfig,
				candidateX,
				candidateY
			)
			const spawnX = canJitter ? candidateX : baseSpawnX
			const spawnY = canJitter ? candidateY : baseSpawnY

			player = {
				id: playerId,
				socketId: socket.id,
				reconnectToken,
				nickname: sanitizeNickname(payload.nickname),
				avatarId: payload.avatarId || 'adventurer',
				colorway: payload.colorway || 'merah-putih',
				x: spawnX,
				y: spawnY,
				dir: 'down',
				score: 0,
				correctCount: 0,
				totalTimeMs: 0,
				isAccessibleMode: false,
				lastAccessibleActionAt: 0,
				answeredQuestionIds: new Set(),
				passedQuestionIds: new Set(),
				assignedObjects: this.buildAssignedObjects(playerId),
				firstOpenedAt: new Map(),
				connected: true
			}

			this.players.set(playerId, player)
			this.reconnectIndex.set(reconnectToken, playerId)
		} else {
			player.socketId = socket.id
			player.connected = true
			if (payload.nickname) {
				player.nickname = sanitizeNickname(payload.nickname)
			}
			if (payload.colorway) {
				player.colorway = payload.colorway
			}
		}

		this.socketToPlayerId.set(socket.id, player.id)

		const response: JoinedRoomResponse = {
			playerId: player.id,
			reconnectToken: player.reconnectToken,
			sessionStatus: this.status,
			quizTitle: this.quiz.title,
			subject: this.quiz.subject,
			schoolLevel: this.quiz.schoolLevel,
			mode: this.quiz.mode,
			mapConfig: this.mapConfig,
			assignedObjects: player.assignedObjects,
			score: player.score,
			answeredQuestionIds: Array.from(player.answeredQuestionIds),
			spawnX: player.x,
			spawnY: player.y
		}

		socket.emit('joined', response)
		logGameEvent('info', `room:${this.code}`, `Player joined: ${player.nickname} (${player.id})`, {
			colorway: player.colorway,
			totalPlayers: this.players.size
		})
		this.broadcastLeaderboard()
		this.broadcastHostState()
	}

	public handleMove(socket: Socket, tuple: [number, number, Direction]): void {
		if (this.status !== 'active' && this.status !== 'lobby') return
		const playerId = this.socketToPlayerId.get(socket.id)
		if (!playerId) return
		const player = this.players.get(playerId)
		if (!player) return

		const [targetX, targetY, dir] = tuple
		const clamped = clampMovementStep(
			player.x,
			player.y,
			Number(targetX) || player.x,
			Number(targetY) || player.y,
			this.maxMapWidthPx,
			this.maxMapHeightPx
		)

		if (isFootBoxWalkable(this.mapConfig, clamped.x, clamped.y)) {
			player.x = clamped.x
			player.y = clamped.y
		} else {
			const slid = slideMovePlayer(
				this.mapConfig,
				player.x,
				player.y,
				clamped.x - player.x,
				clamped.y - player.y
			)
			player.x = slid.x
			player.y = slid.y
		}
		player.dir = dir || 'down'
	}

	public handleQuestionOpen(socket: Socket, data: { objectId: string }): void {
		if (this.status !== 'active') {
			socket.emit('room:error', { message: 'Sesi belum dimulai atau sedang dijeda.' })
			return
		}

		const playerId = this.socketToPlayerId.get(socket.id)
		if (!playerId) return
		const player = this.players.get(playerId)
		if (!player) return

		const assigned = player.assignedObjects.find((obj) => obj.objectId === data.objectId)
		if (!assigned || assigned.answered) return

		if (this.quiz.mode === 'linear') {
			const nextUnanswered = player.assignedObjects.find((obj) => !obj.answered)
			if (nextUnanswered && nextUnanswered.objectId !== assigned.objectId) {
				socket.emit('room:error', {
					message: `Mode Berurutan: selesaikan Pos Soal #${nextUnanswered.orderIndex} terlebih dahulu.`
				})
				return
			}
		}

		if (player.isAccessibleMode) {
			const now = Date.now()
			const elapsedSinceLast = now - player.lastAccessibleActionAt
			if (elapsedSinceLast < GAME_CONSTANTS.ACCESSIBLE_COOLDOWN_MS) {
				const waitSec = Math.ceil(
					(GAME_CONSTANTS.ACCESSIBLE_COOLDOWN_MS - elapsedSinceLast) / 1000
				)
				socket.emit('room:error', {
					message: `Mode Aksesibel: berpindah ke pos soal berikutnya (${waitSec} dtk)...`
				})
				return
			}
		} else {
			const nearEnough = isWithinInteractionDistance(
				player.x,
				player.y,
				assigned.tileX,
				assigned.tileY,
				this.effectiveTilePx
			)
			if (!nearEnough) {
				socket.emit('room:error', {
					message: 'Dekati objek soal di peta terlebih dahulu untuk membuka pertanyaan.'
				})
				return
			}
		}

		const question = this.quiz.questions.find((q) => q.id === assigned.questionId)
		if (!question) return

		const now = Date.now()
		if (!player.firstOpenedAt.has(question.id)) {
			player.firstOpenedAt.set(question.id, now)
		}
		const openedAt = player.firstOpenedAt.get(question.id)!
		const elapsedSec = Math.floor((now - openedAt) / 1000)
		const remainingTimeS = Math.max(3, question.timeLimitS - elapsedSec)

		let options = [...question.options]
		if (this.quiz.settings.shuffleOptions && question.type === 'multiple') {
			options = options.sort(() => Math.random() - 0.5)
		}

		const payload: PublicQuestionPayload = {
			objectId: assigned.objectId,
			questionId: question.id,
			type: question.type,
			prompt: question.prompt,
			imageUrl: question.imageUrl,
			hint: question.hint,
			options,
			isMultipleAnswer: question.isMultipleAnswer,
			remainingTimeS,
			points: question.points,
			orderIndex: assigned.orderIndex,
			totalQuestions: this.quiz.questions.length
		}

		socket.emit('question:show', payload)
	}

	public handleAnswerSubmit(socket: Socket, payload: AnswerSubmitPayload): void {
		if (this.status !== 'active') return
		const playerId = this.socketToPlayerId.get(socket.id)
		if (!playerId) return
		const player = this.players.get(playerId)
		if (!player) return

		const assigned = player.assignedObjects.find(
			(obj) => obj.objectId === payload.objectId && obj.questionId === payload.questionId
		)
		if (!assigned || assigned.answered) return

		const question = this.quiz.questions.find((q) => q.id === payload.questionId)
		if (!question) return

		const now = Date.now()
		const openedAt = player.firstOpenedAt.get(question.id) ?? now
		const elapsedMs = Math.max(250, now - openedAt)

		const isCorrect = evaluateAnswer(question, payload.value)
		let correctOrderRank = 0
		if (isCorrect) {
			const prevCount = this.questionCorrectCounts.get(question.id) ?? 0
			correctOrderRank = prevCount + 1
			this.questionCorrectCounts.set(question.id, correctOrderRank)
		}

		const scoreResult = calculateScore({
			basePoints: question.points,
			timeLimitS: question.timeLimitS,
			elapsedMs,
			isCorrect,
			correctOrderRank
		})

		assigned.answered = true
		player.answeredQuestionIds.add(question.id)
		player.score += scoreResult.pointsEarned
		player.totalTimeMs += elapsedMs
		player.lastAccessibleActionAt = now
		if (isCorrect) {
			player.correctCount += 1
		}

		this.answerRecords.push({
			playerId: player.id,
			nickname: player.nickname,
			questionId: question.id,
			value: payload.value,
			isCorrect,
			responseMs: elapsedMs,
			speedRank: scoreResult.speedRank,
			points: scoreResult.pointsEarned,
			answeredAt: new Date(now).toISOString()
		})

		const revealCorrect =
			this.quiz.settings.showIncorrectAnswer &&
			this.quiz.settings.answerRevealMode === 'always'

		const resultPayload: AnswerResultPayload = {
			objectId: assigned.objectId,
			questionId: question.id,
			isCorrect,
			pointsEarned: scoreResult.pointsEarned,
			speedBonus: scoreResult.speedBonus,
			speedRank: scoreResult.speedRank,
			totalScore: player.score,
			correctAnswer: revealCorrect ? question.answer : undefined,
			nextAssignedObjects: player.assignedObjects
		}

		socket.emit('answer:result', resultPayload)
		logGameEvent(
			isCorrect ? 'success' : 'info',
			`room:${this.code}`,
			`Answer submitted by ${player.nickname} on ${question.id}: ${isCorrect ? 'BENAR' : 'SALAH'} (+${scoreResult.pointsEarned} pts)`,
			{
				elapsedMs,
				speedRank: scoreResult.speedRank,
				totalScore: player.score
			}
		)
		this.broadcastLeaderboard()
		this.broadcastHostState()

		this.checkAutoEndSession()
	}

	private checkAutoEndSession(): void {
		if (this.players.size === 0) return
		const totalQuestions = this.quiz.questions.length
		const allFinished = Array.from(this.players.values()).every(
			(p) => p.answeredQuestionIds.size >= totalQuestions
		)
		if (allFinished) {
			this.endSession()
		}
	}

	public handleToggleAccessibleMode(socket: Socket, enabled: boolean): void {
		const playerId = this.socketToPlayerId.get(socket.id)
		if (!playerId) return
		const player = this.players.get(playerId)
		if (!player) return
		player.isAccessibleMode = Boolean(enabled)
		socket.emit('accessible:updated', { isAccessibleMode: player.isAccessibleMode })
	}

	public handleHostControl(socket: Socket, payload: HostControlPayload): void {
		if (payload.action === 'start') {
			this.status = 'active'
			if (!this.startedAt) {
				this.startedAt = new Date().toISOString()
			}
			this.io.to(`room:${this.code}`).emit('session:status', {
				status: this.status,
				startedAt: this.startedAt
			})
		} else if (payload.action === 'pause') {
			this.status = 'paused'
			this.io.to(`room:${this.code}`).emit('session:status', { status: this.status })
		} else if (payload.action === 'resume') {
			this.status = 'active'
			this.io.to(`room:${this.code}`).emit('session:status', { status: this.status })
		} else if (payload.action === 'end') {
			this.endSession()
		} else if (payload.action === 'kick' && payload.targetPlayerId) {
			const target = this.players.get(payload.targetPlayerId)
			if (target) {
				this.io.to(target.socketId).emit('player:kicked', {
					reason: 'Kamu dikeluarkan dari sesi oleh Guru.'
				})
				this.players.delete(payload.targetPlayerId)
				this.broadcastLeaderboard()
				this.broadcastHostState()
			}
		} else if (payload.action === 'allow_accessible' && payload.targetPlayerId) {
			const target = this.players.get(payload.targetPlayerId)
			if (target) {
				target.isAccessibleMode = !target.isAccessibleMode
				this.io.to(target.socketId).emit('accessible:updated', {
					isAccessibleMode: target.isAccessibleMode
				})
				this.broadcastHostState()
			}
		}
	}

	public endSession(): void {
		if (this.status === 'ended') return
		this.status = 'ended'
		this.endedAt = new Date().toISOString()

		const leaderboard = this.getLeaderboard()
		const payload: SessionEndPayload = {
			podium: leaderboard.slice(0, 3),
			leaderboard,
			sessionCode: this.code
		}

		this.io.to(`room:${this.code}`).emit('session:status', { status: 'ended' })
		this.io.to(`room:${this.code}`).emit('session:end', payload)
	}

	public handleDisconnect(socket: Socket): void {
		this.hostSocketIds.delete(socket.id)
		const playerId = this.socketToPlayerId.get(socket.id)
		if (playerId) {
			const player = this.players.get(playerId)
			if (player) {
				player.connected = false
			}
			this.socketToPlayerId.delete(socket.id)
		}
	}

	private broadcastPlayerStates(): void {
		if (this.players.size === 0) return
		const now = Date.now()
		const allPlayers = Array.from(this.players.values()).filter((p) => p.connected)

		for (const viewer of allPlayers) {
			const nearby: CompactPlayerTuple[] = []
			for (const other of allPlayers) {
				if (other.id === viewer.id) continue
				const dist = Math.hypot(other.x - viewer.x, other.y - viewer.y)
				if (dist <= GAME_CONSTANTS.AOI_RADIUS_PX) {
					nearby.push([
						other.id,
						other.x,
						other.y,
						other.dir,
						other.nickname,
						other.colorway
					])
					if (nearby.length >= GAME_CONSTANTS.MAX_OTHER_PLAYERS_RENDERED) break
				}
			}
			this.io.to(viewer.socketId).emit('state', {
				t: now,
				players: nearby
			})
		}
	}

	private broadcastHostState(): void {
		if (this.hostSocketIds.size === 0) return
		const tuples: HostPlayerTuple[] = Array.from(this.players.values()).map((p) => [
			p.id,
			p.nickname,
			p.colorway,
			p.x,
			p.y,
			p.score,
			p.answeredQuestionIds.size
		])

		this.io.to(`host:${this.code}`).emit('host:state', {
			t: Date.now(),
			status: this.status,
			players: tuples,
			leaderboard: this.getLeaderboard()
		})
	}

	public getLeaderboard(): LeaderboardEntry[] {
		const totalQuestions = this.quiz.questions.length
		return Array.from(this.players.values())
			.sort((a, b) => {
				if (b.score !== a.score) return b.score - a.score
				return a.totalTimeMs - b.totalTimeMs
			})
			.map((p) => ({
				id: p.id,
				nickname: p.nickname,
				colorway: p.colorway,
				score: p.score,
				correctCount: p.correctCount,
				answeredCount: p.answeredQuestionIds.size,
				totalQuestions
			}))
	}

	private broadcastLeaderboard(): void {
		const leaderboard = this.getLeaderboard()
		this.io.to(`room:${this.code}`).emit('leaderboard', {
			top10: leaderboard.slice(0, 10),
			totalPlayers: leaderboard.length
		})
	}

	public getReportData() {
		const leaderboard = this.getLeaderboard()
		const questionStats = this.quiz.questions.map((q, idx) => {
			const attempts = this.answerRecords.filter((r) => r.questionId === q.id)
			const correctAttempts = attempts.filter((r) => r.isCorrect)
			const avgTimeMs =
				attempts.length > 0
					? Math.round(
							attempts.reduce((acc, r) => acc + r.responseMs, 0) / attempts.length
						)
					: 0

			return {
				questionId: q.id,
				order: idx + 1,
				prompt: q.prompt,
				type: q.type,
				attemptsCount: attempts.length,
				correctCount: correctAttempts.length,
				accuracyPercent:
					attempts.length > 0
						? Math.round((correctAttempts.length / attempts.length) * 100)
						: 0,
				avgResponseSeconds: Number((avgTimeMs / 1000).toFixed(1))
			}
		})

		return {
			code: this.code,
			status: this.status,
			quizTitle: this.quiz.title,
			subject: this.quiz.subject,
			schoolLevel: this.quiz.schoolLevel,
			gradeLabel: this.quiz.gradeLabel,
			mapName: this.mapConfig.name,
			mode: this.quiz.mode,
			startedAt: this.startedAt,
			endedAt: this.endedAt,
			totalPlayers: leaderboard.length,
			totalQuestions: this.quiz.questions.length,
			players: leaderboard.map((entry, idx) => {
				const rawPlayer = this.players.get(entry.id)
				return {
					rank: idx + 1,
					...entry,
					accuracyPercent:
						entry.totalQuestions > 0
							? Math.round((entry.correctCount / entry.totalQuestions) * 100)
							: 0,
					totalTimeSeconds: rawPlayer
						? Number((rawPlayer.totalTimeMs / 1000).toFixed(1))
						: 0
				}
			}),
			questionStats,
			answers: this.answerRecords
		}
	}
}
