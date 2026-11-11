import { listQuizzes } from '../../utils/store'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	return {
		quizzes: await listQuizzes({
			schoolLevel: query.schoolLevel ? String(query.schoolLevel) : undefined,
			subject: query.subject ? String(query.subject) : undefined,
			search: query.q ? String(query.q) : undefined
		})
	}
})
