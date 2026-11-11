import type { QuizDefinition } from '@petakuis/shared'
import { getQuizRecord, updateQuiz } from '../../utils/store'

/** Mengubah kuis. Hanya pemilik kuis atau admin. */
export default defineEventHandler(async (event) => {
	const current = await requireUser(event, ['teacher', 'admin'])
	const id = getRouterParam(event, 'id') || ''
	const record = await getQuizRecord(id)
	if (!record) {
		throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
	}
	if (!canManageQuiz(current, record.ownerId)) {
		throw createError({ statusCode: 403, statusMessage: 'Kamu hanya bisa mengubah kuis milikmu sendiri.' })
	}

	const input = normalizeQuizInput(await readBody<Partial<QuizDefinition>>(event))
	const quiz = await updateQuiz(id, input)
	return { ok: true, quiz }
})
