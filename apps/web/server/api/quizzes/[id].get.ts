import { getQuizById } from '../../utils/store'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id') || ''
	const quiz = await getQuizById(id)
	if (!quiz) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kuis tidak ditemukan.'
		})
	}
	return { quiz }
})
