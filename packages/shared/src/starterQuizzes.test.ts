import { describe, expect, test } from 'bun:test'
import { INDONESIAN_SUBJECTS, MAP_CATALOG, SCHOOL_LEVEL_OPTIONS, STARTER_QUIZZES } from './maps'
import { evaluateAnswer } from './scoring'

describe('kuis contoh', () => {
	test('id kuis unik', () => {
		const ids = STARTER_QUIZZES.map(q => q.id)
		expect(new Set(ids).size).toBe(ids.length)
	})

	for (const quiz of STARTER_QUIZZES) {
		test(`${quiz.id}: metadata valid`, () => {
			expect(MAP_CATALOG.some(m => m.id === quiz.mapId)).toBe(true)
			expect(INDONESIAN_SUBJECTS as readonly string[]).toContain(quiz.subject)
			const level = SCHOOL_LEVEL_OPTIONS.find(l => l.id === quiz.schoolLevel)
			expect(level?.grades as readonly string[] | undefined).toContain(quiz.gradeLabel)
			expect(quiz.questions.length).toBeGreaterThanOrEqual(4)
			const qids = quiz.questions.map(q => q.id)
			expect(new Set(qids).size).toBe(qids.length)
		})

		test(`${quiz.id}: kunci jawaban dinilai benar`, () => {
			for (const q of quiz.questions) {
				expect(q.prompt.trim().length).toBeGreaterThan(0)
				expect(q.answer.length).toBeGreaterThan(0)
				if (q.type === 'subjective') {
					for (const accepted of q.answer) expect(evaluateAnswer(q, [accepted])).toBe(true)
					expect(evaluateAnswer(q, ['jawaban-yang-salah'])).toBe(false)
				} else {
					const optionIds = q.options.map(o => o.id)
					expect(optionIds).toContain(q.answer[0]!)
					expect(evaluateAnswer(q, [q.answer[0]!])).toBe(true)
					const wrong = optionIds.find(id => id !== q.answer[0])!
					expect(evaluateAnswer(q, [wrong])).toBe(false)
				}
			}
		})
	}
})
