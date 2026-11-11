import { randomInt, randomUUID } from 'node:crypto'
import type { GameMode } from '@petakuis/shared'
import { getQuizById, recordGameSession } from '../../utils/store'

const MAX_CODE_ATTEMPTS = 5

export default defineEventHandler(async (event) => {
	const current = await requireUser(event, ['teacher', 'admin'])
	const config = useRuntimeConfig()
	const body = await readBody<{
		quizId: string
		mode?: GameMode
		mapId?: string
		autoStart?: boolean
	}>(event)

	const quiz = await getQuizById(body.quizId)
	if (!quiz) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kuis tidak ditemukan.'
		})
	}

	const sessionQuiz = {
		...quiz,
		mode: body.mode || quiz.mode,
		mapId: body.mapId || quiz.mapId
	}

	// Token host hanya dikirim ke guru yang membuat sesi; layar host memakainya untuk mengendalikan sesi.
	const hostToken = 'ht_' + randomUUID()

	for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
		const code = String(randomInt(100000, 1000000))
		let resp: Response
		try {
			resp = await fetch(`${config.gameServerInternalUrl}/rooms`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-internal-secret': config.internalSecret
				},
				body: JSON.stringify({
					code,
					quiz: sessionQuiz,
					hostToken,
					autoStart: Boolean(body.autoStart)
				})
			})
		} catch {
			throw createError({
				statusCode: 503,
				statusMessage: 'Game server belum aktif.'
			})
		}

		if (resp.status === 409) {
			continue // kode sedang dipakai room lain, coba kode baru
		}
		if (!resp.ok) {
			throw createError({
				statusCode: 502,
				statusMessage: `Game server menolak pembuatan sesi (kode ${resp.status}).`
			})
		}

		await recordGameSession({
			code,
			quiz: sessionQuiz,
			status: body.autoStart ? 'active' : 'lobby',
			ownerId: current.id
		})

		return {
			ok: true,
			code,
			hostToken,
			quizTitle: sessionQuiz.title,
			mode: sessionQuiz.mode
		}
	}

	throw createError({
		statusCode: 503,
		statusMessage: 'Tidak menemukan kode sesi yang kosong. Coba lagi.'
	})
})
