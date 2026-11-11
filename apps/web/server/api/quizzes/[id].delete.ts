import { deleteQuiz, getQuizRecord } from '../../utils/store'

/** Menghapus kuis. Hanya pemilik kuis atau admin. Laporan sesi yang sudah berjalan tetap tersimpan. */
export default defineEventHandler(async (event) => {
	const current = await requireUser(event, ['teacher', 'admin'])
	const id = getRouterParam(event, 'id') || ''
	const record = await getQuizRecord(id)
	if (!record) {
		throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
	}
	if (!canManageQuiz(current, record.ownerId)) {
		throw createError({ statusCode: 403, statusMessage: 'Kamu hanya bisa menghapus kuis milikmu sendiri.' })
	}

	await deleteQuiz(id)
	return { ok: true }
})
