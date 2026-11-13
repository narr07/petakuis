import type { QuestionType, QuizQuestion } from './types'

/**
 * Impor soal dari lembar Excel (templat "templat-soal-petakuis.xlsx").
 * Kolom dikenali dari judulnya, jadi urutan kolom boleh berbeda; baris kosong dilewati.
 */
export const QUIZ_IMPORT_HEADERS = [
	'No',
	'Jenis Soal',
	'Pertanyaan',
	'Pilihan A',
	'Pilihan B',
	'Pilihan C',
	'Pilihan D',
	'Kunci Jawaban',
	'Waktu (detik)',
	'Poin'
] as const

export const QUIZ_IMPORT_TYPE_LABELS: Record<QuestionType, string> = {
	multiple: 'Pilihan Ganda',
	ox: 'Benar / Salah',
	subjective: 'Isian Singkat'
}

/** Nilai sel apa pun dari pembaca Excel (teks, angka, tanggal, boolean, kosong). */
export type ImportCell = unknown

export interface QuizImportError {
	/** Nomor baris di Excel (dimulai dari 1). */
	row: number
	message: string
}

export interface QuizImportResult {
	questions: QuizQuestion[]
	errors: QuizImportError[]
}

type Field = 'no' | 'type' | 'prompt' | 'a' | 'b' | 'c' | 'd' | 'answer' | 'time' | 'points'

const OPTION_FIELDS = ['a', 'b', 'c', 'd'] as const

const DEFAULTS: Record<QuestionType, { timeLimitS: number, points: number }> = {
	multiple: { timeLimitS: 25, points: 100 },
	ox: { timeLimitS: 20, points: 100 },
	subjective: { timeLimitS: 30, points: 120 }
}

const MAX_PROMPT_LENGTH = 500
const MAX_OPTION_LENGTH = 200

function key(value: ImportCell): string {
	return text(value).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function text(value: ImportCell): string {
	if (value === null || value === undefined) return ''
	if (value instanceof Date) return value.toISOString().slice(0, 10)
	return String(value).replace(/\s+/g, ' ').trim()
}

function fieldOf(header: ImportCell): Field | null {
	const k = key(header)
	if (k === 'no' || k === 'nomor') return 'no'
	if (k.startsWith('jenis') || k === 'tipe' || k === 'tipesoal') return 'type'
	if (k === 'pertanyaan' || k === 'soal') return 'prompt'
	if (/^(pilihan|opsi)[abcd]$/.test(k)) return k.slice(-1) as Field
	if (k.startsWith('kunci') || k === 'jawaban') return 'answer'
	if (k.startsWith('waktu') || k.startsWith('durasi')) return 'time'
	if (k === 'poin' || k === 'skor' || k === 'nilai') return 'points'
	return null
}

/** Kolom bawaan bila baris judul tidak ditemukan (urutan templat). */
const TEMPLATE_COLUMNS: Field[] = ['no', 'type', 'prompt', 'a', 'b', 'c', 'd', 'answer', 'time', 'points']

function parseType(raw: string): QuestionType | null {
	const k = key(raw)
	if (!k) return null
	if (['pilihanganda', 'pg', 'multiple', 'ganda'].includes(k)) return 'multiple'
	if (['benarsalah', 'bs', 'ox', 'truefalse', 'bensal'].includes(k)) return 'ox'
	if (['isiansingkat', 'isian', 'singkat', 'esaisingkat', 'subjective'].includes(k)) return 'subjective'
	return null
}

function parseTruth(raw: string): 'o' | 'x' | null {
	const k = key(raw)
	if (['benar', 'b', 'o', 'true', 'ya', 'betul'].includes(k)) return 'o'
	if (['salah', 's', 'x', 'false', 'tidak'].includes(k)) return 'x'
	return null
}

function parseNumber(value: ImportCell, min: number, max: number, fallback: number): number {
	const n = typeof value === 'number' ? value : Number(text(value).replace(',', '.'))
	if (!Number.isFinite(n) || text(value) === '') return fallback
	return Math.min(max, Math.max(min, Math.round(n)))
}

export function parseQuizRows(
	rows: ReadonlyArray<ReadonlyArray<ImportCell>>,
	opts: { idPrefix?: string, startOrder?: number } = {}
): QuizImportResult {
	const idPrefix = opts.idPrefix ?? `xl-${Date.now()}`
	const startOrder = opts.startOrder ?? 1
	const questions: QuizQuestion[] = []
	const errors: QuizImportError[] = []

	// Cari baris judul (berisi kolom "Pertanyaan") di 10 baris pertama.
	let headerIndex = -1
	let columns: (Field | null)[] = TEMPLATE_COLUMNS
	for (let i = 0; i < Math.min(rows.length, 10); i++) {
		const mapped = (rows[i] ?? []).map(fieldOf)
		if (mapped.includes('prompt')) {
			headerIndex = i
			columns = mapped
			break
		}
	}

	for (let i = headerIndex + 1; i < rows.length; i++) {
		const rowNumber = i + 1
		const cells: Partial<Record<Field, ImportCell>> = {}
		;(rows[i] ?? []).forEach((value, col) => {
			const field = columns[col]
			if (field && cells[field] === undefined) cells[field] = value
		})

		// Baris tanpa isi selain nomor dianggap kosong.
		const filled = (Object.keys(cells) as Field[]).some(f => f !== 'no' && text(cells[f]) !== '')
		if (!filled) continue

		const prompt = text(cells.prompt).slice(0, MAX_PROMPT_LENGTH)
		const answerRaw = text(cells.answer)
		const optionTexts = OPTION_FIELDS.map(f => text(cells[f]).slice(0, MAX_OPTION_LENGTH))
		const typeRaw = text(cells.type)

		if (!prompt) {
			errors.push({ row: rowNumber, message: 'Kolom Pertanyaan kosong.' })
			continue
		}

		let type = parseType(typeRaw)
		if (typeRaw && !type) {
			errors.push({ row: rowNumber, message: `Jenis soal "${typeRaw}" tidak dikenali. Pakai Pilihan Ganda, Benar / Salah, atau Isian Singkat.` })
			continue
		}
		// Jenis kosong: tebak dari isi baris.
		if (!type) type = optionTexts.some(Boolean) ? 'multiple' : parseTruth(answerRaw) ? 'ox' : 'subjective'

		const base = {
			id: `${idPrefix}-${rowNumber}`,
			type,
			prompt,
			timeLimitS: parseNumber(cells.time, 5, 300, DEFAULTS[type].timeLimitS),
			points: parseNumber(cells.points, 10, 1000, DEFAULTS[type].points),
			order: startOrder + questions.length
		}

		if (type === 'multiple') {
			const options = OPTION_FIELDS
				.map((id, idx) => ({ id, text: optionTexts[idx]! }))
				.filter(o => o.text)
			if (options.length < 2) {
				errors.push({ row: rowNumber, message: 'Pilihan ganda butuh minimal 2 pilihan (Pilihan A dan B).' })
				continue
			}
			const letter = key(answerRaw)
			const byLetter = options.find(o => o.id === letter)
			const byText = options.find(o => o.text.toLowerCase() === answerRaw.toLowerCase())
			const correct = byLetter ?? byText
			if (!correct) {
				errors.push({
					row: rowNumber,
					message: answerRaw
						? `Kunci "${answerRaw}" tidak cocok dengan pilihan yang terisi. Tulis huruf A, B, C, atau D.`
						: 'Kunci Jawaban kosong. Tulis huruf A, B, C, atau D.'
				})
				continue
			}
			questions.push({ ...base, options, answer: [correct.id] })
		} else if (type === 'ox') {
			const truth = parseTruth(answerRaw)
			if (!truth) {
				errors.push({ row: rowNumber, message: 'Kunci benar/salah harus ditulis "Benar" atau "Salah".' })
				continue
			}
			questions.push({
				...base,
				options: [
					{ id: 'o', text: 'Benar' },
					{ id: 'x', text: 'Salah' }
				],
				answer: [truth]
			})
		} else {
			const answers = answerRaw.split(',').map(a => a.trim()).filter(Boolean)
			if (answers.length === 0) {
				errors.push({ row: rowNumber, message: 'Kunci Jawaban isian singkat kosong.' })
				continue
			}
			questions.push({ ...base, options: [], answer: answers })
		}
	}

	return { questions, errors }
}
