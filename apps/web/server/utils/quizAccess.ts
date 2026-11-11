import { NPC_CHARACTERS, type QuizDefinition, type QuizQuestion } from '@petakuis/shared'
import type { CurrentUser } from './auth'

/** Bidang kuis yang boleh diisi guru (id, pemilik, dan waktu diatur server). */
export type QuizInput = Omit<QuizDefinition, 'id' | 'ownerName' | 'createdAt' | 'updatedAt'>

/** Memeriksa dan merapikan isi formulir kuis dari klien. Melempar 400 bila tidak lengkap. */
export function normalizeQuizInput(body: Partial<QuizDefinition>): QuizInput {
	if (!body.title?.trim() || !Array.isArray(body.questions) || body.questions.length === 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Judul kuis dan minimal 1 pertanyaan wajib diisi.'
		})
	}
	if (body.questions.some(q => typeof q?.prompt !== 'string' || !q.prompt.trim())) {
		throw createError({ statusCode: 400, statusMessage: 'Setiap pertanyaan wajib diisi.' })
	}

	return {
		title: body.title.trim(),
		description: (body.description || '').trim(),
		schoolLevel: body.schoolLevel || 'sd',
		gradeLabel: body.gradeLabel || 'Kelas 5',
		subject: body.subject || 'IPA (Sains)',
		visibility: body.visibility === 'private' ? 'private' : 'public',
		mapId: body.mapId || 'map-pesisir-karang',
		mode: body.mode === 'linear' ? 'linear' : 'free',
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
			prompt: q.prompt.trim(),
			imageUrl: q.imageUrl,
			hint: q.hint,
			options: q.options || [],
			answer: q.answer || ['a'],
			isMultipleAnswer: Boolean(q.isMultipleAnswer),
			ignoreSpaces: q.ignoreSpaces ?? true,
			timeLimitS: Number(q.timeLimitS) || 30,
			points: Number(q.points) || 100,
			order: idx + 1,
			npcId: NPC_CHARACTERS.some(c => c.id === q.npcId) ? q.npcId : undefined,
			placement:
				q.placement
				&& Number.isInteger(q.placement.tileX)
				&& Number.isInteger(q.placement.tileY)
					? { tileX: q.placement.tileX, tileY: q.placement.tileY }
					: undefined
		}))
	}
}

/** Admin boleh mengelola semua kuis; guru hanya kuis miliknya. Kuis contoh (tanpa pemilik) hanya admin. */
export function canManageQuiz(current: CurrentUser | null, ownerId: string | null): boolean {
	if (!current) return false
	if (current.role === 'admin') return true
	return current.role === 'teacher' && ownerId !== null && ownerId === current.id
}

/**
 * Versi kuis untuk publik: kunci jawaban dikosongkan. Penilaian tetap di game server, yang
 * menerima kuis utuh langsung dari server web, bukan dari browser.
 */
export function publicQuiz(quiz: QuizDefinition): QuizDefinition {
	return {
		...quiz,
		questions: quiz.questions.map((q): QuizQuestion => ({ ...q, answer: [] }))
	}
}
