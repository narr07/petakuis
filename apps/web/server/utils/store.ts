import {
	MAP_CATALOG,
	STARTER_QUIZZES,
	type MapTemplate,
	type QuizDefinition
} from '@petakuis/shared'

const quizzesMemory = new Map<string, QuizDefinition>()

for (const starter of STARTER_QUIZZES) {
	quizzesMemory.set(starter.id, structuredClone(starter))
}

export function listAllMaps(): MapTemplate[] {
	return MAP_CATALOG
}

export function listQuizzes(filters?: {
	schoolLevel?: string
	subject?: string
	search?: string
}): QuizDefinition[] {
	let items = Array.from(quizzesMemory.values())

	if (filters?.schoolLevel && filters.schoolLevel !== 'all') {
		items = items.filter((q) => q.schoolLevel === filters.schoolLevel)
	}
	if (filters?.subject && filters.subject !== 'all') {
		items = items.filter((q) => q.subject === filters.subject)
	}
	if (filters?.search) {
		const qLower = filters.search.toLowerCase()
		items = items.filter(
			(q) =>
				q.title.toLowerCase().includes(qLower) ||
				q.description.toLowerCase().includes(qLower) ||
				q.subject.toLowerCase().includes(qLower)
		)
	}

	return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getQuizById(id: string): QuizDefinition | undefined {
	return quizzesMemory.get(id)
}

export function saveQuiz(quiz: QuizDefinition): QuizDefinition {
	quizzesMemory.set(quiz.id, quiz)
	return quiz
}
