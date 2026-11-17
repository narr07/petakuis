import { AI_QUESTION_JSON_SCHEMA, normalizeAiQuestions } from '@petakuis/shared'

/** Model bawaan bila NUXT_GEMINI_MODEL kosong. Daftar model & tanggal pensiun: aistudio.google.com/docs/deprecations */
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'
const TIMEOUT_MS = 60_000

/**
 * Membuat draf soal dengan Gemini. Bila AI gagal, guru diberi tahu alasannya; tidak ada soal
 * pengganti buatan templat, karena soal semacam itu tampak seperti hasil AI padahal isinya generik.
 */
export default defineEventHandler(async (event) => {
	// Memakai kunci Gemini milik server: hanya untuk guru/admin yang sudah masuk.
	await requireUser(event, ['teacher', 'admin'])
	const config = useRuntimeConfig()
	const body = await readBody<{
		topic?: string
		sourceText?: string
		schoolLevel?: string
		gradeLabel?: string
		subject?: string
		count?: number
		apiKey?: string
	}>(event)

	const topic = String(body.topic || '').trim().slice(0, 200)
	if (!topic) {
		throw createError({ statusCode: 400, statusMessage: 'Isi topik atau materi soal terlebih dahulu.' })
	}
	const count = Math.min(12, Math.max(1, Math.floor(Number(body.count) || 5)))
	const byok = String(body.apiKey || '').trim()
	const apiKey = byok || String(config.geminiApiKey || '').trim()
	if (!apiKey) {
		throw createError({
			statusCode: 503,
			statusMessage: 'Fitur AI belum aktif di server. Masukkan kunci API Gemini pribadi di kolom "Kunci API Gemini", atau hubungi admin.'
		})
	}
	const model = String(config.geminiModel || '').trim() || DEFAULT_GEMINI_MODEL
	const source = String(body.sourceText || '').trim().slice(0, 4000)

	const instruction = [
		`Buat ${count} soal kuis berbahasa Indonesia untuk siswa ${body.schoolLevel?.toUpperCase() || 'SD'} ${body.gradeLabel || ''}, mata pelajaran ${body.subject || 'umum'}, tentang: "${topic}".`,
		source ? `Gunakan materi berikut sebagai sumber utama:\n"""\n${source}\n"""` : '',
		'Aturan:',
		'- Fakta harus benar dan sesuai Kurikulum Merdeka untuk jenjang itu; bahasa sederhana sesuai usia siswa.',
		'- Campurkan jenis soal: sebagian besar "multiple" (pilihan ganda), beberapa "ox" (benar/salah), sedikit "subjective" (isian singkat).',
		'- multiple: tepat 4 pilihan berbeda, tepat satu jawaban benar (huruf a, b, c, atau d), pengecoh masuk akal; jangan memakai pilihan "semua benar" atau "semua salah".',
		'- ox: pernyataan yang jelas benar atau jelas salah; answer "benar" atau "salah"; options kosong.',
		'- subjective: jawaban satu sampai tiga kata; answer berisi variasi penulisan yang diterima; options kosong.',
		'- hint: petunjuk singkat yang membantu tanpa membocorkan jawaban.'
	].filter(Boolean).join('\n')

	let resp: Response
	try {
		resp = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
			{
				method: 'POST',
				// Kunci di header, bukan di URL, supaya tidak tercatat di log mana pun.
				headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
				body: JSON.stringify({
					contents: [{ role: 'user', parts: [{ text: instruction }] }],
					generationConfig: {
						responseMimeType: 'application/json',
						responseJsonSchema: AI_QUESTION_JSON_SCHEMA,
						temperature: 0.4
					}
				}),
				signal: AbortSignal.timeout(TIMEOUT_MS)
			}
		)
	} catch (err) {
		const timedOut = err instanceof Error && err.name === 'TimeoutError'
		recordWebLog('warn', 'ai', `Gemini tidak terjangkau: ${timedOut ? 'waktu habis' : String(err)}`, { model })
		throw createError({
			statusCode: 504,
			statusMessage: timedOut
				? 'AI terlalu lama menjawab. Coba lagi dengan jumlah soal lebih sedikit.'
				: 'Server tidak bisa menghubungi layanan AI. Coba lagi beberapa saat lagi.'
		})
	}

	if (!resp.ok) {
		const detail = await resp.json().catch(() => null) as {
			error?: { status?: string, message?: string, details?: Array<{ reason?: string }> }
		} | null
		const reason = detail?.error?.details?.find(d => d.reason)?.reason || detail?.error?.status || ''
		recordWebLog('warn', 'ai', `Gemini menolak permintaan (${resp.status} ${reason})`, {
			model,
			byok: Boolean(byok),
			message: detail?.error?.message?.slice(0, 300)
		})
		throw createError(geminiError(resp.status, reason, Boolean(byok)))
	}

	const data = await resp.json().catch(() => null) as {
		candidates?: Array<{ finishReason?: string, content?: { parts?: Array<{ text?: string }> } }>
	} | null
	const candidate = data?.candidates?.[0]
	const rawText = candidate?.content?.parts?.map(p => p.text || '').join('') || ''
	let parsed: unknown = null
	try {
		parsed = JSON.parse(rawText)
	} catch {
		// Ditangani di bawah sebagai "tidak ada soal valid".
	}

	const { questions, dropped } = normalizeAiQuestions(parsed, {
		idPrefix: `ai-${Date.now()}`,
		limit: count
	})
	if (questions.length === 0) {
		recordWebLog('warn', 'ai', `Gemini tidak menghasilkan soal valid (finishReason ${candidate?.finishReason || '-'})`, {
			model,
			dropped
		})
		throw createError({
			statusCode: 502,
			statusMessage: candidate?.finishReason === 'SAFETY'
				? 'AI menolak topik ini. Ubah kata-kata topik lalu coba lagi.'
				: 'AI tidak menghasilkan soal yang bisa dipakai. Coba lagi atau perjelas topiknya.'
		})
	}

	return { ok: true, source: byok ? 'gemini-byok' : 'gemini-server', model, questions, dropped }
})

function geminiError(status: number, reason: string, byok: boolean): { statusCode: number, statusMessage: string } {
	if (reason === 'API_KEY_INVALID' || status === 401 || status === 403) {
		return byok
			? { statusCode: 400, statusMessage: 'Kunci API Gemini yang kamu masukkan tidak valid atau tidak punya akses.' }
			: { statusCode: 502, statusMessage: 'Kunci API Gemini di server tidak valid. Hubungi admin, atau masukkan kunci API pribadi.' }
	}
	if (status === 429) {
		return { statusCode: 429, statusMessage: 'Kuota AI sedang habis. Coba lagi beberapa menit lagi, atau masukkan kunci API pribadi.' }
	}
	if (status === 404) {
		return { statusCode: 502, statusMessage: 'Model AI yang dipakai server sudah tidak tersedia. Hubungi admin.' }
	}
	if (status >= 500) {
		return { statusCode: 502, statusMessage: 'Layanan AI sedang bermasalah. Coba lagi beberapa saat lagi.' }
	}
	return { statusCode: 502, statusMessage: 'Permintaan ke AI gagal. Coba lagi beberapa saat lagi.' }
}
