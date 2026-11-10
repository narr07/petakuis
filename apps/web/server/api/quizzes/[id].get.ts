import { getQuizById } from '../../utils/store'

export default defineEventHandler((event) => {
	const id = getRouterParam(event, 'id') || ''
	const quiz = getQuizById(id)
	if (!quiz) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kuis tidak ditemukan.'
		})
	}
	return { quiz }
})
