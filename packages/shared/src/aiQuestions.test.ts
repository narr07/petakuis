import { describe, expect, test } from 'bun:test'
import { normalizeAiQuestions } from './aiQuestions'
import { evaluateAnswer } from './scoring'

const pg = {
	type: 'multiple',
	prompt: 'Planet terbesar di tata surya adalah...',
	hint: 'Planet gas raksasa',
	options: ['Merkurius', 'Jupiter', 'Mars', 'Venus'],
	answer: ['b']
}

describe('soal buatan AI', () => {
	test('ketiga jenis soal valid diubah ke bentuk kuis dan kuncinya dinilai benar', () => {
		const { questions, dropped } = normalizeAiQuestions([
			pg,
			{ type: 'ox', prompt: 'Matahari adalah bintang.', options: [], answer: ['Benar'] },
			{ type: 'subjective', prompt: 'Ibu kota Indonesia adalah...', options: [], answer: ['Jakarta', 'jakarta', 'DKI Jakarta'] }
		], { idPrefix: 'ai-t', startOrder: 4 })

		expect(dropped).toBe(0)
		expect(questions.map(q => q.type)).toEqual(['multiple', 'ox', 'subjective'])
		expect(questions[0]).toMatchObject({ id: 'ai-t-1', answer: ['b'], order: 4, hint: { type: 'text', value: 'Planet gas raksasa' } })
		expect(questions[0]!.options.map(o => o.id)).toEqual(['a', 'b', 'c', 'd'])
		expect(questions[1]).toMatchObject({ answer: ['o'], options: [{ id: 'o', text: 'Benar' }, { id: 'x', text: 'Salah' }] })
		expect(questions[2]!.answer).toEqual(['Jakarta', 'jakarta', 'DKI Jakarta'])

		for (const q of questions) {
			expect(evaluateAnswer(q, q.answer)).toBe(true)
		}
		expect(evaluateAnswer(questions[0]!, ['a'])).toBe(false)
		expect(evaluateAnswer(questions[1]!, ['x'])).toBe(false)
	})

	test('kunci pilihan ganda boleh berupa "B." atau teks pilihannya', () => {
		const { questions } = normalizeAiQuestions([
			{ ...pg, answer: ['B.'] },
			{ ...pg, answer: ['jupiter'] }
		], { idPrefix: 'x' })
		expect(questions.map(q => q.answer)).toEqual([['b'], ['b']])
	})

	test('soal tidak valid dibuang, bukan ditebak', () => {
		const { questions, dropped } = normalizeAiQuestions([
			{ ...pg, answer: [] }, // tanpa kunci
			{ ...pg, answer: ['a', 'b'] }, // dua kunci
			{ ...pg, answer: ['e'] }, // huruf di luar a-d
			{ ...pg, options: ['Merkurius', 'Jupiter', 'Mars'] }, // hanya 3 pilihan
			{ ...pg, options: ['Mars', 'Jupiter', 'mars', 'Venus'] }, // pilihan kembar
			{ ...pg, prompt: '   ' }, // soal kosong
			{ type: 'ox', prompt: 'Bumi datar.', options: [], answer: ['mungkin'] },
			{ type: 'subjective', prompt: 'Sebutkan...', options: [], answer: [''] },
			{ type: 'esai', prompt: 'Jelaskan...', options: [], answer: ['x'] },
			null,
			'teks lepas',
			pg
		], { idPrefix: 'x' })
		expect(dropped).toBe(11)
		expect(questions).toHaveLength(1)
		expect(questions[0]!.id).toBe('x-1')
	})

	test('jumlah soal dibatasi dan keluaran bukan array menghasilkan kosong', () => {
		const many = Array.from({ length: 8 }, () => pg)
		const limited = normalizeAiQuestions(many, { idPrefix: 'x', limit: 3 })
		expect(limited.questions).toHaveLength(3)
		expect(limited.dropped).toBe(0)

		expect(normalizeAiQuestions({ soal: [] }, { idPrefix: 'x' })).toEqual({ questions: [], dropped: 0 })
	})

	test('teks yang terlalu panjang dipotong', () => {
		const { questions } = normalizeAiQuestions([{ ...pg, prompt: 'a'.repeat(900), hint: 'b'.repeat(900) }], { idPrefix: 'x' })
		expect(questions[0]!.prompt).toHaveLength(500)
		expect(questions[0]!.hint?.value).toHaveLength(200)
	})
})
