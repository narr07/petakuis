import { getQuizRecord } from '../../utils/store'

/**
 * Detail kuis. Pemilik dan admin menerima kuis utuh (untuk diedit); pengunjung lain hanya
 * kuis publik tanpa kunci jawaban. Kuis privat milik orang lain dianggap tidak ada.
 */
export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id') || ''
	const record = await getQuizRecord(id)
	const current = record ? await getCurrentUser(event) : null
	const canManage = record ? canManageQuiz(current, record.ownerId) : false

	if (!record || (!canManage && record.quiz.visibility !== 'public')) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kuis tidak ditemukan.'
		})
	}
	return {
		quiz: canManage ? record.quiz : publicQuiz(record.quiz),
		canManage
	}
})
