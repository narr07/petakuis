import { describe, expect, test } from 'bun:test'
import { AI_PROMPT_MAX_SOURCE, buildAiPrompt, parsePastedTable } from './aiPrompt'
import { parseQuizRows, QUIZ_IMPORT_HEADERS } from './quizImport'
import { evaluateAnswer } from './scoring'

const markdownAnswer = `Tentu! Berikut soalnya:

\`\`\`markdown
| No | Jenis Soal | Pertanyaan | Pilihan A | Pilihan B | Pilihan C | Pilihan D | Kunci Jawaban | Waktu (detik) | Poin |
|---:|:-----------|------------|-----------|-----------|-----------|-----------|:-------------:|---------------|------|
| 1 | **Pilihan Ganda** | Planet terbesar di tata surya adalah... | Merkurius | Jupiter | Mars | Venus | B | | |
| 2 | Benar / Salah | Matahari adalah sebuah bintang. | | | | | Benar | 20 | 100 |
| 3 | Isian Singkat | Planet tempat kita tinggal adalah... | | | | | Bumi, bumi | | |
| 4 | Pilihan Ganda | Planet yang dijuluki planet merah adalah... | Venus | Saturnus | Mars | Uranus | E | | |
\`\`\`

Semoga membantu!`

describe('prompt AI salin-tempel', () => {
	test('prompt memuat topik, jenjang, jumlah, dan kolom templat', () => {
		const prompt = buildAiPrompt({ topic: 'Tata surya', count: 8, schoolLevel: 'sd', gradeLabel: 'Kelas 6', subject: 'IPAS' })
		expect(prompt).toContain('Buat 8 soal')
		expect(prompt).toContain('siswa SD Kelas 6, mata pelajaran IPAS, tentang: Tata surya')
		expect(prompt).toContain(QUIZ_IMPORT_HEADERS.join(' | '))
		expect(prompt).toContain('"Pilihan Ganda", "Benar / Salah", "Isian Singkat"')
		expect(prompt).not.toContain('Gunakan materi berikut')
		expect(prompt).not.toMatch(/\n{3,}/)
	})

	test('materi sumber dipotong dan jumlah soal dibatasi', () => {
		const prompt = buildAiPrompt({ topic: 'X', count: 99, sourceText: 'm'.repeat(AI_PROMPT_MAX_SOURCE + 500) })
		expect(prompt).toContain('Buat 24 soal')
		expect(prompt).toContain('m'.repeat(AI_PROMPT_MAX_SOURCE))
		expect(prompt).not.toContain('m'.repeat(AI_PROMPT_MAX_SOURCE + 1))
	})

	test('tabel Markdown dari AI: teks pembuka, blok kode, pemisah, dan huruf tebal dibersihkan', () => {
		const rows = parsePastedTable(markdownAnswer)
		expect(rows).toHaveLength(5)
		expect(rows[0]).toEqual([...QUIZ_IMPORT_HEADERS])
		expect(rows[1]![1]).toBe('Pilihan Ganda')
		expect(rows[2]![7]).toBe('Benar')
	})

	test('hasil tempelan lolos pemeriksaan impor yang sama dengan Excel', () => {
		const { questions, errors } = parseQuizRows(parsePastedTable(markdownAnswer), { idPrefix: 'ai', startOrder: 1 })
		expect(questions.map(q => q.type)).toEqual(['multiple', 'ox', 'subjective'])
		expect(questions[0]!.answer).toEqual(['b'])
		expect(questions[1]!.answer).toEqual(['o'])
		for (const q of questions) expect(evaluateAnswer(q, q.answer)).toBe(true)
		// Soal no. 4 berkunci "E" ditolak, bukan ditebak.
		expect(errors).toHaveLength(1)
		expect(errors[0]!.row).toBe(5)
	})

	test('tabel yang disalin dari tampilan (dipisah tab) juga terbaca', () => {
		const tsv = [
			QUIZ_IMPORT_HEADERS.join('\t'),
			['1', 'Benar / Salah', 'Bumi berbentuk bulat.', '', '', '', '', 'Benar', '', ''].join('\t')
		].join('\r\n')
		const { questions, errors } = parseQuizRows(parsePastedTable(tsv))
		expect(errors).toEqual([])
		expect(questions).toHaveLength(1)
		expect(questions[0]!.answer).toEqual(['o'])
	})

	test('teks tanpa tabel menghasilkan kosong', () => {
		expect(parsePastedTable('Maaf, saya tidak bisa membantu.')).toEqual([])
		expect(parsePastedTable('')).toEqual([])
	})
})
