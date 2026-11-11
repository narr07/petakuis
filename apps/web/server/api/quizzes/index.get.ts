import { listQuizzes } from '../../utils/store'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	// ?mine=1: kuis milik guru yang masuk (admin melihat semua) untuk dashboard.
	let ownerId: string | undefined
	if (query.mine) {
		const current = await requireUser(event, ['teacher', 'admin'])
		ownerId = current.role === 'admin' ? undefined : current.id
	}
	return {
		quizzes: await listQuizzes({
			ownerId,
			schoolLevel: query.schoolLevel ? String(query.schoolLevel) : undefined,
			subject: query.subject ? String(query.subject) : undefined,
			search: query.q ? String(query.q) : undefined
		})
	}
})
