import { randomUUID } from 'node:crypto'
import { NPC_CHARACTERS, type QuizDefinition } from '@petakuis/shared'
import { createQuiz } from '../../utils/store'

export default defineEventHandler(async (event) => {
	const body = await readBody<Partial<QuizDefinition>>(event)

	if (!body.title || !body.questions || body.questions.length === 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Judul kuis dan minimal 1 pertanyaan wajib diisi.'
		})
	}

	const now = new Date().toISOString()
	// ID selalu dibuat server: id dari klien bisa dipakai menimpa kuis orang lain.
	const id = 'quiz-' + randomUUID()

	const quiz: QuizDefinition = {
		id,
		ownerName: body.ownerName || 'Guru Petakuis',
		title: body.title.trim(),
		description: (body.description || '').trim(),
		schoolLevel: body.schoolLevel || 'sd',
		gradeLabel: body.gradeLabel || 'Kelas 5',
		subject: body.subject || 'IPA (Sains)',
		visibility: body.visibility || 'public',
		mapId: body.mapId || 'map-pesisir-karang',
		mode: body.mode || 'free',
		settings: body.settings || {
			isAllowPass: true,
			showIncorrectAnswer: true,
			answerRevealMode: 'always',
			shuffleQuestions: true,
			shuffleOptions: false
		},
		questions: body.questions.map((q, idx) => ({
			id: q.id || `q-${idx + 1}`,
			type: q.type || 'multiple',
			prompt: q.prompt,
			imageUrl: q.imageUrl,
			hint: q.hint,
			options: q.options || [],
			answer: q.answer || ['a'],
			isMultipleAnswer: Boolean(q.isMultipleAnswer),
			ignoreSpaces: q.ignoreSpaces ?? true,
			timeLimitS: Number(q.timeLimitS) || 30,
			points: Number(q.points) || 100,
			order: idx + 1,
			npcId: NPC_CHARACTERS.some((c) => c.id === q.npcId) ? q.npcId : undefined,
			placement:
				q.placement &&
				Number.isInteger(q.placement.tileX) &&
				Number.isInteger(q.placement.tileY)
					? { tileX: q.placement.tileX, tileY: q.placement.tileY }
					: undefined
		})),
		createdAt: now,
		updatedAt: now
	}

	await createQuiz(quiz)
	return {
		ok: true,
		quiz
	}
})
