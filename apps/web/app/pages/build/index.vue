<script setup lang="ts">
	import {
		INDONESIAN_SUBJECTS,
		SCHOOL_LEVEL_OPTIONS,
		type GameMode,
		type MapTemplate,
		type QuestionType,
		type QuizQuestion,
		type SchoolLevel
	} from '@petakuis/shared'

	const route = useRoute()
	const router = useRouter()

	const { data: mapsData } = await useFetch<{ maps: MapTemplate[] }>('/api/maps')
	const maps = computed(() => mapsData.value?.maps || [])

	const currentStep = ref<1 | 2 | 3>(1)
	const modeFilter = ref<'all' | GameMode>('all')

	const selectedMapId = ref(
		String(route.query.mapId || 'map-halaman-sekolah')
	)
	const selectedMode = ref<GameMode>('free')
	const schoolLevel = ref<SchoolLevel>('sd')
	const gradeLabel = ref('Kelas 5')
	const subject = ref<string>(INDONESIAN_SUBJECTS[2])
	const title = ref('')
	const description = ref('')
	const ownerName = ref('Guru Petakuis')

	const isAllowPass = ref(true)
	const showIncorrectAnswer = ref(true)
	const shuffleQuestions = ref(true)

	const questions = ref<QuizQuestion[]>([
		{
			id: 'q-1',
			type: 'multiple',
			prompt: 'Ibu kota Provinsi Jawa Barat adalah...',
			hint: { type: 'text', value: 'Dikenal dengan julukan Kota Kembang.' },
			options: [
				{ id: 'a', text: 'Bandung' },
				{ id: 'b', text: 'Semarang' },
				{ id: 'c', text: 'Surabaya' },
				{ id: 'd', text: 'Yogyakarta' }
			],
			answer: ['a'],
			ignoreSpaces: true,
			timeLimitS: 30,
			points: 100,
			order: 1
		}
	])

	const aiTopic = ref('')
	const aiSourceText = ref('')
	const aiCount = ref(5)
	const aiByokKey = ref('')
	const aiLoading = ref(false)
	const saving = ref(false)
	const statusBanner = ref('')

	const filteredMaps = computed(() => {
		if (modeFilter.value === 'all') return maps.value
		return maps.value.filter((m) => m.defaultMode === modeFilter.value)
	})

	const availableGrades = computed(() => {
		const found = SCHOOL_LEVEL_OPTIONS.find((l) => l.id === schoolLevel.value)
		return found ? found.grades : ['Semua Tingkat']
	})

	watch(schoolLevel, () => {
		gradeLabel.value = availableGrades.value[0] || 'Kelas 1'
	})

	function selectMap(map: MapTemplate) {
		selectedMapId.value = map.id
		selectedMode.value = map.defaultMode
		currentStep.value = 2
	}

	function addBlankQuestion(type: QuestionType) {
		const nextOrder = questions.value.length + 1
		if (type === 'ox') {
			questions.value.push({
				id: `q-${Date.now()}`,
				type: 'ox',
				prompt: '',
				options: [
					{ id: 'o', text: 'Benar' },
					{ id: 'x', text: 'Salah' }
				],
				answer: ['o'],
				timeLimitS: 20,
				points: 100,
				order: nextOrder
			})
		} else if (type === 'subjective') {
			questions.value.push({
				id: `q-${Date.now()}`,
				type: 'subjective',
				prompt: '',
				options: [],
				answer: [''],
				ignoreSpaces: true,
				timeLimitS: 30,
				points: 100,
				order: nextOrder
			})
		} else {
			questions.value.push({
				id: `q-${Date.now()}`,
				type: 'multiple',
				prompt: '',
				options: [
					{ id: 'a', text: '' },
					{ id: 'b', text: '' },
					{ id: 'c', text: '' },
					{ id: 'd', text: '' }
				],
				answer: ['a'],
				timeLimitS: 30,
				points: 100,
				order: nextOrder
			})
		}
	}

	function removeQuestion(index: number) {
		if (questions.value.length <= 1) return
		questions.value.splice(index, 1)
	}

	async function handleAiGenerate() {
		if (!aiTopic.value.trim()) {
			statusBanner.value = 'Masukkan topik materi terlebih dahulu untuk membuat draf soal.'
			return
		}
		aiLoading.value = true
		statusBanner.value = ''
		try {
			const res = await $fetch<{
				ok: boolean
				source: string
				questions: QuizQuestion[]
			}>('/api/ai/generate', {
				method: 'POST',
				body: {
					topic: aiTopic.value,
					sourceText: aiSourceText.value,
					schoolLevel: schoolLevel.value,
					gradeLabel: gradeLabel.value,
					subject: subject.value,
					count: aiCount.value,
					apiKey: aiByokKey.value
				}
			})
			if (res.questions?.length) {
				if (!title.value.trim()) {
					title.value = `Kuis ${aiTopic.value}`
				}
				questions.value.push(...res.questions)
				statusBanner.value = `Berhasil menambahkan ${res.questions.length} soal dari topik "${aiTopic.value}".`
			}
		} finally {
			aiLoading.value = false
		}
	}

	function handleCsvImport(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = () => {
			const text = String(reader.result || '')
			const lines = text
				.split(/\r?\n/)
				.map((l) => l.trim())
				.filter(Boolean)

			for (const line of lines) {
				const cols = line.split(',').map((c) => c.trim())
				if (cols.length >= 2 && cols[0]?.toLowerCase() !== 'pertanyaan') {
					questions.value.push({
						id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
						type: 'subjective',
						prompt: cols[0]!,
						options: [],
						answer: [cols[1]!],
						ignoreSpaces: true,
						timeLimitS: 30,
						points: 100,
						order: questions.value.length + 1
					})
				}
			}
			statusBanner.value = 'Berhasil mengimpor baris soal dari berkas CSV.'
		}
		reader.readAsText(file)
	}

	async function saveAndLaunch(launchNow: boolean) {
		if (!title.value.trim()) {
			title.value = `Kuis ${subject.value} (${gradeLabel.value})`
		}

		saving.value = true
		try {
			const saved = await $fetch<{
				ok: boolean
				quiz: { id: string }
			}>('/api/quizzes', {
				method: 'POST',
				body: {
					ownerName: ownerName.value,
					title: title.value,
					description:
						description.value ||
						`Latihan soal ${subject.value} untuk ${gradeLabel.value}.`,
					schoolLevel: schoolLevel.value,
					gradeLabel: gradeLabel.value,
					subject: subject.value,
					mapId: selectedMapId.value,
					mode: selectedMode.value,
					settings: {
						isAllowPass: isAllowPass.value,
						showIncorrectAnswer: showIncorrectAnswer.value,
						answerRevealMode: 'always',
						shuffleQuestions: shuffleQuestions.value,
						shuffleOptions: false
					},
					questions: questions.value
				}
			})

			if (launchNow) {
				const session = await $fetch<{
					ok: boolean
					code: string
				}>('/api/sessions', {
					method: 'POST',
					body: {
						quizId: saved.quiz.id,
						mode: selectedMode.value,
						mapId: selectedMapId.value,
						autoStart: true
					}
				})
				await router.push(`/host/${session.code}`)
			} else {
				await router.push('/explore')
			}
		} finally {
			saving.value = false
		}
	}
</script>

<template>
	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		<!-- Stepper Header -->
		<div class="pixel-card rounded-2xl p-5">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div>
					<span class="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
						PEMBUAT KUIS KELAS (100% GRATIS)
					</span>
					<h1 class="mt-0.5 text-2xl font-extrabold text-[#16211b]">
						Susun Petualangan Kuis Baru
					</h1>
				</div>

				<div class="flex items-center gap-2">
					<button
						type="button"
						class="rounded-xl border-2 px-3.5 py-2 text-xs font-extrabold"
						:class="
							currentStep === 1
								? 'border-[#16211b] bg-[#16211b] text-[#fef08a]'
								: 'border-[#16211b] bg-white text-[#16211b]'
						"
						@click="currentStep = 1"
					>
						1. Pilih Peta
					</button>
					<button
						type="button"
						class="rounded-xl border-2 px-3.5 py-2 text-xs font-extrabold"
						:class="
							currentStep === 2
								? 'border-[#16211b] bg-[#16211b] text-[#fef08a]'
								: 'border-[#16211b] bg-white text-[#16211b]'
						"
						@click="currentStep = 2"
					>
						2. Jenjang & Mapel
					</button>
					<button
						type="button"
						class="rounded-xl border-2 px-3.5 py-2 text-xs font-extrabold"
						:class="
							currentStep === 3
								? 'border-[#16211b] bg-[#16211b] text-[#fef08a]'
								: 'border-[#16211b] bg-white text-[#16211b]'
						"
						@click="currentStep = 3"
					>
						3. Pertanyaan & AI ({{ questions.length }})
					</button>
				</div>
			</div>
		</div>

		<!-- STEP 1: Map Selection (ZEP-style Map Picker) -->
		<section
			v-if="currentStep === 1"
			class="mt-6 space-y-6"
		>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="rounded-lg border-2 border-[#16211b] px-3 py-1.5 text-xs font-extrabold"
						:class="modeFilter === 'all' ? 'bg-[#fef08a]' : 'bg-white'"
						@click="modeFilter = 'all'"
					>
						Semua Peta ({{ maps.length }})
					</button>
					<button
						type="button"
						class="rounded-lg border-2 border-[#16211b] px-3 py-1.5 text-xs font-extrabold"
						:class="modeFilter === 'free' ? 'bg-[#fef08a]' : 'bg-white'"
						@click="modeFilter = 'free'"
					>
						Mode Eksplorasi Bebas
					</button>
					<button
						type="button"
						class="rounded-lg border-2 border-[#16211b] px-3 py-1.5 text-xs font-extrabold"
						:class="modeFilter === 'linear' ? 'bg-[#fef08a]' : 'bg-white'"
						@click="modeFilter = 'linear'"
					>
						Mode Berurutan
					</button>
				</div>
				<span class="text-xs font-bold text-[#14532d]">
					Semua peta terbuka gratis (Tanpa Gembok Tier)
				</span>
			</div>

			<div class="grid gap-6 sm:grid-cols-2">
				<article
					v-for="map in filteredMaps"
					:key="map.id"
					class="pixel-card flex flex-col justify-between rounded-2xl p-5"
					:class="
						selectedMapId === map.id ? 'ring-4 ring-[#15803d]' : ''
					"
				>
					<div>
						<div
							class="relative h-40 w-full overflow-hidden rounded-xl border-2 border-[#16211b]"
							:style="{ backgroundColor: map.palette.floorPrimary }"
						>
							<img
								:src="map.mapImageUrl"
								:alt="map.name"
								class="h-full w-full object-cover"
								style="image-rendering: pixelated"
							/>
							<div
								class="absolute left-3 top-3 rounded border border-[#16211b] bg-white px-2.5 py-1 text-xs font-extrabold"
							>
								{{
									map.defaultMode === 'free'
										? 'Eksplorasi Bebas'
										: 'Jalur Berurutan'
								}}
							</div>
							<div
								class="absolute right-3 top-3 rounded border border-[#16211b] bg-[#dcfce7] px-2.5 py-1 text-xs font-extrabold text-[#14532d]"
							>
								Maks {{ map.maxPlayers }} Siswa
							</div>
						</div>

						<h2 class="mt-4 text-xl font-extrabold text-[#16211b]">
							{{ map.name }}
						</h2>
						<p class="mt-1 text-sm text-[#435249]">
							{{ map.description }}
						</p>
					</div>

					<div class="mt-5 flex items-center gap-3">
						<button
							type="button"
							class="pixel-btn flex-1 rounded-xl bg-[#15803d] py-3 text-xs font-extrabold text-white"
							@click="selectMap(map)"
						>
							Pilih Peta & Lanjut
						</button>
					</div>
				</article>
			</div>
		</section>

		<!-- STEP 2: Curriculum & Metadata Picker -->
		<section
			v-else-if="currentStep === 2"
			class="pixel-card mt-6 rounded-2xl p-6 sm:p-8"
		>
			<h2 class="text-xl font-extrabold text-[#16211b]">
				Pilih Jenjang Sekolah & Mata Pelajaran
			</h2>
			<p class="mt-1 text-sm text-[#435249]">
				Informasi ini membantu guru lain menemukan kuis Anda di perpustakaan terbuka
				dan menyesuaikan tingkat kesulitan generator soal AI.
			</p>

			<div class="mt-6 grid gap-6 sm:grid-cols-2">
				<div>
					<label class="block text-xs font-extrabold uppercase tracking-wider text-[#16211b]">
						Jenjang Pendidikan
					</label>
					<div class="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
						<button
							v-for="lvl in SCHOOL_LEVEL_OPTIONS"
							:key="lvl.id"
							type="button"
							class="rounded-xl border-2 px-3 py-2.5 text-xs font-extrabold"
							:class="
								schoolLevel === lvl.id
									? 'border-[#16211b] bg-[#fef08a]'
									: 'border-[#16211b]/30 bg-white'
							"
							@click="schoolLevel = lvl.id"
						>
							{{ lvl.label }}
						</button>
					</div>
				</div>

				<div>
					<label
						for="grade-select"
						class="block text-xs font-extrabold uppercase tracking-wider text-[#16211b]"
					>
						Tingkat Kelas
					</label>
					<select
						id="grade-select"
						v-model="gradeLabel"
						class="mt-2 w-full rounded-xl border-2 border-[#16211b] bg-white px-4 py-3 text-sm font-bold"
					>
						<option
							v-for="g in availableGrades"
							:key="g"
							:value="g"
						>
							{{ g }}
						</option>
					</select>
				</div>

				<div class="sm:col-span-2">
					<label class="block text-xs font-extrabold uppercase tracking-wider text-[#16211b]">
						Mata Pelajaran Kurikulum Indonesia
					</label>
					<div class="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
						<button
							v-for="subj in INDONESIAN_SUBJECTS"
							:key="subj"
							type="button"
							class="rounded-xl border-2 px-3 py-2.5 text-left text-xs font-extrabold"
							:class="
								subject === subj
									? 'border-[#16211b] bg-[#dcfce7] text-[#14532d]'
									: 'border-[#16211b]/30 bg-white'
							"
							@click="subject = subj"
						>
							{{ subj }}
						</button>
					</div>
				</div>

				<div>
					<label
						for="quiz-title-input"
						class="block text-xs font-extrabold uppercase tracking-wider text-[#16211b]"
					>
						Judul Kuis
					</label>
					<input
						id="quiz-title-input"
						v-model="title"
						type="text"
						placeholder="Contoh: Eksplorasi Ekosistem & Rantai Makanan"
						class="mt-1.5 w-full rounded-xl border-2 border-[#16211b] bg-white px-4 py-3 text-sm font-bold"
					/>
				</div>

				<div>
					<label
						for="teacher-name-input"
						class="block text-xs font-extrabold uppercase tracking-wider text-[#16211b]"
					>
						Nama Guru / Sekolah
					</label>
					<input
						id="teacher-name-input"
						v-model="ownerName"
						type="text"
						placeholder="Contoh: Pak Budi (SMPN 2 Yogyakarta)"
						class="mt-1.5 w-full rounded-xl border-2 border-[#16211b] bg-white px-4 py-3 text-sm font-bold"
					/>
				</div>
			</div>

			<div class="mt-8 flex justify-between border-t border-[#e6decb] pt-5">
				<button
					type="button"
					class="pixel-btn rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold"
					@click="currentStep = 1"
				>
					← Kembali ke Peta
				</button>
				<button
					type="button"
					class="pixel-btn rounded-xl bg-[#15803d] px-6 py-3 text-sm font-extrabold text-white"
					@click="currentStep = 3"
				>
					Lanjut ke Editor Soal →
				</button>
			</div>
		</section>

		<!-- STEP 3: Question Editor + AI Generator -->
		<section
			v-else
			class="mt-6 grid gap-6 lg:grid-cols-12"
		>
			<!-- Left Column: AI Generator & Settings -->
			<div class="space-y-6 lg:col-span-4">
				<div class="pixel-card rounded-2xl p-5">
					<span class="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
						ASISTEN PEMBUAT SOAL AI
					</span>
					<h2 class="mt-1 text-lg font-extrabold text-[#16211b]">
						Buat Soal dari Topik / Materi
					</h2>
					<p class="mt-1 text-xs text-[#435249]">
						Tersedia gratis menggunakan kuota server atau masukkan kunci API Gemini
						pribadi (BYOK) tanpa batas.
					</p>

					<div class="mt-4 space-y-3">
						<div>
							<label
								for="ai-topic-input"
								class="block text-xs font-bold text-[#16211b]"
							>
								Topik Bahasan
							</label>
							<input
								id="ai-topic-input"
								v-model="aiTopic"
								type="text"
								placeholder="Contoh: Sistem Pencernaan Manusia"
								class="mt-1 w-full rounded-xl border-2 border-[#16211b] bg-white px-3 py-2 text-sm font-semibold"
							/>
						</div>

						<div>
							<label
								for="ai-source-textarea"
								class="block text-xs font-bold text-[#16211b]"
							>
								Ringkasan Materi / Bacaan (Opsional)
							</label>
							<textarea
								id="ai-source-textarea"
								v-model="aiSourceText"
								rows="3"
								placeholder="Tempel cuplikan materi buku ajar di sini..."
								class="mt-1 w-full rounded-xl border-2 border-[#16211b] bg-white px-3 py-2 text-xs font-medium"
							/>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<div>
								<label
									for="ai-count-input"
									class="block text-xs font-bold text-[#16211b]"
								>
									Jumlah Soal
								</label>
								<input
									id="ai-count-input"
									v-model.number="aiCount"
									type="number"
									min="2"
									max="10"
									class="mt-1 w-full rounded-xl border-2 border-[#16211b] bg-white px-3 py-2 text-sm font-bold"
								/>
							</div>
							<div>
								<label
									for="ai-key-input"
									class="block text-xs font-bold text-[#16211b]"
								>
									API Key (Opsional)
								</label>
								<input
									id="ai-key-input"
									v-model="aiByokKey"
									type="password"
									placeholder="Kosongkan = Gratis"
									class="mt-1 w-full rounded-xl border-2 border-[#16211b] bg-white px-3 py-2 text-xs"
								/>
							</div>
						</div>

						<button
							type="button"
							:disabled="aiLoading"
							class="pixel-btn w-full rounded-xl bg-[#f59e0b] py-2.5 text-xs font-extrabold text-[#16211b]"
							@click="handleAiGenerate"
						>
							{{
								aiLoading
									? 'Menyusun Draf Soal...'
									: '+ Buat Soal Otomatis dengan AI'
							}}
						</button>
					</div>
				</div>

				<!-- CSV Import & Quiz Settings -->
				<div class="pixel-card rounded-2xl p-5 space-y-4">
					<h3 class="text-sm font-extrabold uppercase text-[#16211b]">
						Pengaturan Mekanik & Impor CSV
					</h3>

					<div>
						<label
							for="mode-select"
							class="block text-xs font-bold text-[#435249]"
						>
							Mode Urutan Pos Soal di Peta
						</label>
						<select
							id="mode-select"
							v-model="selectedMode"
							class="mt-1 w-full rounded-xl border-2 border-[#16211b] bg-white px-3 py-2 text-xs font-bold"
						>
							<option value="free">
								Eksplorasi Bebas (Acak per Siswa)
							</option>
							<option value="linear">
								Jalur Berurutan (Pos #1 s/d Selesai)
							</option>
						</select>
					</div>

					<label class="flex items-center gap-2 text-xs font-bold text-[#16211b]">
						<input
							v-model="showIncorrectAnswer"
							type="checkbox"
							class="h-4 w-4 accent-[#15803d]"
						/>
						<span>Tampilkan kunci jawaban setelah siswa menjawab</span>
					</label>

					<div class="border-t border-[#e6decb] pt-3">
						<label
							for="csv-file-input"
							class="block text-xs font-bold text-[#16211b]"
						>
							Impor Cepat dari CSV (Format: pertanyaan,jawaban)
						</label>
						<input
							id="csv-file-input"
							type="file"
							accept=".csv,.txt"
							class="mt-1.5 block w-full text-xs"
							@change="handleCsvImport"
						/>
					</div>
				</div>
			</div>

			<!-- Right Column: Question List Editor -->
			<div class="space-y-5 lg:col-span-8">
				<div
					v-if="statusBanner"
					class="rounded-xl border-2 border-[#15803d] bg-[#dcfce7] px-4 py-3 text-xs font-bold text-[#14532d]"
				>
					{{ statusBanner }}
				</div>

				<div class="flex flex-wrap items-center justify-between gap-2">
					<div class="flex flex-wrap items-center gap-2">
						<button
							type="button"
							class="pixel-btn rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold"
							@click="addBlankQuestion('multiple')"
						>
							+ Soal Pilihan Ganda
						</button>
						<button
							type="button"
							class="pixel-btn rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold"
							@click="addBlankQuestion('ox')"
						>
							+ Soal Benar / Salah
						</button>
						<button
							type="button"
							class="pixel-btn rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold"
							@click="addBlankQuestion('subjective')"
						>
							+ Soal Isian Singkat
						</button>
					</div>

					<div class="flex items-center gap-2.5">
						<button
							type="button"
							:disabled="saving"
							class="pixel-btn rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#16211b]"
							@click="saveAndLaunch(false)"
						>
							Simpan ke Perpustakaan
						</button>
						<button
							type="button"
							:disabled="saving"
							class="pixel-btn rounded-xl bg-[#15803d] px-5 py-2.5 text-xs font-extrabold text-white"
							@click="saveAndLaunch(true)"
						>
							Simpan & Buka Kelas Live
						</button>
					</div>
				</div>

				<!-- Questions Cards -->
				<div class="space-y-4">
					<div
						v-for="(q, qIdx) in questions"
						:key="q.id"
						class="pixel-card rounded-2xl p-5"
					>
						<div class="flex items-center justify-between border-b border-[#e6decb] pb-3">
							<div class="flex items-center gap-2">
								<span
									class="rounded bg-[#16211b] px-2.5 py-1 font-mono-num text-xs font-bold text-[#fef08a]"
								>
									POS #{{ qIdx + 1 }}
								</span>
								<span class="text-xs font-extrabold uppercase text-[#435249]">
									{{
										q.type === 'multiple'
											? 'Pilihan Ganda'
											: q.type === 'ox'
												? 'Benar / Salah'
												: 'Isian Singkat'
									}}
								</span>
							</div>

							<button
								type="button"
								class="text-xs font-bold text-[#991b1b] hover:underline"
								@click="removeQuestion(qIdx)"
							>
								Hapus Soal
							</button>
						</div>

						<div class="mt-3 space-y-3">
							<div>
								<label class="block text-xs font-bold text-[#435249]">
									Pertanyaan
								</label>
								<input
									v-model="q.prompt"
									type="text"
									placeholder="Tulis kalimat pertanyaan di sini..."
									class="mt-1 w-full rounded-xl border-2 border-[#16211b] bg-white px-3.5 py-2.5 text-sm font-bold"
								/>
							</div>

							<!-- Multiple choice options -->
							<div
								v-if="q.type === 'multiple'"
								class="grid gap-2 sm:grid-cols-2"
							>
								<div
									v-for="opt in q.options"
									:key="opt.id"
									class="flex items-center gap-2 rounded-xl border border-[#16211b] bg-[#faf6ee] p-2"
								>
									<input
										:checked="q.answer[0] === opt.id"
										type="radio"
										:name="`correct-${q.id}`"
										class="h-4 w-4 accent-[#15803d]"
										@change="q.answer = [opt.id]"
									/>
									<input
										v-model="opt.text"
										type="text"
										:placeholder="`Pilihan ${opt.id.toUpperCase()}`"
										class="w-full bg-transparent text-xs font-bold focus:outline-none"
									/>
								</div>
							</div>

							<!-- Benar/Salah -->
							<div
								v-else-if="q.type === 'ox'"
								class="flex items-center gap-3"
							>
								<button
									type="button"
									class="rounded-xl border-2 px-4 py-2 text-xs font-extrabold"
									:class="
										q.answer[0] === 'o'
											? 'border-[#16211b] bg-[#dcfce7] text-[#14532d]'
											: 'border-[#16211b]/30 bg-white'
									"
									@click="q.answer = ['o']"
								>
									Kunci: BENAR (O)
								</button>
								<button
									type="button"
									class="rounded-xl border-2 px-4 py-2 text-xs font-extrabold"
									:class="
										q.answer[0] === 'x'
											? 'border-[#16211b] bg-[#fee2e2] text-[#991b1b]'
											: 'border-[#16211b]/30 bg-white'
									"
									@click="q.answer = ['x']"
								>
									Kunci: SALAH (X)
								</button>
							</div>

							<!-- Subjective -->
							<div v-else>
								<label class="block text-xs font-bold text-[#435249]">
									Kunci Jawaban Singkat (Bisa lebih dari satu, pisahkan koma)
								</label>
								<input
									:value="q.answer.join(', ')"
									type="text"
									placeholder="Contoh: danau toba, toba"
									class="mt-1 w-full rounded-xl border-2 border-[#16211b] bg-white px-3.5 py-2 text-xs font-bold"
									@input="
										q.answer = ($event.target as HTMLInputElement).value
											.split(',')
											.map((s) => s.trim())
											.filter(Boolean)
									"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>
