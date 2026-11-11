import { randomUUID } from 'node:crypto'
import type { QuizDefinition } from '@petakuis/shared'
import { createQuiz } from '../../utils/store'

export default defineEventHandler(async (event) => {
	const current = await requireUser(event, ['teacher', 'admin'])
	const input = normalizeQuizInput(await readBody<Partial<QuizDefinition>>(event))

	const now = new Date().toISOString()
	const quiz: QuizDefinition = {
		...input,
		// ID selalu dibuat server: id dari klien bisa dipakai menimpa kuis orang lain.
		id: 'quiz-' + randomUUID(),
		ownerName: current.name,
		createdAt: now,
		updatedAt: now
	}

	await createQuiz(quiz, current.id)
	return {
		ok: true,
		quiz
	}
})
