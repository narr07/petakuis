import { io, type Socket } from 'socket.io-client'
import type {
	AnswerResultPayload,
	AnswerSubmitPayload,
	AssignedMapObject,
	AvatarColorway,
	CompactPlayerTuple,
	Direction,
	HostControlPayload,
	JoinedRoomResponse,
	LeaderboardEntry,
	MapTemplate,
	PublicQuestionPayload,
	SessionEndPayload
} from '@petakuis/shared'
import { useSessionStore } from '~/stores/useSessionStore'

export function useGameSocket() {
	const config = useRuntimeConfig()
	const store = useSessionStore()
	const socketRef = shallowRef<Socket | null>(null)
	const connected = ref(false)

	function connectPlayer(params: {
		code: string
		nickname: string
		colorway: AvatarColorway
	}) {
		if (socketRef.value) {
			socketRef.value.disconnect()
		}

		const s = io(config.public.gameServerUrl, {
			transports: ['websocket', 'polling']
		})
		socketRef.value = s

		const storageKey = `petakuis_rt_${params.code}`
		const savedToken =
			typeof window !== 'undefined'
				? window.localStorage.getItem(storageKey) || undefined
				: undefined

		s.on('connect', () => {
			connected.value = true
			s.emit('join', {
				code: params.code,
				nickname: params.nickname,
				avatarId: 'adventurer',
				colorway: params.colorway,
				reconnectToken: savedToken,
				role: 'player'
			})
		})

		s.on('disconnect', () => {
			connected.value = false
		})

		s.on('joined', (payload: JoinedRoomResponse) => {
			store.code = params.code
			store.playerId = payload.playerId
			store.reconnectToken = payload.reconnectToken
			store.sessionStatus = payload.sessionStatus
			store.quizTitle = payload.quizTitle
			store.subject = payload.subject
			store.schoolLevel = payload.schoolLevel
			store.mode = payload.mode
			store.mapConfig = payload.mapConfig
			store.assignedObjects = payload.assignedObjects
			store.myScore = payload.score
			store.myX = payload.spawnX
			store.myY = payload.spawnY

			if (typeof window !== 'undefined') {
				window.localStorage.setItem(storageKey, payload.reconnectToken)
			}
		})

		s.on('state', (payload: { t: number; players: CompactPlayerTuple[] }) => {
			store.nearbyPlayers = payload.players
		})

		s.on('session:status', (payload: { status: 'lobby' | 'active' | 'paused' | 'ended' }) => {
			store.sessionStatus = payload.status
		})

		s.on('question:show', (payload: PublicQuestionPayload) => {
			store.lastAnswerResult = null
			store.activeQuestion = payload
		})

		s.on('answer:result', (payload: AnswerResultPayload) => {
			store.lastAnswerResult = payload
			store.myScore = payload.totalScore
			store.assignedObjects = payload.nextAssignedObjects
		})

		s.on(
			'leaderboard',
			(payload: { top10: LeaderboardEntry[]; totalPlayers: number }) => {
				store.leaderboard = payload.top10
			}
		)

		s.on('accessible:updated', (payload: { isAccessibleMode: boolean }) => {
			store.isAccessibleMode = payload.isAccessibleMode
		})

		s.on('session:end', (payload: SessionEndPayload) => {
			store.sessionStatus = 'ended'
			store.podium = payload.podium
			store.leaderboard = payload.leaderboard
			store.activeQuestion = null
		})

		s.on('room:error', (payload: { message: string }) => {
			store.showTransientError(payload.message)
		})

		s.on(
			'map:changed',
			(payload: {
				mapConfig: MapTemplate
				assignedObjects: AssignedMapObject[]
				spawnX: number
				spawnY: number
			}) => {
				store.mapConfig = payload.mapConfig
				store.assignedObjects = payload.assignedObjects
				store.myX = payload.spawnX
				store.myY = payload.spawnY
			}
		)
	}

	function changeRoomMap(mapIdOrSlug: string) {
		store.switchMap(mapIdOrSlug)
		socketRef.value?.emit('map:change', { mapId: mapIdOrSlug })
	}

	function sendMove(x: number, y: number, dir: Direction) {
		store.myX = x
		store.myY = y
		socketRef.value?.emit('move', [Math.round(x), Math.round(y), dir])
	}

	function requestOpenQuestion(objectId: string) {
		socketRef.value?.emit('question:open', { objectId })
	}

	function submitAnswer(payload: AnswerSubmitPayload) {
		socketRef.value?.emit('answer:submit', payload)
	}

	function toggleAccessibleMode(enabled: boolean) {
		socketRef.value?.emit('accessible:toggle', { enabled })
	}

	function sendHostControl(payload: HostControlPayload) {
		socketRef.value?.emit('host:control', payload)
	}

	function disconnect() {
		socketRef.value?.disconnect()
		socketRef.value = null
		connected.value = false
	}

	onBeforeUnmount(() => {
		disconnect()
	})

	return {
		socketRef,
		connected,
		connectPlayer,
		changeRoomMap,
		sendMove,
		requestOpenQuestion,
		submitAnswer,
		toggleAccessibleMode,
		sendHostControl,
		disconnect
	}
}
