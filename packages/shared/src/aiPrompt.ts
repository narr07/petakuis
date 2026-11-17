import { QUIZ_IMPORT_HEADERS, QUIZ_IMPORT_TYPE_LABELS } from './quizImport'

/**
 * Buat soal dengan AI tanpa kunci API: guru menyalin prompt ini ke layanan AI pilihannya
 * (ChatGPT, Gemini, dll.), lalu menempel tabel hasilnya kembali. Tabel memakai kolom yang
 * sama dengan templat Excel, sehingga diperiksa oleh `parseQuizRows` yang sama.
 */

export interface AiPromptInput {
	topic: string
	count: number
	schoolLevel?: string
	gradeLabel?: string
	subject?: string
	/** Cuplikan materi dari buku ajar (opsional). */
	sourceText?: string
}

export const AI_PROMPT_MAX_SOURCE = 4000

export function buildAiPrompt(input: AiPromptInput): string {
	const count = Math.min(24, Math.max(1, Math.floor(input.count) || 10))
	const level = (input.schoolLevel || 'sd').toUpperCase()
	const grade = input.gradeLabel ? ` ${input.gradeLabel}` : ''
	const subject = input.subject || 'umum'
	const source = (input.sourceText || '').trim().slice(0, AI_PROMPT_MAX_SOURCE)
	const types = Object.values(QUIZ_IMPORT_TYPE_LABELS).map(t => `"${t}"`).join(', ')

	return [
		`Kamu guru ${level} di Indonesia. Buat ${count} soal kuis berbahasa Indonesia untuk siswa ${level}${grade}, mata pelajaran ${subject}, tentang: ${input.topic.trim()}.`,
		source ? `\nGunakan materi berikut sebagai sumber utama:\n"""\n${source}\n"""` : '',
		'',
		'Aturan isi:',
		'- Fakta harus benar dan sesuai Kurikulum Merdeka untuk jenjang itu; bahasa sederhana sesuai usia siswa.',
		'- Sebagian besar Pilihan Ganda, beberapa Benar / Salah, sedikit Isian Singkat.',
		'- Pilihan Ganda: 4 pilihan berbeda, tepat satu yang benar, pengecoh masuk akal, tanpa pilihan "semua benar" atau "semua salah".',
		'- Benar / Salah: pernyataan yang jelas benar atau jelas salah.',
		'- Isian Singkat: jawabannya satu sampai tiga kata.',
		'',
		'Aturan format (wajib, supaya bisa diimpor otomatis):',
		'- Jawab HANYA dengan satu tabel Markdown, tanpa kalimat pembuka atau penutup.',
		`- Kolom tabel persis: ${QUIZ_IMPORT_HEADERS.join(' | ')}`,
		`- Jenis Soal diisi salah satu dari: ${types}.`,
		'- Pilihan A sampai D hanya diisi untuk Pilihan Ganda; kosongkan untuk jenis lain.',
		'- Kunci Jawaban: huruf A/B/C/D untuk Pilihan Ganda, "Benar" atau "Salah" untuk Benar / Salah, dan untuk Isian Singkat tulis jawaban yang diterima dipisah koma (misalnya: Jakarta, DKI Jakarta).',
		'- Waktu (detik) dan Poin boleh dikosongkan.',
		'- Jangan memakai karakter | di dalam isi sel.'
	].join('\n').replace(/\n{3,}/g, '\n\n')
}

function cleanCell(cell: string): string {
	return cell
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/\*\*|__|`/g, '')
		.trim()
}

/**
 * Membaca tabel yang ditempel dari layanan AI: tabel Markdown (`| a | b |`, baris pemisah
 * `|---|` dilewati, kalimat di luar tabel diabaikan) atau tabel yang disalin dari tampilan
 * (kolom dipisah tab). Mengembalikan baris-baris sel untuk `parseQuizRows`.
 */
export function parsePastedTable(text: string): string[][] {
	const lines = text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.filter(line => !/^\s*```/.test(line))
		.filter(line => line.trim() !== '')

	const pipeLines = lines.filter(line => (line.match(/\|/g) || []).length >= 2)
	if (pipeLines.length > 0) {
		return pipeLines
			.map(line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cleanCell))
			.filter(cells => !cells.every(cell => /^:?-{2,}:?$/.test(cell)))
	}

	if (lines.some(line => line.includes('\t'))) {
		return lines.map(line => line.split('\t').map(cleanCell))
	}

	return []
}
