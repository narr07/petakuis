import type { QuizQuestion } from '@petakuis/shared'

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const body = await readBody<{
		topic: string
		sourceText?: string
		schoolLevel?: string
		gradeLabel?: string
		subject?: string
		count?: number
		apiKey?: string
	}>(event)

	const topic = (body.topic || 'Ilmu Pengetahuan Umum').trim()
	const count = Math.min(12, Math.max(2, Number(body.count) || 5))
	const activeKey = (body.apiKey || config.geminiApiKey || '').trim()

	if (activeKey) {
		try {
			const systemInstruction = `Buat ${count} soal kuis berbahasa Indonesia untuk jenjang ${body.schoolLevel || 'SD/SMP'} (${body.gradeLabel || ''}) mata pelajaran ${body.subject || 'Umum'} tentang topik "${topic}". ${body.sourceText ? `Materi referensi: ${body.sourceText.slice(0, 2000)}` : ''}
Kembalikan HANYA JSON array murni dengan skema:
[{"type":"multiple"|"ox"|"subjective","prompt":"teks soal","hint":{"type":"text","value":"petunjuk singkat"},"options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"answer":["a"],"timeLimitS":30,"points":100}]
Untuk type "ox", gunakan options [{"id":"o","text":"Benar"},{"id":"x","text":"Salah"}] dan answer ["o"] atau ["x"]. Untuk type "subjective", kosongkan options [] dan isi answer dengan kata kunci jawaban singkat.`

			const resp = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(activeKey)}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{ parts: [{ text: systemInstruction }] }],
						generationConfig: {
							responseMimeType: 'application/json',
							temperature: 0.5
						}
					})
				}
			)

			if (resp.ok) {
				const data = (await resp.json()) as {
					candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
				}
				const rawText =
					data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
				const parsed = JSON.parse(rawText) as Array<Partial<QuizQuestion>>
				if (Array.isArray(parsed) && parsed.length > 0) {
					const questions: QuizQuestion[] = parsed.map((q, idx) => ({
						id: `ai-${Date.now()}-${idx + 1}`,
						type: q.type || 'multiple',
						prompt: q.prompt || `Pertanyaan #${idx + 1} tentang ${topic}`,
						hint: q.hint,
						options: q.options || [],
						answer: q.answer || ['a'],
						ignoreSpaces: true,
						timeLimitS: q.timeLimitS || 30,
						points: q.points || 100,
						order: idx + 1
					}))
					return {
						ok: true,
						source: body.apiKey ? 'gemini-byok' : 'gemini-server',
						questions
					}
				}
			}
		} catch {
			// Fall back to deterministic template generator below
		}
	}

	const fallbackTemplates: QuizQuestion[] = [
		{
			id: `ai-${Date.now()}-1`,
			type: 'multiple',
			prompt: `Manakah pernyataan yang paling tepat menjelaskan konsep utama dari ${topic}?`,
			hint: {
				type: 'text',
				value: `Perhatikan definisi dasar pada materi ${body.subject || 'pelajaran'}.`
			},
			options: [
				{
					id: 'a',
					text: `Prinsip dasar dan penerapan ${topic} dalam kehidupan sehari-hari`
				},
				{
					id: 'b',
					text: `Faktor eksternal yang tidak berkaitan dengan ${topic}`
				},
				{
					id: 'c',
					text: `Kesimpulan sementara tanpa pengamatan ilmiah`
				},
				{
					id: 'd',
					text: `Data acak yang belum diklasifikasikan`
				}
			],
			answer: ['a'],
			timeLimitS: 30,
			points: 100,
			order: 1
		},
		{
			id: `ai-${Date.now()}-2`,
			type: 'ox',
			prompt: `Pemahaman terhadap ${topic} membantu kita memecahkan masalah praktis pada bidang ${body.subject || 'sains dan sosial'}.`,
			hint: {
				type: 'text',
				value: 'Pikirkan manfaat praktis dari materi ini.'
			},
			options: [
				{ id: 'o', text: 'Benar' },
				{ id: 'x', text: 'Salah' }
			],
			answer: ['o'],
			timeLimitS: 20,
			points: 100,
			order: 2
		},
		{
			id: `ai-${Date.now()}-3`,
			type: 'subjective',
			prompt: `Ketikkan kata kunci utama yang menjadi pokok bahasan pada topik "${topic}"!`,
			hint: {
				type: 'text',
				value: `Gunakan istilah utama dari topik (${topic.split(' ')[0]}).`
			},
			options: [],
			answer: [
				topic.toLowerCase(),
				topic.split(' ')[0]?.toLowerCase() || topic.toLowerCase()
			],
			ignoreSpaces: true,
			timeLimitS: 30,
			points: 120,
			order: 3
		},
		{
			id: `ai-${Date.now()}-4`,
			type: 'multiple',
			prompt: `Dalam mempelajari ${topic} untuk tingkat ${body.gradeLabel || 'sekolah'}, langkah pertama yang perlu dilakukan adalah...`,
			options: [
				{ id: 'a', text: 'Mengamati ciri-ciri dan komponen utamanya' },
				{ id: 'b', text: 'Melewati bagian pengertian dasar' },
				{ id: 'c', text: 'Menghafal tanpa memahami konteks' },
				{ id: 'd', text: 'Mengabaikan data hasil pengamatan' }
			],
			answer: ['a'],
			timeLimitS: 30,
			points: 100,
			order: 4
		},
		{
			id: `ai-${Date.now()}-5`,
			type: 'ox',
			prompt: `Topik ${topic} sama sekali tidak memiliki hubungan dengan materi ${body.subject || 'lainnya'}.`,
			options: [
				{ id: 'o', text: 'Benar' },
				{ id: 'x', text: 'Salah' }
			],
			answer: ['x'],
			timeLimitS: 20,
			points: 100,
			order: 5
		}
	]

	return {
		ok: true,
		source: 'local-template',
		questions: fallbackTemplates.slice(0, count)
	}
})
