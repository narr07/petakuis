import { defineStore } from 'pinia'
import {
	buildAssignedObjects,
	MAP_CATALOG,
	STARTER_QUIZZES,
	type AnswerResultPayload,
	type AssignedMapObject,
	type AvatarColorway,
	type CompactPlayerTuple,
	type LeaderboardEntry,
	type MapTemplate,
	type PublicQuestionPayload
} from '@petakuis/shared'

export const useSessionStore = defineStore('petakuis-session', () => {
	const defaultMap = MAP_CATALOG[0]!
	const defaultQuiz = STARTER_QUIZZES[0]!

	const code = ref('123456')
	const playerId = ref('')
	const reconnectToken = ref('')
	const nickname = ref('Petualang')
	const colorway = ref<AvatarColorway>('merah-putih')
	const sessionStatus = ref<'lobby' | 'active' | 'paused' | 'ended'>('active')
	const quizTitle = ref(defaultQuiz.title)
	const subject = ref(defaultQuiz.subject)
	const schoolLevel = ref<string>(defaultQuiz.schoolLevel)
	const mode = ref<'free' | 'linear'>(defaultQuiz.mode)
	const mapConfig = ref<MapTemplate | null>(defaultMap)

	const myX = ref(defaultMap.playerSpawn.tileX * defaultMap.tileSizePx * defaultMap.renderScale)
	const myY = ref(defaultMap.playerSpawn.tileY * defaultMap.tileSizePx * defaultMap.renderScale)
	const myScore = ref(0)
	const isAccessibleMode = ref(false)
	/** Room demo bawaan: hanya di sini pemain boleh mengganti peta. */
	const isDemoRoom = ref(false)

	const assignedObjects = ref<AssignedMapObject[]>(
		buildAssignedObjects(defaultQuiz, defaultMap, 'demo')
	)
	const nearbyPlayers = ref<CompactPlayerTuple[]>([])
	const activeQuestion = ref<PublicQuestionPayload | null>(null)
	const lastAnswerResult = ref<AnswerResultPayload | null>(null)
	const leaderboard = ref<LeaderboardEntry[]>([])
	const podium = ref<LeaderboardEntry[]>([])
	const errorBanner = ref<string | null>(null)

	const unansweredObjects = computed(() =>
		assignedObjects.value.filter((obj) => !obj.answered)
	)

	const nextTargetObject = computed(() => {
		const remaining = unansweredObjects.value
		if (remaining.length === 0) return null
		if (mode.value === 'linear') {
			return remaining[0] ?? null
		}
		const tilePx = mapConfig.value
			? mapConfig.value.tileSizePx * mapConfig.value.renderScale
			: 48
		let closest = remaining[0]!
		let bestDist = Infinity
		for (const item of remaining) {
			const ox = item.tileX * tilePx + tilePx / 2
			const oy = item.tileY * tilePx + tilePx / 2
			const d = Math.hypot(ox - myX.value, oy - myY.value)
			if (d < bestDist) {
				bestDist = d
				closest = item
			}
		}
		return closest
	})

	const nearestInteractableObject = computed(() => {
		const tilePx = mapConfig.value
			? mapConfig.value.tileSizePx * mapConfig.value.renderScale
			: 48
		const candidates =
			mode.value === 'linear'
				? unansweredObjects.value.slice(0, 1)
				: unansweredObjects.value

		for (const obj of candidates) {
			const ox = obj.tileX * tilePx + tilePx / 2
			const oy = obj.tileY * tilePx + tilePx / 2
			const dist = Math.hypot(ox - myX.value, oy - myY.value)
			if (dist <= 96) {
				return obj
			}
		}
		return null
	})

	function showTransientError(msg: string) {
		errorBanner.value = msg
		setTimeout(() => {
			if (errorBanner.value === msg) {
				errorBanner.value = null
			}
		}, 3500)
	}

	function switchMap(mapIdOrSlug: string) {
		const target = MAP_CATALOG.find(
			(m) => m.id === mapIdOrSlug || m.slug === mapIdOrSlug
		)
		if (!target) return
		mapConfig.value = target
		const tilePx = target.tileSizePx * target.renderScale
		myX.value = target.playerSpawn.tileX * tilePx + tilePx / 2
		myY.value = target.playerSpawn.tileY * tilePx + tilePx / 2
		assignedObjects.value = assignedObjects.value.map((obj, idx) => {
			const sp = target.spawnPoints[idx % target.spawnPoints.length]!
			return {
				...obj,
				tileX: sp.tileX,
				tileY: sp.tileY
			}
		})
	}

	return {
		code,
		playerId,
		reconnectToken,
		nickname,
		colorway,
		sessionStatus,
		quizTitle,
		subject,
		schoolLevel,
		mode,
		mapConfig,
		myX,
		myY,
		myScore,
		isAccessibleMode,
		isDemoRoom,
		assignedObjects,
		nearbyPlayers,
		activeQuestion,
		lastAnswerResult,
		leaderboard,
		podium,
		errorBanner,
		unansweredObjects,
		nextTargetObject,
		nearestInteractableObject,
		showTransientError,
		switchMap
	}
})
