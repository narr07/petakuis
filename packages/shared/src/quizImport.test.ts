import { describe, expect, test } from 'bun:test'
import { parseQuizRows, QUIZ_IMPORT_HEADERS } from './quizImport'

const header = [...QUIZ_IMPORT_HEADERS]

describe('impor soal dari Excel', () => {
	test('membaca ketiga jenis soal dari templat dan melewati baris kosong bernomor', () => {
		const { questions, errors } = parseQuizRows([
			header,
			[1, 'Pilihan Ganda', 'Hewan pemakan tumbuhan disebut...', 'Herbivora', 'Karnivora', 'Omnivora', 'Insektivora', 'a', 25, 100],
			[2, 'Benar / Salah', 'Matahari adalah bintang.', null, null, null, null, 'Benar', null, null],
			[3, 'Isian Singkat', 'Planet terbesar adalah...', null, null, null, null, 'Jupiter, Yupiter', 40, 150],
			[4, null, null, null, null, null, null, null, null, null]
		], { idPrefix: 't', startOrder: 3 })

		expect(errors).toEqual([])
		expect(questions).toHaveLength(3)
		expect(questions[0]).toMatchObject({ type: 'multiple', answer: ['a'], timeLimitS: 25, order: 3 })
		expect(questions[0]!.options).toHaveLength(4)
		expect(questions[1]).toMatchObject({ type: 'ox', answer: ['o'], timeLimitS: 20, points: 100 })
		expect(questions[2]).toMatchObject({ type: 'subjective', answer: ['Jupiter', 'Yupiter'], timeLimitS: 40, points: 150, order: 5 })
	})

	test('kunci pilihan ganda boleh berupa teks pilihan, dan pilihan C/D boleh kosong', () => {
		const { questions, errors } = parseQuizRows([
			header,
			[1, 'PG', '2 + 2 = ...', '3', '4', null, null, '4', null, null]
		])
		expect(errors).toEqual([])
		expect(questions[0]!.options.map(o => o.id)).toEqual(['a', 'b'])
		expect(questions[0]!.answer).toEqual(['b'])
	})

	test('melaporkan baris bermasalah dengan nomor baris Excel', () => {
		const { questions, errors } = parseQuizRows([
			header,
			[1, 'Pilihan Ganda', 'Tanpa kunci', 'X', 'Y', null, null, null, null, null],
			[2, 'Benar / Salah', 'Kunci aneh', null, null, null, null, 'Mungkin', null, null],
			[3, 'Esai Panjang', 'Jenis aneh', null, null, null, null, 'x', null, null],
			[4, 'Isian Singkat', null, null, null, null, null, 'jawab', null, null]
		])
		expect(questions).toHaveLength(0)
		expect(errors.map(e => e.row)).toEqual([2, 3, 4, 5])
	})

	test('mengenali kolom dari judulnya walau urutannya berbeda', () => {
		const { questions } = parseQuizRows([
			['Pertanyaan', 'Kunci Jawaban', 'Jenis Soal'],
			['Ibu kota Jawa Barat?', 'Bandung', 'Isian Singkat']
		])
		expect(questions[0]).toMatchObject({ prompt: 'Ibu kota Jawa Barat?', answer: ['Bandung'], type: 'subjective' })
	})
})
