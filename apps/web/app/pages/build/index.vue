<script setup lang="ts">
	import {
		GAME_CONSTANTS,
		INDONESIAN_SUBJECTS,
		NPC_CHARACTERS,
		SCHOOL_LEVEL_OPTIONS,
		type GameMode,
		type MapTemplate,
		type QuestionType,
		parseQuizRows,
		type QuizDefinition,
		type QuizImportError,
		type QuizQuestion,
		type SchoolLevel,
		type TilePosition
	} from '@petakuis/shared'

	// Penyusun kuis tampil di dalam panel dashboard guru.
	definePageMeta({
		layout: 'dashboard'
	})

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

	// ---- Editor soal: daftar ringkas di kiri, satu soal aktif di kanan.
	const MAX_QUESTIONS = GAME_CONSTANTS.MAX_QUESTIONS_PER_QUIZ
	const activeIndex = ref(0)
	const activeQuestion = computed(() => questions.value[activeIndex.value] ?? null)
	const remainingSlots = computed(() => Math.max(0, MAX_QUESTIONS - questions.value.length))
	const atLimit = computed(() => remainingSlots.value === 0)

	watch(() => questions.value.length, (len) => {
		if (activeIndex.value > len - 1) activeIndex.value = Math.max(0, len - 1)
	})

	/** Soal siap dimainkan: kalimat terisi dan kunci jawaban lengkap. */
	function isQuestionComplete(q: QuizQuestion): boolean {
		if (!q.prompt.trim()) return false
		if (q.type === 'multiple') return q.options.every(o => o.text.trim()) && Boolean(q.answer[0])
		if (q.type === 'subjective') return q.answer.some(a => a.trim())
		return Boolean(q.answer[0])
	}

	const incompleteCount = computed(() => questions.value.filter(q => !isQuestionComplete(q)).length)

	function renumber() {
		questions.value.forEach((q, idx) => {
			q.order = idx + 1
		})
	}

	function warnLimit() {
		toast.add({
			title: `Batas ${MAX_QUESTIONS} soal tercapai`,
			description: `Setiap peta punya ${MAX_QUESTIONS} pos soal. Hapus soal lain dulu bila ingin menambah.`,
			icon: 'i-lucide-circle-alert',
			color: 'warning'
		})
	}

	function addBlankQuestion(type: QuestionType) {
		if (atLimit.value) return warnLimit()
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
		activeIndex.value = questions.value.length - 1
	}

	const addMenuItems = computed(() => questionAdders.map(adder => ({
		label: adder.label,
		icon: adder.icon,
		disabled: atLimit.value,
		onSelect: () => addBlankQuestion(adder.type)
	})))

	function removeQuestion(index: number) {
		questions.value.splice(index, 1)
		renumber()
		activeIndex.value = Math.min(index, Math.max(0, questions.value.length - 1))
	}

	function moveQuestion(index: number, delta: -1 | 1) {
		const target = index + delta
		if (target < 0 || target >= questions.value.length) return
		const list = questions.value
		const moved = list[index]!
		list[index] = list[target]!
		list[target] = moved
		renumber()
		activeIndex.value = target
	}

	function duplicateQuestion(index: number) {
		if (atLimit.value) return warnLimit()
		const source = questions.value[index]
		if (!source) return
		// Posisi di peta tidak ikut disalin: satu pos hanya untuk satu soal.
		const copy: QuizQuestion = { ...structuredClone(toRaw(source)), id: `q-${Date.now()}`, placement: undefined }
		questions.value.splice(index + 1, 0, copy)
		renumber()
		activeIndex.value = index + 1
	}

	// Soal aktif selalu terlihat di daftar (mis. setelah menambah soal ke-20).
	watch(activeIndex, () => {
		nextTick(() => {
			for (const sel of ['[data-question-list]', '[data-question-strip]']) {
				document.querySelector(`${sel} [aria-current="true"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
			}
		})
	})

	function goToQuestion(index: number) {
		activeIndex.value = Math.min(Math.max(0, index), questions.value.length - 1)
	}

	const aiOpen = ref(false)
	const excelOpen = ref(false)

	async function handleAiGenerate() {
		if (!aiTopic.value.trim()) {
			toast.add({
				title: 'Topik belum diisi',
				description: 'Masukkan topik atau kompetensi dasar kuis terlebih dahulu.',
				color: 'warning'
			})
			return
		}

		if (atLimit.value) return warnLimit()

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
						count: Math.min(aiCount.value, remainingSlots.value),
						sourceText: aiSourceText.value || undefined,
						apiKey: aiByokKey.value || undefined
					}
				}
			)

			if (res.ok && res.questions.length > 0) {
				const currentCount = questions.value.length
				const newItems = res.questions.slice(0, remainingSlots.value).map((q, idx) => ({
					...q,
					order: currentCount + idx + 1
				}))
				questions.value = [...questions.value, ...newItems]
				activeIndex.value = currentCount
				aiOpen.value = false
				toast.add({
					title: 'Soal AI Berhasil Ditambahkan',
					description: `${newItems.length} butir soal baru telah dimasukkan ke daftar kuis.`,
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

	// ---- Impor Excel: berkas dibaca di browser, kolom mengikuti templat yang bisa diunduh.
	const EXCEL_TEMPLATE_URL = '/templat/templat-soal-petakuis.xlsx'
	const excelFile = ref<File | null>(null)
	const excelImporting = ref(false)
	const excelErrors = ref<QuizImportError[]>([])

	watch(excelOpen, (open) => {
		if (open) excelErrors.value = []
	})

	watch(excelFile, (file) => {
		if (!file) return
		importExcelFile(file)
		nextTick(() => {
			excelFile.value = null
		})
	})

	async function importExcelFile(file: File) {
		if (atLimit.value) return warnLimit()
		if (!/\.xlsx$/i.test(file.name)) {
			toast.add({ title: 'Format belum didukung', description: 'Simpan berkas sebagai Excel .xlsx lalu unggah lagi.', color: 'warning' })
			return
		}
		excelImporting.value = true
		excelErrors.value = []
		try {
			// Pembaca Excel baru dimuat saat dibutuhkan supaya halaman tetap ringan.
			const { default: readExcelFile } = await import('read-excel-file/browser')
			const sheets = await readExcelFile(file)
			const sheet = sheets.find(sh => sh.sheet.trim().toLowerCase() === 'soal') ?? sheets[0]
			const { questions: parsed, errors } = parseQuizRows(sheet?.data ?? [], {
				idPrefix: `xl-${Date.now()}`,
				startOrder: questions.value.length + 1
			})
			const accepted = parsed.slice(0, remainingSlots.value)
			const overLimit = parsed.length - accepted.length
			excelErrors.value = errors

			if (accepted.length) {
				const firstNew = questions.value.length
				questions.value.push(...accepted)
				activeIndex.value = firstNew
			}
			// Jendela tetap terbuka bila ada baris bermasalah, supaya daftarnya bisa dibaca.
			if (!errors.length) excelOpen.value = false

			const notes = [
				errors.length ? `${errors.length} baris dilewati karena belum benar.` : '',
				overLimit ? `${overLimit} soal tidak masuk karena batas ${MAX_QUESTIONS} soal.` : ''
			].filter(Boolean).join(' ')
			toast.add({
				title: accepted.length ? `${accepted.length} soal berhasil diimpor` : 'Tidak ada soal yang diimpor',
				description: notes || 'Periksa kembali soal di daftar sebelum menyimpan.',
				icon: accepted.length ? 'i-lucide-circle-check' : 'i-lucide-circle-alert',
				color: accepted.length && !notes ? 'success' : 'warning'
			})
		} catch {
			toast.add({
				title: 'Berkas tidak bisa dibaca',
				description: 'Pastikan berkasnya Excel .xlsx. Paling aman isi dari templat yang disediakan.',
				icon: 'i-lucide-circle-alert',
				color: 'error'
			})
		} finally {
			excelImporting.value = false
		}
	}

	async function saveAndLaunch(launchNow: boolean) {
		if (questions.value.length === 0) {
			toast.add({ title: 'Belum ada soal', description: 'Tambahkan minimal satu soal dulu.', color: 'warning' })
			return
		}
		// Draf cukup berisi kalimat soal; membuka kelas butuh semua soal lengkap.
		const blocker = questions.value.findIndex(q => (launchNow ? !isQuestionComplete(q) : !q.prompt.trim()))
		if (blocker >= 0) {
			activeIndex.value = blocker
			toast.add({
				title: `Soal #${blocker + 1} belum lengkap`,
				description: launchNow
					? 'Lengkapi kalimat soal dan kunci jawabannya sebelum membuka kelas.'
					: 'Kalimat soal wajib diisi sebelum disimpan.',
				icon: 'i-lucide-circle-alert',
				color: 'warning'
			})
			return
		}
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
	<UDashboardPanel id="build-quiz">
		<template #header>
			<UDashboardNavbar :title="isEditing ? `Edit Kuis: ${title || 'Tanpa judul'}` : 'Buat Kuis Baru'">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-save"
						:loading="saving"
						:aria-label="isEditing ? 'Simpan Perubahan' : 'Simpan Draf'"
						@click="saveAndLaunch(false)"
					>
						<span class="hidden sm:inline">{{ isEditing ? 'Simpan Perubahan' : 'Simpan Draf' }}</span>
					</UButton>
					<UButton
						icon="i-lucide-play"
						:loading="saving"
						aria-label="Simpan & Buka Kelas"
						@click="saveAndLaunch(true)"
					>
						<span class="hidden sm:inline">Simpan &amp; Buka Kelas</span>
					</UButton>
				</template>
			</UDashboardNavbar>

			<UDashboardToolbar :ui="{ root: 'overflow-x-auto' }">
				<template #left>
					<div class="flex items-center gap-1.5">
						<UButton
							v-for="s in steps"
							:key="s.id"
							:color="currentStep === s.id ? 'primary' : 'neutral'"
							:variant="currentStep === s.id ? 'soft' : 'ghost'"
							size="sm"
							:icon="s.icon"
							:aria-label="s.label"
							@click="currentStep = s.id"
						>
							<span class="hidden md:inline">{{ s.label }}</span>
							<span class="md:hidden">{{ s.id }}</span>
						</UButton>
					</div>
				</template>

				<template v-if="currentStep === 3" #right>
					<div class="flex items-center gap-1.5">
						<UBadge
							:color="atLimit ? 'warning' : 'neutral'"
							variant="subtle"
							icon="i-lucide-list-ordered"
							:label="`${questions.length}/${MAX_QUESTIONS}`"
						/>
						<UBadge
							v-if="incompleteCount"
							color="warning"
							variant="subtle"
							icon="i-lucide-circle-alert"
							:label="`${incompleteCount} belum lengkap`"
							class="hidden xl:inline-flex"
						/>
						<UDropdownMenu :items="addMenuItems">
							<UButton
								icon="i-lucide-plus"
								trailing-icon="i-lucide-chevron-down"
								size="sm"
								:disabled="atLimit"
								aria-label="Tambah soal"
							>
								<span class="hidden sm:inline">Tambah soal</span>
							</UButton>
						</UDropdownMenu>
						<UButton
							icon="i-lucide-sparkles"
							color="neutral"
							variant="outline"
							size="sm"
							:disabled="atLimit"
							aria-label="Buat dengan AI"
							@click="aiOpen = true"
						>
							<span class="hidden lg:inline">Buat dengan AI</span>
						</UButton>
						<UButton
							icon="i-lucide-sheet"
							color="neutral"
							variant="outline"
							size="sm"
							:disabled="atLimit"
							aria-label="Impor Excel"
							@click="excelOpen = true"
						>
							<span class="hidden lg:inline">Impor Excel</span>
						</UButton>
					</div>
				</template>
			</UDashboardToolbar>
		</template>

		<template #body>
		<!-- ================= STEP 1: PILIH PETA ================= -->
		<section v-if="currentStep === 1" class="space-y-6">
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
		<section v-else-if="currentStep === 2" class="space-y-6">
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

					<!-- Pengaturan tampilan jawaban -->
					<UFormField
						label="Kunci jawaban"
						description="Setelah menjawab, siswa melihat jawaban yang benar."
						class="sm:col-span-2"
					>
						<USwitch v-model="showIncorrectAnswer" label="Tampilkan kunci jawaban ke siswa" />
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
		<!-- Daftar soal ringkas di kiri, hanya satu soal yang dibuka di kanan supaya tidak perlu menggulir jauh. -->
		<section v-else class="space-y-6">
			<div v-if="questions.length" class="grid items-start gap-6 lg:grid-cols-12">
				<!-- Daftar soal (layar lebar) -->
				<aside class="hidden lg:sticky lg:top-0 lg:col-span-4 lg:block">
					<UCard :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-2 sm:p-2' }">
						<template #header>
							<div class="flex items-center justify-between gap-2">
								<span class="text-sm font-bold text-highlighted">Daftar soal</span>
								<span class="text-xs text-muted">Klik untuk mengedit</span>
							</div>
						</template>

						<div data-question-list class="max-h-[calc(100dvh-14rem)] space-y-1 overflow-y-auto pr-1">
							<UButton
								v-for="(item, itemIdx) in questions"
								:key="item.id"
								block
								color="neutral"
								:variant="itemIdx === activeIndex ? 'soft' : 'ghost'"
								class="justify-start gap-3 py-2 text-left font-normal"
								:class="itemIdx === activeIndex ? 'ring-1 ring-primary/50' : ''"
								:aria-current="itemIdx === activeIndex ? 'true' : undefined"
								@click="goToQuestion(itemIdx)"
							>
								<span
									class="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold"
									:class="itemIdx === activeIndex ? 'bg-primary text-inverted' : 'bg-elevated text-muted'"
								>{{ itemIdx + 1 }}</span>
								<span class="min-w-0 flex-1">
									<span
										class="block truncate text-sm"
										:class="item.prompt.trim() ? 'font-medium text-highlighted' : 'italic text-dimmed'"
									>{{ item.prompt.trim() || 'Soal belum ditulis' }}</span>
									<span class="flex items-center gap-1 text-xs text-muted">
										<UIcon :name="typeLabels[item.type]?.icon ?? 'i-lucide-circle-help'" class="size-3.5" />
										{{ typeLabels[item.type]?.label }}
									</span>
								</span>
								<UIcon
									:name="isQuestionComplete(item) ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'"
									class="size-4 shrink-0"
									:class="isQuestionComplete(item) ? 'text-success' : 'text-warning'"
								/>
							</UButton>
						</div>
					</UCard>
				</aside>

				<div class="min-w-0 space-y-4 lg:col-span-8">
					<!-- Navigasi nomor soal (layar kecil) -->
					<div data-question-strip class="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
						<UButton
							v-for="(item, itemIdx) in questions"
							:key="item.id"
							size="sm"
							:color="itemIdx === activeIndex ? 'primary' : isQuestionComplete(item) ? 'neutral' : 'warning'"
							:variant="itemIdx === activeIndex ? 'solid' : 'outline'"
							class="w-10 shrink-0 justify-center font-mono"
							:label="String(itemIdx + 1)"
							:aria-label="`Soal ${itemIdx + 1}`"
							:aria-current="itemIdx === activeIndex ? 'true' : undefined"
							@click="goToQuestion(itemIdx)"
						/>
					</div>

					<!-- Editor satu soal aktif -->
					<UCard
						v-for="q in activeQuestion ? [activeQuestion] : []"
						:key="q.id"
						:ui="{ header: 'border-b border-default', body: 'p-5 space-y-5', footer: 'border-t border-default' }"
					>
						<template #header>
							<div class="flex flex-wrap items-center justify-between gap-3">
								<div class="flex items-center gap-2">
									<UBadge color="primary" variant="solid" size="md">
										Soal {{ activeIndex + 1 }} dari {{ questions.length }}
									</UBadge>
									<UBadge
										:color="typeLabels[q.type]?.color || 'neutral'"
										variant="subtle"
										size="md"
										:icon="typeLabels[q.type]?.icon"
									>
										{{ typeLabels[q.type]?.label }}
									</UBadge>
								</div>

								<div class="flex items-center gap-1">
									<UTooltip text="Naikkan urutan">
										<UButton
											icon="i-lucide-arrow-up"
											color="neutral"
											variant="ghost"
											size="sm"
											aria-label="Naikkan urutan"
											:disabled="activeIndex === 0"
											@click="moveQuestion(activeIndex, -1)"
										/>
									</UTooltip>
									<UTooltip text="Turunkan urutan">
										<UButton
											icon="i-lucide-arrow-down"
											color="neutral"
											variant="ghost"
											size="sm"
											aria-label="Turunkan urutan"
											:disabled="activeIndex === questions.length - 1"
											@click="moveQuestion(activeIndex, 1)"
										/>
									</UTooltip>
									<UTooltip text="Duplikat soal">
										<UButton
											icon="i-lucide-copy"
											color="neutral"
											variant="ghost"
											size="sm"
											aria-label="Duplikat soal"
											:disabled="atLimit"
											@click="duplicateQuestion(activeIndex)"
										/>
									</UTooltip>
									<UButton
										color="error"
										variant="ghost"
										size="sm"
										icon="i-lucide-trash-2"
										label="Hapus"
										@click="removeQuestion(activeIndex)"
									/>
								</div>
							</div>
						</template>

						<!-- Input Kalimat Pertanyaan -->
						<UFormField label="Pertanyaan">
							<UTextarea
								v-model="q.prompt"
								placeholder="Tulis kalimat pertanyaan soal..."
								autoresize
								:rows="2"
								:maxrows="6"
								size="lg"
								class="w-full"
							/>
						</UFormField>

						<!-- Tipe Pilihan Ganda -->
						<UFormField v-if="q.type === 'multiple'" label="Pilihan jawaban" description="Klik bulatan di kiri untuk menandai jawaban yang benar.">
							<div class="grid gap-2 sm:grid-cols-2">
								<div
									v-for="opt in q.options"
									:key="opt.id"
									class="flex items-center gap-2 rounded-xl border border-default bg-default p-2.5"
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
						</UFormField>

						<!-- Tipe Benar / Salah -->
						<UFormField v-else-if="q.type === 'ox'" label="Kunci jawaban">
							<div class="flex flex-wrap items-center gap-3">
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
						</UFormField>

						<!-- Tipe Isian Singkat -->
						<UFormField v-else label="Kunci Jawaban Singkat (pisahkan tanda koma bila ada sinonim)">
							<UInput
								:model-value="q.answer.join(', ')"
								placeholder="Misal: danau toba, toba"
								size="lg"
								class="w-full"
								@update:model-value="onAnswerInput(q, $event)"
							/>
						</UFormField>

						<!-- Karakter NPC & Posisi di Peta -->
						<div class="space-y-3 rounded-xl border border-default bg-muted/10 p-3.5">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<span class="text-xs font-bold text-muted">Karakter Pembawa Soal</span>
								<UButton
									color="primary"
									variant="subtle"
									size="xs"
									icon="i-lucide-map-pin"
									:label="q.placement ? `Kolom ${q.placement.tileX}, Baris ${q.placement.tileY}` : 'Pilih Posisi di Peta'"
									@click="placementIndex = activeIndex"
								/>
							</div>

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

						<template #footer>
							<div class="flex items-center justify-between gap-3">
								<UButton
									icon="i-lucide-arrow-left"
									label="Sebelumnya"
									color="neutral"
									variant="outline"
									:disabled="activeIndex === 0"
									@click="goToQuestion(activeIndex - 1)"
								/>
								<UButton
									v-if="activeIndex < questions.length - 1"
									trailing-icon="i-lucide-arrow-right"
									label="Berikutnya"
									@click="goToQuestion(activeIndex + 1)"
								/>
								<UButton
									v-else
									icon="i-lucide-plus"
									:label="`Tambah ${typeLabels[q.type]?.label ?? 'soal'}`"
									:disabled="atLimit"
									@click="addBlankQuestion(q.type)"
								/>
							</div>
						</template>
					</UCard>
				</div>
			</div>

			<UEmpty
				v-else
				icon="i-lucide-list-plus"
				title="Belum ada soal"
				:description="`Tambahkan soal satu per satu, buat dengan AI, atau impor dari Excel. Maksimal ${MAX_QUESTIONS} soal per kuis.`"
				:actions="[
					{ label: 'Pilihan Ganda', icon: 'i-lucide-list-checks', onClick: () => addBlankQuestion('multiple') },
					{ label: 'Buat dengan AI', icon: 'i-lucide-sparkles', color: 'neutral', variant: 'outline', onClick: () => { aiOpen = true } }
				]"
			/>

			<!-- Panel AI -->
			<USlideover
				v-model:open="aiOpen"
				title="Asisten Soal AI"
				:description="`Draf soal sesuai kurikulum jenjang ${schoolLevel.toUpperCase()}. Sisa tempat: ${remainingSlots} soal.`"
			>
				<template #body>
					<div class="space-y-4">
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
								:rows="5"
								class="w-full"
							/>
						</UFormField>

						<div class="grid grid-cols-2 gap-3">
							<UFormField label="Jumlah Soal">
								<UInput
									v-model.number="aiCount"
									type="number"
									min="2"
									:max="Math.min(10, remainingSlots)"
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
					</div>
				</template>

				<template #footer>
					<UButton
						color="primary"
						block
						size="lg"
						icon="i-lucide-wand-sparkles"
						:loading="aiLoading"
						:disabled="atLimit"
						label="Buat Soal Otomatis"
						@click="handleAiGenerate"
					/>
				</template>
			</USlideover>

			<!-- Impor Excel -->
			<UModal
				v-model:open="excelOpen"
				title="Impor soal dari Excel"
				description="Isi templat, lalu unggah berkasnya. Ketiga jenis soal didukung."
				:ui="{ content: 'sm:max-w-xl' }"
			>
				<template #body>
					<div class="space-y-5">
						<ol class="space-y-3 text-sm">
							<li class="flex gap-3">
								<UBadge label="1" color="primary" variant="soft" class="size-6 shrink-0 justify-center" />
								<div class="flex-1 space-y-2">
									<p class="font-medium text-highlighted">
										Unduh templat Excel
									</p>
									<UButton
										:to="EXCEL_TEMPLATE_URL"
										external
										download="templat-soal-petakuis.xlsx"
										icon="i-lucide-download"
										color="neutral"
										variant="outline"
										size="sm"
										label="templat-soal-petakuis.xlsx"
									/>
								</div>
							</li>
							<li class="flex gap-3">
								<UBadge label="2" color="primary" variant="soft" class="size-6 shrink-0 justify-center" />
								<div class="flex-1">
									<p class="font-medium text-highlighted">
										Isi lembar "Soal", satu baris per soal
									</p>
									<p class="text-muted">
										Jenis soal dipilih dari daftar. Kunci jawaban: huruf A–D untuk pilihan ganda, Benar/Salah, atau teks jawaban untuk isian singkat (sinonim dipisah koma). Lihat lembar "Contoh".
									</p>
								</div>
							</li>
							<li class="flex gap-3">
								<UBadge label="3" color="primary" variant="soft" class="size-6 shrink-0 justify-center" />
								<p class="flex-1 font-medium text-highlighted">
									Unggah berkas .xlsx di bawah ini
								</p>
							</li>
						</ol>

						<UFileUpload
							v-model="excelFile"
							accept=".xlsx"
							icon="i-lucide-sheet"
							label="Pilih atau seret berkas Excel (.xlsx)"
							:description="`Sisa tempat: ${remainingSlots} soal. Google Sheets: File > Download > Microsoft Excel.`"
							:preview="false"
							:disabled="excelImporting || atLimit"
							class="min-h-32 w-full"
						/>

						<UAlert
							v-if="excelErrors.length"
							color="warning"
							variant="subtle"
							icon="i-lucide-circle-alert"
							:title="`${excelErrors.length} baris dilewati`"
						>
							<template #description>
								<ul class="mt-1 max-h-40 space-y-1 overflow-y-auto">
									<li v-for="err in excelErrors" :key="err.row">
										<span class="font-semibold">Baris {{ err.row }}:</span> {{ err.message }}
									</li>
								</ul>
							</template>
						</UAlert>
					</div>
				</template>
			</UModal>
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
		</template>
	</UDashboardPanel>
</template>
