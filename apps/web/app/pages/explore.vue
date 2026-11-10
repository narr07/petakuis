<script setup lang="ts">
	import {
		INDONESIAN_SUBJECTS,
		SCHOOL_LEVEL_OPTIONS,
		type QuizDefinition
	} from '@petakuis/shared'

	const router = useRouter()
	const toast = useToast()

	const selectedLevel = ref('all')
	const selectedSubject = ref('all')
	const searchInput = ref('')
	const searchQuery = ref('')
	const launchingId = ref<string | null>(null)

	// Debounce pencarian supaya tidak fetch di setiap ketikan
	let timer: ReturnType<typeof setTimeout>
	watch(searchInput, (val) => {
		clearTimeout(timer)
		timer = setTimeout(() => (searchQuery.value = val.trim()), 300)
	})

	// Query berupa ref → useFetch otomatis fetch ulang, tidak perlu refresh()
	const { data, status } = await useFetch<{ quizzes: QuizDefinition[] }>(
		'/api/quizzes',
		{
			query: {
				schoolLevel: selectedLevel,
				subject: selectedSubject,
				q: searchQuery
			}
		}
	)

	const quizzes = computed(() => data.value?.quizzes || [])

	const levelItems = computed(() => [
		{ label: 'Semua Jenjang', value: 'all' },
		...SCHOOL_LEVEL_OPTIONS.map(l => ({ label: l.label, value: l.id }))
	])

	const subjectItems = computed(() => [
		{ label: 'Semua Mata Pelajaran', value: 'all' },
		...INDONESIAN_SUBJECTS.map(s => ({ label: s, value: s }))
	])

	const hasFilter = computed(
		() =>
			selectedLevel.value !== 'all'
			|| selectedSubject.value !== 'all'
			|| searchInput.value !== ''
	)

	function resetFilters() {
		selectedLevel.value = 'all'
		selectedSubject.value = 'all'
		searchInput.value = ''
		searchQuery.value = ''
	}

	const questionTypeMap: Record<string, { label: string, color: 'primary' | 'secondary' | 'warning' }> = {
		multiple: { label: 'PG', color: 'primary' },
		ox: { label: 'B/S', color: 'secondary' },
		text: { label: 'Isian', color: 'warning' }
	}

	function typeInfo(type: string) {
		return questionTypeMap[type] ?? questionTypeMap.text
	}

	async function launchLiveSession(quizId: string) {
		launchingId.value = quizId
		try {
			const res = await $fetch<{ ok: boolean, code: string }>('/api/sessions', {
				method: 'POST',
				body: { quizId, autoStart: true }
			})
			await router.push(`/host/${res.code}`)
		} catch {
			toast.add({
				title: 'Gagal membuka kelas',
				description: 'Coba lagi beberapa saat lagi.',
				color: 'error',
				icon: 'i-lucide-circle-alert'
			})
		} finally {
			launchingId.value = null
		}
	}
</script>

<template>
	<UContainer class="py-10">
		<!-- Header -->
		<UPageHeader
			headline="Perpustakaan terbuka"
			title="Jelajahi Kuis Komunitas Guru"
			description="Semua kuis di bawah ini bisa langsung dibuka untuk sesi kelas live atau dimodifikasi tanpa biaya."
			:ui="{ root: 'border-b-0 pb-0' }"
		>
			<template #links>
				<UButton
					to="/build"
					size="xl"
					icon="i-lucide-plus"
					label="Susun Kuis Baru"
				/>
			</template>
		</UPageHeader>

		<!-- Filter -->
		<UCard class="mt-6" :ui="{ body: 'p-4 sm:p-5' }">
			<div class="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
				<UFormField label="Cari judul atau materi">
					<UInput
						v-model="searchInput"
						type="search"
						icon="i-lucide-search"
						placeholder="Misal: Pythagoras, Geografi..."
						size="xl"
						class="w-full"
						:loading="status === 'pending'"
					/>
				</UFormField>

				<UFormField label="Jenjang">
					<USelect
						v-model="selectedLevel"
						:items="levelItems"
						icon="i-lucide-school"
						size="xl"
						class="w-full"
					/>
				</UFormField>

				<UFormField label="Mata pelajaran">
					<USelect
						v-model="selectedSubject"
						:items="subjectItems"
						icon="i-lucide-book-open"
						size="xl"
						class="w-full"
					/>
				</UFormField>

				<UButton
					v-if="hasFilter"
					color="neutral"
					variant="outline"
					size="xl"
					icon="i-lucide-rotate-ccw"
					label="Reset"
					@click="resetFilters"
				/>
			</div>
		</UCard>

		<!-- Jumlah hasil -->
		<div class="mt-8 flex items-center gap-2">
			<UBadge color="secondary" variant="solid" size="lg" icon="i-lucide-library">
				{{ quizzes.length }} kuis ditemukan
			</UBadge>
		</div>

		<!-- Daftar kuis -->
		<div
			v-if="quizzes.length"
			class="mt-4 grid gap-6 transition-opacity md:grid-cols-2"
			:class="{ 'opacity-60': status === 'pending' }"
		>
			<UCard
				v-for="quiz in quizzes"
				:key="quiz.id"
				class="flex flex-col"
				:ui="{ body: 'flex-1', header: 'bg-primary/10' }"
			>
				<template #header>
					<div class="flex flex-wrap items-center gap-1.5">
						<UBadge color="neutral" variant="solid" size="sm">
							{{ quiz.schoolLevel.toUpperCase() }} · {{ quiz.gradeLabel }}
						</UBadge>
						<UBadge color="primary" variant="subtle" size="sm">
							{{ quiz.subject }}
						</UBadge>
						<UBadge
							color="warning"
							variant="subtle"
							size="sm"
							:icon="quiz.mode === 'free' ? 'i-lucide-shuffle' : 'i-lucide-list-ordered'"
						>
							Mode {{ quiz.mode === 'free' ? 'Bebas' : 'Berurutan' }}
						</UBadge>
					</div>
				</template>

				<h2 class="text-xl font-bold leading-snug">
					{{ quiz.title }}
				</h2>
				<p class="mt-2 text-sm leading-relaxed text-muted">
					{{ quiz.description }}
				</p>

				<!-- Contoh soal -->
				<div class="mt-4 rounded-xl border-2 border-dashed border-accented bg-muted p-3">
					<p class="flex items-center gap-1.5 text-xs font-bold uppercase text-muted">
						<UIcon name="i-lucide-list-checks" class="size-4" />
						Contoh pertanyaan · {{ quiz.questions.length }} soal
					</p>
					<ul class="mt-2 space-y-1.5">
						<li
							v-for="q in quiz.questions.slice(0, 3)"
							:key="q.id"
							class="flex items-center gap-2 text-sm"
						>
							<UBadge
								:color="typeInfo(q.type).color"
								variant="subtle"
								size="sm"
								class="shrink-0"
							>
								{{ typeInfo(q.type).label }}
							</UBadge>
							<span class="truncate">{{ q.prompt }}</span>
						</li>
					</ul>
				</div>

				<template #footer>
					<div class="flex flex-wrap items-center justify-between gap-3">
						<span class="flex items-center gap-1.5 text-xs font-semibold text-primary">
							<UIcon name="i-lucide-graduation-cap" class="size-4" />
							{{ quiz.ownerName }}
						</span>
						<UButton
							icon="i-lucide-presentation"
							:label="launchingId === quiz.id ? 'Membuka kelas...' : 'Buka Kelas Live'"
							:loading="launchingId === quiz.id"
							@click="launchLiveSession(quiz.id)"
						/>
					</div>
				</template>
			</UCard>
		</div>

		<!-- Kosong -->
		<UEmpty
			v-else
			class="mt-4"
			icon="i-lucide-search-x"
			title="Kuis tidak ditemukan"
			description="Coba kata kunci lain atau hapus filter yang aktif."
			:actions="[{ label: 'Reset Filter', icon: 'i-lucide-rotate-ccw', onClick: resetFilters }]"
		/>
	</UContainer>
</template>