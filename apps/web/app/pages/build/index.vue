<script setup lang="ts">
	import {
		INDONESIAN_SUBJECTS,
		NPC_CHARACTERS,
		SCHOOL_LEVEL_OPTIONS,
		type GameMode,
		type MapTemplate,
		type QuestionType,
		type QuizDefinition,
		type QuizQuestion,
		type SchoolLevel,
		type TilePosition
	} from '@petakuis/shared'

	const route = useRoute()
	const router = useRouter()
	const toast = useToast()

	const { data: mapsData } = await useFetch<{ maps: MapTemplate[] }>('/api/maps')
	const maps = computed(() => mapsData.value?.maps || [])

	// Mode edit: /build?edit=<id>. Hanya pemilik kuis (atau admin) yang menerima kuis utuh.
	const editId = typeof route.query.edit === 'string' ? route.query.edit : ''
	let editQuiz: QuizDefinition | null = null
	if (editId) {
		const { data: editData } = await useFetch<{ quiz: QuizDefinition, canManage: boolean }>(
			`/api/quizzes/${encodeURIComponent(editId)}`,
			{ key: `edit-quiz-${editId}` }
		)
		if (!editData.value?.canManage) {
			throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan atau bukan milikmu.', fatal: true })
		}
		editQuiz = editData.value.quiz
	}
	const isEditing = Boolean(editQuiz)

	useSeoMeta({ title: isEditing ? 'Edit Kuis' : 'Buat Kuis' })

	const currentStep = ref<1 | 2 | 3>(
		([1, 2, 3].includes(Number(route.query.step)) ? Number(route.query.step) : isEditing ? 3 : 1) as 1 | 2 | 3
	)
	const modeFilter = ref<'all' | GameMode>('all')

	const selectedMapId = ref(
		editQuiz?.mapId ?? String(route.query.mapId || 'map-pesisir-karang')
	)

	const steps = [
		{ id: 1, label: '1. Pilih Peta', icon: 'i-lucide-map' },
		{ id: 2, label: '2. Jenjang & Mapel', icon: 'i-lucide-graduation-cap' },
		{ id: 3, label: '3. Pertanyaan & AI', icon: 'i-lucide-sparkles' }
	] as const

	const modeFilters = computed(() => [
		{ value: 'all', label: `Semua Peta (${maps.value.length})`, icon: 'i-lucide-layout-grid' },
		{ value: 'free', label: 'Eksplorasi Bebas', icon: 'i-lucide-shuffle' },
		{ value: 'linear', label: 'Berurutan', icon: 'i-lucide-list-ordered' }
	] as const)

	const typeLabels: Record<string, { label: string, icon: string, color: 'primary' | 'secondary' | 'warning' }> = {
		multiple: { label: 'Pilihan Ganda', icon: 'i-lucide-list-checks', color: 'primary' },
		ox: { label: 'Benar / Salah', icon: 'i-lucide-toggle-right', color: 'secondary' },
		subjective: { label: 'Isian Singkat', icon: 'i-lucide-text-cursor-input', color: 'warning' }
	}

	const questionAdders = [
		{ type: 'multiple' as QuestionType, label: 'Pilihan Ganda', icon: 'i-lucide-list-checks' },
		{ type: 'ox' as QuestionType, label: 'Benar / Salah', icon: 'i-lucide-toggle-right' },
		{ type: 'subjective' as QuestionType, label: 'Isian Singkat', icon: 'i-lucide-text-cursor-input' }
	] as const

	function onAnswerInput(q: QuizQuestion, value: string) {
		q.answer = value.split(',').map(s => s.trim()).filter(Boolean)
	}

	const selectedMode = ref<GameMode>(editQuiz?.mode ?? 'free')
	const schoolLevel = ref<SchoolLevel>(editQuiz?.schoolLevel ?? 'sd')
	const gradeLabel = ref(editQuiz?.gradeLabel ?? 'Kelas 5')
	const subject = ref(editQuiz?.subject ?? 'Ilmu Pengetahuan Alam (IPA)')
	const title = ref(editQuiz?.title ?? '')
	const description = ref(editQuiz?.description ?? '')
	const ownerName = ref(editQuiz?.ownerName ?? 'Guru Kreatif Indonesia')

	const isAllowPass = ref(editQuiz?.settings.isAllowPass ?? true)
	const showIncorrectAnswer = ref(editQuiz?.settings.showIncorrectAnswer ?? true)
	const shuffleQuestions = ref(editQuiz?.settings.shuffleQuestions ?? true)

	const aiTopic = ref('')
	const aiSourceText = ref('')
	const aiCount = ref(5)
	const aiByokKey = ref('')
	const aiLoading = ref(false)

	const saving = ref(false)
	const statusBanner = ref<string | null>(null)

	const questions = ref<QuizQuestion[]>(editQuiz ? structuredClone(editQuiz.questions) : [
		{
			id: 'q-demo-1',
			type: 'multiple',
			prompt: 'Hewan pemakan tumbuhan dalam rantai makanan disebut...',
			options: [
				{ id: 'a', text: 'Herbivora' },
				{ id: 'b', text: 'Karnivora' },
				{ id: 'c', text: 'Omnivora' },
				{ id: 'd', text: 'Insektivora' }
			],
			answer: ['a'],
			timeLimitS: 25,
			points: 100,
			order: 1
		},
		{
			id: 'q-demo-2',
			type: 'ox',
			prompt: 'Matahari merupakan sumber energi utama bagi kehidupan di bumi.',
			options: [
				{ id: 'o', text: 'Benar' },
				{ id: 'x', text: 'Salah' }
			],
			answer: ['o'],
			timeLimitS: 20,
			points: 100,
			order: 2
		}
	])

	const filteredMaps = computed(() => {
		if (modeFilter.value === 'all') return maps.value
		return maps.value.filter(m => m.defaultMode === modeFilter.value)
	})

	const availableGrades = computed<string[]>(() => {
		const found = SCHOOL_LEVEL_OPTIONS.find(l => l.id === schoolLevel.value)
		return found ? [...found.grades] : ['Semua Kelas']
	})

	watch(schoolLevel, () => {
		if (availableGrades.value[0]) {
			gradeLabel.value = availableGrades.value[0]
		}
	})

	const selectedMap = computed(
		() => maps.value.find(m => m.id === selectedMapId.value) || null
	)

	const placementIndex = ref<number | null>(null)

	watch(selectedMapId, () => {
		for (const q of questions.value) {
			q.placement = undefined
		}
		placementIndex.value = null
	})

	function setPlacement(position: TilePosition | undefined) {
		if (placementIndex.value === null) return
		const q = questions.value[placementIndex.value]
		if (q) q.placement = position
	}

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
				timeLimitS: 30,
				points: 120,
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
				timeLimitS: 25,
				points: 100,
				order: nextOrder
			})
		}
	}

	function removeQuestion(index: number) {
		questions.value.splice(index, 1)
		questions.value.forEach((q, idx) => {
			q.order = idx + 1
		})
	}

	async function handleAiGenerate() {
		if (!aiTopic.value.trim()) {
			toast.add({
				title: 'Topik belum diisi',
				description: 'Masukkan topik atau kompetensi dasar kuis terlebih dahulu.',
				color: 'warning'
			})
			return
		}

		aiLoading.value = true
		statusBanner.value = null

		try {
			const res = await $fetch<{ ok: boolean, questions: QuizQuestion[] }>(
				'/api/ai/generate',
				{
					method: 'POST',
					body: {
						topic: aiTopic.value,
						schoolLevel: schoolLevel.value,
						gradeLabel: gradeLabel.value,
						subject: subject.value,
						count: aiCount.value,
						sourceText: aiSourceText.value || undefined,
						apiKey: aiByokKey.value || undefined
					}
				}
			)

			if (res.ok && res.questions.length > 0) {
				const currentCount = questions.value.length
				const newItems = res.questions.map((q, idx) => ({
					...q,
					order: currentCount + idx + 1
				}))
				questions.value = [...questions.value, ...newItems]
				toast.add({
					title: 'Soal AI Berhasil Ditambahkan',
					description: `${res.questions.length} butir soal baru telah dimasukkan ke daftar kuis.`,
					color: 'success'
				})
			}
		} catch (err: unknown) {
			const e = err as { data?: { statusMessage?: string } }
			toast.add({
				title: 'Gagal membuat soal AI',
				description: e?.data?.statusMessage || 'Periksa koneksi atau kunci API Anda.',
				color: 'error'
			})
		} finally {
			aiLoading.value = false
		}
	}

	// Impor CSV lewat UFileUpload: berkas diproses saat dipilih, lalu kotak dikosongkan lagi.
	const csvFile = ref<File | null>(null)
	watch(csvFile, (file) => {
		if (!file) return
		importCsvFile(file)
		nextTick(() => {
			csvFile.value = null
		})
	})

	function importCsvFile(file: File) {

		const reader = new FileReader()
		reader.onload = () => {
			const text = String(reader.result || '')
			const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
			let count = 0
			for (const line of lines) {
				const parts = line.split(',')
				if (parts.length >= 2) {
					const prompt = parts[0]?.trim() || ''
					const ans = parts[1]?.trim() || ''
					if (prompt && ans) {
						count += 1
						questions.value.push({
							id: `csv-${Date.now()}-${count}`,
							type: 'subjective',
							prompt,
							options: [],
							answer: [ans],
							timeLimitS: 25,
							points: 100,
							order: questions.value.length + 1
						})
					}
				}
			}
			toast.add({
				title: 'Impor CSV Berhasil',
				description: `${count} soal berhasil ditambahkan dari berkas CSV.`,
				color: 'success'
			})
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
			}>(editQuiz ? `/api/quizzes/${encodeURIComponent(editQuiz.id)}` : '/api/quizzes', {
				method: editQuiz ? 'PATCH' : 'POST',
				body: {
					ownerName: ownerName.value,
					visibility: editQuiz?.visibility ?? 'public',
					title: title.value,
					description:
						description.value
						|| `Latihan soal ${subject.value} untuk ${gradeLabel.value}.`,
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
					hostToken: string
				}>('/api/sessions', {
					method: 'POST',
					body: {
						quizId: saved.quiz.id,
						mode: selectedMode.value,
						mapId: selectedMapId.value,
						autoStart: true
					}
				})
				rememberHostToken(session.code, session.hostToken)
				await router.push(`/host/${session.code}`)
			} else {
				toast.add({
					title: isEditing ? 'Perubahan tersimpan' : 'Kuis tersimpan',
					icon: 'i-lucide-circle-check',
					color: 'success'
				})
				await router.push('/dashboard/quizzes')
			}
		} catch (err: unknown) {
			const e = err as { data?: { statusMessage?: string } }
			toast.add({
				title: 'Kuis belum tersimpan',
				description: e?.data?.statusMessage || 'Periksa koneksi lalu coba lagi.',
				icon: 'i-lucide-circle-alert',
				color: 'error'
			})
		} finally {
			saving.value = false
		}
	}
</script>

<template>
	<UContainer class="py-8 sm:py-10">
		<!-- Header Halaman -->
		<UPageHeader
			headline="Penyusun Petualangan Kuis"
			:title="isEditing ? `Edit Kuis: ${title || 'Tanpa judul'}` : 'Buat Kuis Baru untuk Kelas'"
			description="Rancang pos tantangan interaktif 2D dalam 3 langkah mudah: pilih kawasan peta, tentukan jenjang materi, dan isi soal."
			:ui="{ root: 'border-b-0 pb-0' }"
		>
			<template #links>
				<!-- Navigasi Stepper -->
				<div class="flex items-center gap-2">
					<UButton
						v-for="s in steps"
						:key="s.id"
						:color="currentStep === s.id ? 'primary' : 'neutral'"
						:variant="currentStep === s.id ? 'solid' : 'outline'"
						size="md"
						:icon="s.icon"
						:label="s.label"
						@click="currentStep = s.id"
					/>
				</div>
			</template>
		</UPageHeader>

		<!-- ================= STEP 1: PILIH PETA ================= -->
		<section v-if="currentStep === 1" class="mt-8 space-y-6">
			<!-- Filter Mode Peta -->
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<UButton
						v-for="f in modeFilters"
						:key="f.value"
						:color="modeFilter === f.value ? 'primary' : 'neutral'"
						:variant="modeFilter === f.value ? 'solid' : 'outline'"
						size="sm"
						:icon="f.icon"
						:label="f.label"
						@click="modeFilter = f.value"
					/>
				</div>

				<UBadge color="success" variant="subtle" size="md" icon="i-lucide-check-circle">
					Semua peta terbuka 100% gratis
				</UBadge>
			</div>

			<!-- Grid Peta -->
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<UCard
					v-for="map in filteredMaps"
					:key="map.id"
					class="flex flex-col justify-between transition-all"
					:class="selectedMapId === map.id ? 'ring-2 ring-primary shadow-lg' : ''"
					:ui="{ body: 'p-4 sm:p-5 flex-1 flex flex-col justify-between' }"
				>
					<div>
						<div
							class="relative h-44 w-full overflow-hidden rounded-xl border border-default"
							:style="{ backgroundColor: map.palette.floorPrimary }"
						>
							<img
								:src="map.mapImageUrl"
								:alt="map.name"
								class="h-full w-full object-cover"
								style="image-rendering: pixelated"
							>
							<div class="absolute left-3 top-3">
								<UBadge color="neutral" variant="solid" size="xs">
									{{ map.defaultMode === 'free' ? 'Eksplorasi Bebas' : 'Jalur Berurutan' }}
								</UBadge>
							</div>
							<div class="absolute right-3 top-3">
								<UBadge color="success" variant="solid" size="xs">
									Maks {{ map.maxPlayers }} Siswa
								</UBadge>
							</div>
						</div>

						<h2 class="mt-4 text-lg font-bold text-highlighted">
							{{ map.name }}
						</h2>
						<p class="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
							{{ map.description }}
						</p>
					</div>

					<div class="mt-5 pt-3 border-t border-default flex items-center justify-between gap-3">
						<span class="text-xs font-mono text-muted">
							{{ map.widthTiles }}×{{ map.heightTiles }} petak
						</span>
						<UButton
							color="primary"
							size="sm"
							icon="i-lucide-arrow-right"
							label="Pilih Peta"
							@click="selectMap(map)"
						/>
					</div>
				</UCard>
			</div>
		</section>

		<!-- ================= STEP 2: JENJANG & MAPEL ================= -->
		<section v-else-if="currentStep === 2" class="mt-8 space-y-6">
			<UCard :ui="{ header: 'border-b border-default', body: 'p-6 sm:p-8' }">
				<template #header>
					<h2 class="text-xl font-bold text-highlighted">
						Jenjang Pendidikan & Informasi Kuis
					</h2>
					<p class="mt-1 text-xs text-muted">
						Informasi ini membantu guru lain menemukan kuis Anda di perpustakaan terbuka dan menyesuaikan generator soal AI.
					</p>
				</template>

				<div class="grid gap-6 sm:grid-cols-2">
					<!-- Pilihan Jenjang -->
					<UFormField label="Jenjang Pendidikan" class="sm:col-span-2">
						<div class="flex flex-wrap gap-2">
							<UButton
								v-for="lvl in SCHOOL_LEVEL_OPTIONS"
								:key="lvl.id"
								:color="schoolLevel === lvl.id ? 'primary' : 'neutral'"
								:variant="schoolLevel === lvl.id ? 'solid' : 'outline'"
								size="md"
								:label="lvl.label"
								@click="schoolLevel = lvl.id"
							/>
						</div>
					</UFormField>

					<!-- Tingkat Kelas -->
					<UFormField label="Tingkat Kelas">
						<USelect
							v-model="gradeLabel"
							:items="availableGrades.map(g => ({ label: g, value: g }))"
							size="xl"
							class="w-full"
						/>
					</UFormField>

					<!-- Mode Kuis -->
					<UFormField label="Mode Petualangan Siswa">
						<USelect
							v-model="selectedMode"
							:items="[
								{ label: 'Eksplorasi Bebas (acak pos per siswa)', value: 'free' },
								{ label: 'Jalur Berurutan (Pos #1 s/d selesai)', value: 'linear' }
							]"
							size="xl"
							class="w-full"
						/>
					</UFormField>

					<!-- Mata Pelajaran -->
					<UFormField label="Mata Pelajaran Kurikulum Indonesia" class="sm:col-span-2">
						<div class="flex flex-wrap gap-2">
							<UButton
								v-for="subj in INDONESIAN_SUBJECTS"
								:key="subj"
								:color="subject === subj ? 'primary' : 'neutral'"
								:variant="subject === subj ? 'solid' : 'outline'"
								size="xs"
								:label="subj"
								@click="subject = subj"
							/>
						</div>
					</UFormField>

					<!-- Judul Kuis -->
					<UFormField label="Judul Kuis">
						<UInput
							v-model="title"
							placeholder="Misal: Eksplorasi Ekosistem & Rantai Makanan"
							size="xl"
							class="w-full"
						/>
					</UFormField>

					<!-- Nama Pengajar / Sekolah -->
					<UFormField label="Nama Guru / Sekolah">
						<UInput
							v-model="ownerName"
							placeholder="Misal: Bu Ratna, S.Pd. (SMPN 1 Bandung)"
							size="xl"
							class="w-full"
						/>
					</UFormField>
				</div>

				<div class="mt-8 pt-5 border-t border-default flex items-center justify-between">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-arrow-left"
						label="Kembali ke Peta"
						@click="currentStep = 1"
					/>
					<UButton
						color="primary"
						icon="i-lucide-arrow-right"
						trailing
						label="Lanjut ke Editor Soal"
						@click="currentStep = 3"
					/>
				</div>
			</UCard>
		</section>

		<!-- ================= STEP 3: EDITOR SOAL & AI ================= -->
		<section v-else class="mt-8 grid gap-6 lg:grid-cols-12">
			<!-- Kolom Kiri: AI Generator & Pengaturan -->
			<div class="space-y-6 lg:col-span-4">
				<!-- Asisten AI -->
				<UCard :ui="{ header: 'border-b border-default', body: 'p-5 space-y-4' }">
					<template #header>
						<div class="flex items-center gap-2">
							<UIcon name="i-lucide-sparkles" class="size-5 text-primary" />
							<h3 class="text-base font-bold text-highlighted">
								Asisten Soal AI
							</h3>
						</div>
						<p class="text-xs text-muted mt-1">
							Buat draf soal otomatis sesuai kurikulum jenjang {{ schoolLevel.toUpperCase() }}.
						</p>
					</template>

					<UFormField label="Topik / Materi Bahasan">
						<UInput
							v-model="aiTopic"
							placeholder="Misal: Sistem Tata Surya dan Planet"
							size="lg"
							class="w-full"
						/>
					</UFormField>

					<UFormField label="Ringkasan Materi (Opsional)">
						<UTextarea
							v-model="aiSourceText"
							placeholder="Tempel cuplikan materi buku ajar di sini..."
							:rows="3"
							class="w-full"
						/>
					</UFormField>

					<div class="grid grid-cols-2 gap-3">
						<UFormField label="Jumlah Soal">
							<UInput
								v-model.number="aiCount"
								type="number"
								min="2"
								max="10"
								size="lg"
								class="w-full"
							/>
						</UFormField>

						<UFormField label="API Key (Opsional)">
							<UInput
								v-model="aiByokKey"
								type="password"
								placeholder="BYOK"
								size="lg"
								class="w-full"
							/>
						</UFormField>
					</div>

					<UButton
						color="primary"
						class="w-full"
						size="lg"
						icon="i-lucide-wand-sparkles"
						:loading="aiLoading"
						label="Buat Soal Otomatis"
						@click="handleAiGenerate"
					/>
				</UCard>

				<!-- Pengaturan Mekanik & Impor CSV -->
				<UCard :ui="{ header: 'border-b border-default', body: 'p-5 space-y-4' }">
					<template #header>
						<h3 class="text-base font-bold text-highlighted">
							Mekanik & Impor CSV
						</h3>
					</template>

					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<div class="text-xs font-bold text-highlighted">Tampilkan Kunci Jawaban</div>
							<div class="text-[11px] text-muted">Siswa melihat jawaban setelah menjawab</div>
						</div>
						<USwitch v-model="showIncorrectAnswer" />
					</div>

					<div class="pt-4 border-t border-default">
						<UFileUpload
							v-model="csvFile"
							accept=".csv,.txt"
							icon="i-lucide-file-spreadsheet"
							label="Impor Cepat Soal dari CSV"
							description="Satu baris per soal: pertanyaan,jawaban"
							:preview="false"
							class="min-h-28 w-full"
						/>
					</div>
				</UCard>
			</div>

			<!-- Kolom Kanan: Daftar Soal -->
			<div class="space-y-5 lg:col-span-8">
				<!-- Toolbar Aksi Tambah Soal & Simpan -->
				<UCard :ui="{ body: 'p-4 flex flex-wrap items-center justify-between gap-3' }">
					<div class="flex flex-wrap items-center gap-2">
						<UButton
							v-for="adder in questionAdders"
							:key="adder.type"
							color="neutral"
							variant="outline"
							size="sm"
							:icon="adder.icon"
							:label="`+ ${adder.label}`"
							@click="addBlankQuestion(adder.type)"
						/>
					</div>

					<div class="flex items-center gap-2">
						<UButton
							color="neutral"
							variant="outline"
							size="md"
							:loading="saving"
							:label="isEditing ? 'Simpan Perubahan' : 'Simpan Draf'"
							@click="saveAndLaunch(false)"
						/>
						<UButton
							color="primary"
							size="md"
							icon="i-lucide-play"
							:loading="saving"
							label="Simpan & Buka Kelas"
							@click="saveAndLaunch(true)"
						/>
					</div>
				</UCard>

				<!-- Daftar Kartu Soal -->
				<div class="space-y-4">
					<UCard
						v-for="(q, qIdx) in questions"
						:key="q.id"
						:ui="{ header: 'border-b border-default', body: 'p-5 space-y-4' }"
					>
						<template #header>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<UBadge color="primary" variant="solid" size="sm">
										Pos #{{ qIdx + 1 }}
									</UBadge>
									<UBadge
										:color="typeLabels[q.type]?.color || 'neutral'"
										variant="subtle"
										size="sm"
										:icon="typeLabels[q.type]?.icon"
									>
										{{ typeLabels[q.type]?.label }}
									</UBadge>
								</div>

								<UButton
									color="error"
									variant="ghost"
									size="xs"
									icon="i-lucide-trash-2"
									label="Hapus"
									@click="removeQuestion(qIdx)"
								/>
							</div>
						</template>

						<!-- Input Kalimat Pertanyaan -->
						<UFormField label="Pertanyaan">
							<UInput
								v-model="q.prompt"
								placeholder="Tulis kalimat pertanyaan soal..."
								size="lg"
								class="w-full"
							/>
						</UFormField>

						<!-- Karakter NPC & Posisi di Peta -->
						<div class="rounded-xl border border-default bg-muted/10 p-3.5 space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-muted">Karakter Pembawa Soal</span>
								<div class="flex items-center gap-2">
									<UButton
										color="primary"
										variant="subtle"
										size="xs"
										icon="i-lucide-map-pin"
										:label="q.placement ? `Kolom ${q.placement.tileX}, Baris ${q.placement.tileY}` : 'Pilih Posisi di Peta'"
										@click="placementIndex = qIdx"
									/>
								</div>
							</div>

							<!-- Pemilih Karakter NPC -->
							<div class="flex flex-wrap items-end gap-2">
								<UButton
									:color="!q.npcId ? 'primary' : 'neutral'"
									:variant="!q.npcId ? 'solid' : 'outline'"
									size="xs"
									label="Acak"
									@click="q.npcId = undefined"
								/>
								<UButton
									v-for="npc in NPC_CHARACTERS"
									:key="npc.id"
									:color="q.npcId === npc.id ? 'primary' : 'neutral'"
									:variant="q.npcId === npc.id ? 'subtle' : 'outline'"
									:aria-label="npc.label"
									:aria-pressed="q.npcId === npc.id"
									class="h-11 items-end px-1.5 pb-1"
									@click="q.npcId = npc.id"
								>
									<GameNpcSprite
										:npc-id="npc.id"
										:scale="2"
										:animated="q.npcId === npc.id"
									/>
								</UButton>
							</div>
						</div>

						<!-- Tipe Pilihan Ganda -->
						<div v-if="q.type === 'multiple'" class="grid gap-2 sm:grid-cols-2">
							<div
								v-for="opt in q.options"
								:key="opt.id"
								class="flex items-center gap-2 rounded-xl border border-default p-2.5 bg-default"
								:class="q.answer[0] === opt.id ? 'border-primary ring-1 ring-primary' : ''"
							>
								<UButton
									:icon="q.answer[0] === opt.id ? 'i-lucide-circle-check-big' : 'i-lucide-circle'"
									:color="q.answer[0] === opt.id ? 'primary' : 'neutral'"
									variant="ghost"
									size="sm"
									:aria-label="`Jadikan pilihan ${opt.id.toUpperCase()} jawaban benar`"
									:aria-pressed="q.answer[0] === opt.id"
									@click="q.answer = [opt.id]"
								/>
								<UInput
									v-model="opt.text"
									:placeholder="`Pilihan ${opt.id.toUpperCase()}`"
									size="sm"
									class="w-full"
								/>
							</div>
						</div>

						<!-- Tipe Benar / Salah -->
						<div v-else-if="q.type === 'ox'" class="flex items-center gap-3">
							<UButton
								:color="q.answer[0] === 'o' ? 'success' : 'neutral'"
								:variant="q.answer[0] === 'o' ? 'solid' : 'outline'"
								size="md"
								icon="i-lucide-check"
								label="Kunci: BENAR (O)"
								@click="q.answer = ['o']"
							/>
							<UButton
								:color="q.answer[0] === 'x' ? 'error' : 'neutral'"
								:variant="q.answer[0] === 'x' ? 'solid' : 'outline'"
								size="md"
								icon="i-lucide-x"
								label="Kunci: SALAH (X)"
								@click="q.answer = ['x']"
							/>
						</div>

						<!-- Tipe Isian Singkat -->
						<div v-else>
							<UFormField label="Kunci Jawaban Singkat (pisahkan tanda koma bila ada sinonim)">
								<UInput
									:model-value="q.answer.join(', ')"
									placeholder="Misal: danau toba, toba"
									size="lg"
									class="w-full"
									@update:model-value="onAnswerInput(q, $event)"
								/>
							</UFormField>
						</div>
					</UCard>
				</div>
			</div>
		</section>

		<!-- Modal Penempatan Posisi di Peta -->
		<BuildMapPlacementPicker
			v-if="placementIndex !== null && selectedMap"
			:map="selectedMap"
			:questions="questions"
			:active-index="placementIndex"
			@pick="setPlacement($event)"
			@clear="setPlacement(undefined)"
			@close="placementIndex = null"
		/>
	</UContainer>
</template>
