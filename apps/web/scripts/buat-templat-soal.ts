/**
 * Membuat templat Excel untuk impor soal: public/templat/templat-soal-petakuis.xlsx
 *   bun run templat:soal   (dari folder apps/web)
 * Lembar "Soal" berisi 24 baris bernomor dengan daftar pilihan, lembar "Petunjuk" berisi
 * aturan pengisian dan contoh. Jalankan ulang bila kolom di quizImport.ts berubah.
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'
import { GAME_CONSTANTS, QUIZ_IMPORT_HEADERS, QUIZ_IMPORT_TYPE_LABELS } from '@petakuis/shared'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'templat', 'templat-soal-petakuis.xlsx')
const MAX = GAME_CONSTANTS.MAX_QUESTIONS_PER_QUIZ
const TYPES = Object.values(QUIZ_IMPORT_TYPE_LABELS)

const BLUE = 'FF2563EB'
const GRAY = 'FFE4E4E7'
const thin = { style: 'thin' as const, color: { argb: GRAY } }
const border = { top: thin, left: thin, bottom: thin, right: thin }

const wb = new ExcelJS.Workbook()
wb.creator = 'Petakuis'
wb.created = new Date('2026-01-01T00:00:00Z')

// ---------------------------------------------------------------- Lembar Soal
const sheet = wb.addWorksheet('Soal', { views: [{ state: 'frozen', ySplit: 1 }] })
sheet.columns = [
	{ width: 6 },
	{ width: 18 },
	{ width: 52 },
	{ width: 20 },
	{ width: 20 },
	{ width: 20 },
	{ width: 20 },
	{ width: 22 },
	{ width: 14 },
	{ width: 9 }
]

const headerRow = sheet.addRow([...QUIZ_IMPORT_HEADERS])
headerRow.height = 24
headerRow.eachCell((cell) => {
	cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
	cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
	cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
	cell.border = border
})

for (let i = 1; i <= MAX; i++) {
	const row = sheet.addRow([i])
	row.height = 20
	for (let c = 1; c <= QUIZ_IMPORT_HEADERS.length; c++) {
		const cell = row.getCell(c)
		cell.border = border
		cell.alignment = { vertical: 'middle', wrapText: c === 3 }
	}
	row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
	row.getCell(1).font = { color: { argb: 'FF71717A' } }

	const r = row.number
	sheet.getCell(`B${r}`).dataValidation = {
		type: 'list',
		allowBlank: true,
		formulae: [`"${TYPES.join(',')}"`],
		showErrorMessage: true,
		errorTitle: 'Jenis soal',
		error: `Pilih salah satu: ${TYPES.join(', ')}.`
	}
	sheet.getCell(`I${r}`).dataValidation = {
		type: 'whole',
		operator: 'between',
		allowBlank: true,
		formulae: [5, 300],
		showErrorMessage: true,
		errorTitle: 'Waktu (detik)',
		error: 'Isi angka 5 sampai 300, atau kosongkan.'
	}
	sheet.getCell(`J${r}`).dataValidation = {
		type: 'whole',
		operator: 'between',
		allowBlank: true,
		formulae: [10, 1000],
		showErrorMessage: true,
		errorTitle: 'Poin',
		error: 'Isi angka 10 sampai 1000, atau kosongkan.'
	}
}

// Petunjuk singkat saat sel judul dipilih.
const notes: Record<string, string> = {
	B1: 'Pilih dari daftar: Pilihan Ganda, Benar / Salah, atau Isian Singkat.',
	C1: 'Wajib diisi. Kalimat pertanyaan.',
	D1: 'Pilihan Ganda: Pilihan A dan B wajib, C dan D boleh kosong. Jenis lain: kosongkan.',
	H1: 'Pilihan Ganda: huruf A/B/C/D. Benar / Salah: tulis Benar atau Salah. Isian Singkat: jawabannya, pisahkan jawaban lain yang juga benar dengan koma.',
	I1: 'Opsional. Kosongkan untuk memakai waktu bawaan.',
	J1: 'Opsional. Kosongkan untuk memakai poin bawaan.'
}
for (const [addr, note] of Object.entries(notes)) sheet.getCell(addr).note = note

// ---------------------------------------------------------------- Lembar Petunjuk
const guide = wb.addWorksheet('Petunjuk')
guide.columns = [{ width: 22 }, { width: 90 }]

const title = guide.addRow(['Cara mengisi templat soal Petakuis'])
title.font = { bold: true, size: 14, color: { argb: BLUE } }
guide.addRow([])
guide.addRow(['1.', `Isi soal di lembar "Soal", satu baris untuk satu soal. Maksimal ${MAX} soal (sesuai jumlah pos di peta).`])
guide.addRow(['2.', 'Baris yang dibiarkan kosong otomatis dilewati. Kolom "No" hanya penanda, tidak perlu diubah.'])
guide.addRow(['', 'Lihat lembar "Contoh" untuk contoh pengisian ketiga jenis soal.'])
guide.addRow(['3.', 'Simpan sebagai .xlsx, lalu unggah di halaman Buat Kuis > Impor Excel.'])
guide.addRow(['4.', 'Pakai Google Sheets? Pilih File > Download > Microsoft Excel (.xlsx).'])
guide.addRow([])

const head = guide.addRow(['Kolom', 'Aturan'])
head.eachCell((cell) => {
	cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
	cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
	cell.border = border
})
const rules: [string, string][] = [
	['Jenis Soal', 'Pilihan Ganda, Benar / Salah, atau Isian Singkat. Kalau kosong, jenis ditebak dari isi baris.'],
	['Pertanyaan', 'Wajib diisi.'],
	['Pilihan A sampai D', 'Hanya untuk Pilihan Ganda. Pilihan A dan B wajib; C dan D boleh kosong.'],
	['Kunci Jawaban', 'Pilihan Ganda: huruf A, B, C, atau D.  Benar / Salah: tulis Benar atau Salah.  Isian Singkat: jawaban yang benar; bila ada beberapa jawaban yang sama-sama benar, pisahkan dengan koma (contoh: Jupiter, Yupiter).'],
	['Waktu (detik)', 'Opsional, 5 sampai 300. Bawaan: Pilihan Ganda 25, Benar / Salah 20, Isian Singkat 30.'],
	['Poin', 'Opsional, 10 sampai 1000. Bawaan: 100 (Isian Singkat 120).']
]
for (const [col, rule] of rules) {
	const row = guide.addRow([col, rule])
	row.getCell(1).font = { bold: true }
	row.eachCell((cell) => {
		cell.border = border
		cell.alignment = { vertical: 'top', wrapText: true }
	})
}

// ---------------------------------------------------------------- Lembar Contoh
const example = wb.addWorksheet('Contoh')
example.columns = sheet.columns.map(c => ({ width: c.width }))
const exampleRows: (string | number)[][] = [
	[...QUIZ_IMPORT_HEADERS],
	[1, 'Pilihan Ganda', 'Hewan pemakan tumbuhan disebut...', 'Herbivora', 'Karnivora', 'Omnivora', 'Insektivora', 'A', 25, 100],
	[2, 'Benar / Salah', 'Matahari merupakan sumber energi utama bagi bumi.', '', '', '', '', 'Benar', 20, 100],
	[3, 'Isian Singkat', 'Ibu kota Provinsi Jawa Barat adalah...', '', '', '', '', 'Bandung', 30, 120],
	[4, 'Isian Singkat', 'Planet terbesar di tata surya adalah...', '', '', '', '', 'Jupiter, Yupiter', '', '']
]
exampleRows.forEach((values, idx) => {
	const row = example.addRow(values)
	row.height = idx === 0 ? 24 : 20
	row.eachCell({ includeEmpty: true }, (cell) => {
		cell.border = border
		cell.alignment = { vertical: 'middle', wrapText: true }
		if (idx === 0) {
			cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
			cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
		}
	})
})
// Catatan di luar kolom data supaya tidak terbaca sebagai soal.
example.getColumn(12).width = 48
example.getCell('L2').value = 'Lembar ini hanya contoh dan tidak ikut diimpor. Isi soalmu di lembar "Soal".'
example.getCell('L2').font = { italic: true, color: { argb: 'FF71717A' } }
example.getCell('L2').alignment = { wrapText: true, vertical: 'top' }

mkdirSync(dirname(OUT), { recursive: true })
await wb.xlsx.writeFile(OUT)
console.log(`Templat tersimpan: ${OUT}`)
