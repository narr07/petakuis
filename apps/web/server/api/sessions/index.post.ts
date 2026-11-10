import type { GameMode } from '@petakuis/shared'
import { getQuizById } from '../../utils/store'

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const body = await readBody<{
		quizId: string
		mode?: GameMode
		mapId?: string
		autoStart?: boolean
	}>(event)

	const quiz = getQuizById(body.quizId)
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

	const code = String(Math.floor(100000 + Math.random() * 900000))
	const hostToken = 'ht_' + Math.random().toString(36).slice(2, 14)

	try {
		await fetch(`${config.gameServerInternalUrl}/rooms`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				code,
				quiz: sessionQuiz,
				hostToken,
				autoStart: Boolean(body.autoStart)
			})
		})
	} catch (err) {
		throw createError({
			statusCode: 503,
			statusMessage: `Gagal menghubungi Game Server (${config.gameServerInternalUrl}): ${String(err)}`
		})
	}

	return {
		ok: true,
		code,
		hostToken,
		quizTitle: sessionQuiz.title,
		mode: sessionQuiz.mode
	}
})
