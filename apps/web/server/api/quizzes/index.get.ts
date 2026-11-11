import { listQuizzes } from '../../utils/store'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const filters = {
		schoolLevel: query.schoolLevel ? String(query.schoolLevel) : undefined,
		subject: query.subject ? String(query.subject) : undefined,
		search: query.q ? String(query.q) : undefined
	}

	// ?mine=1: kuis milik guru yang masuk (admin melihat semua), utuh dengan kunci jawaban.
	if (query.mine) {
		const current = await requireUser(event, ['teacher', 'admin'])
		return {
			quizzes: await listQuizzes({
				...filters,
				ownerId: current.role === 'admin' ? undefined : current.id
			})
		}
	}

	// Daftar publik: hanya kuis publik, tanpa kunci jawaban.
	const quizzes = await listQuizzes({ ...filters, visibility: 'public' })
	return { quizzes: quizzes.map(publicQuiz) }
})
