import type { QuizQuestion } from './types'

/**
 * Soal buatan AI (Gemini). Model diminta mengikuti `AI_QUESTION_JSON_SCHEMA` (structured output),
 * lalu setiap soal tetap diperiksa `normalizeAiQuestions`: soal yang tidak lengkap atau kuncinya
 * tidak jelas dibuang, bukan ditebak. Lebih baik soal lebih sedikit daripada kunci jawaban salah.
 */

/** Skema JSON keluaran AI (dikirim sebagai `responseJsonSchema`). */
export const AI_QUESTION_JSON_SCHEMA = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			type: { type: 'string', enum: ['multiple', 'ox', 'subjective'] },
			prompt: { type: 'string', description: 'Teks soal' },
			hint: { type: 'string', description: 'Petunjuk singkat tanpa membocorkan jawaban' },
			options: {
				type: 'array',
				items: { type: 'string' },
				description: 'Pilihan ganda: tepat 4 teks pilihan (A, B, C, D). Jenis lain: kosong.'
			},
			answer: {
				type: 'array',
				items: { type: 'string' },
				description: 'Pilihan ganda: satu huruf a/b/c/d. Benar/salah: "benar" atau "salah". Isian: 1-3 kata kunci jawaban.'
			}
		},
		required: ['type', 'prompt', 'options', 'answer']
	}
} as const

const LETTERS = ['a', 'b', 'c', 'd'] as const
const MAX_PROMPT = 500
const MAX_OPTION = 200
const MAX_HINT = 200
const MAX_KEYWORD = 60

export interface AiQuestionsResult {
	questions: QuizQuestion[]
	/** Jumlah soal dari AI yang dibuang karena tidak valid. */
	dropped: number
}

function text(value: unknown, max: number): string {
	return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function texts(value: unknown, max: number): string[] {
	return Array.isArray(value) ? value.map(v => text(v, max)).filter(Boolean) : []
}

/** Kunci pilihan ganda: huruf a-d, "A.", atau teks pilihan yang persis sama. */
function multipleAnswer(raw: string[], options: string[]): string | null {
	const found = new Set<string>()
	for (const item of raw) {
		const letter = item.toLowerCase().replace(/[.)\s]/g, '')
		if ((LETTERS as readonly string[]).includes(letter)) {
			found.add(letter)
			continue
		}
		const idx = options.findIndex(o => o.toLowerCase() === item.toLowerCase())
		if (idx >= 0) found.add(LETTERS[idx]!)
	}
	return found.size === 1 ? [...found][0]! : null
}

function oxAnswer(raw: string[]): 'o' | 'x' | null {
	const value = (raw[0] || '').toLowerCase()
	if (['benar', 'b', 'o', 'true', 'ya'].includes(value)) return 'o'
	if (['salah', 's', 'x', 'false', 'tidak'].includes(value)) return 'x'
	return null
}

export function normalizeAiQuestions(
	raw: unknown,
	opts: { idPrefix: string, startOrder?: number, limit?: number }
): AiQuestionsResult {
	const items = Array.isArray(raw) ? raw : []
	const limit = opts.limit ?? items.length
	const questions: QuizQuestion[] = []
	let dropped = 0

	for (const item of items) {
		if (questions.length >= limit) break
		const q = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
		const prompt = text(q.prompt, MAX_PROMPT)
		const hintText = text(q.hint, MAX_HINT)
		const answers = texts(q.answer, MAX_KEYWORD)
		const base = {
			id: `${opts.idPrefix}-${questions.length + 1}`,
			prompt,
			hint: hintText ? { type: 'text' as const, value: hintText } : undefined,
			ignoreSpaces: true,
			points: 100,
			order: (opts.startOrder ?? 1) + questions.length
		}

		let question: QuizQuestion | null = null
		if (prompt && q.type === 'multiple') {
			const options = texts(q.options, MAX_OPTION)
			const unique = new Set(options.map(o => o.toLowerCase())).size === options.length
			const answer = options.length === 4 && unique ? multipleAnswer(answers, options) : null
			if (answer) {
				question = {
					...base,
					type: 'multiple',
					options: options.map((o, i) => ({ id: LETTERS[i]!, text: o })),
					answer: [answer],
					timeLimitS: 30
				}
			}
		} else if (prompt && q.type === 'ox') {
			const answer = oxAnswer(answers)
			if (answer) {
				question = {
					...base,
					type: 'ox',
					options: [{ id: 'o', text: 'Benar' }, { id: 'x', text: 'Salah' }],
					answer: [answer],
					timeLimitS: 20
				}
			}
		} else if (prompt && q.type === 'subjective') {
			const keywords = [...new Set(answers)].slice(0, 5)
			if (keywords.length > 0) {
				question = { ...base, type: 'subjective', options: [], answer: keywords, timeLimitS: 40 }
			}
		}

		if (question) questions.push(question)
		else dropped++
	}

	// Soal yang tidak sempat diperiksa karena batas jumlah tidak dihitung sebagai dibuang.
	return { questions, dropped }
}
