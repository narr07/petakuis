<script setup lang="ts">
	import {
		INDONESIAN_SUBJECTS,
		SCHOOL_LEVEL_OPTIONS,
		type QuizDefinition
	} from '@petakuis/shared'

	useSeoMeta({
		title: 'Jelajah Kuis',
		description: 'Kuis siap pakai dari komunitas guru Indonesia yang bisa langsung dibuka untuk kelas live.'
	})

	const { launchingId, launch } = useLaunchSession()

	const selectedLevel = ref('all')
	const selectedSubject = ref('all')
	const searchInput = ref('')
	const searchQuery = refDebounced(searchInput, 300)

	// Query berupa ref, jadi useFetch otomatis mengambil ulang saat filter berubah
	const { data, status } = await useFetch<{ quizzes: QuizDefinition[] }>('/api/quizzes', {
		query: {
			schoolLevel: selectedLevel,
			subject: selectedSubject,
			q: computed(() => searchQuery.value.trim())
		}
	})

	const quizzes = computed(() => data.value?.quizzes || [])

	const levelItems = [
		{ label: 'Semua jenjang', value: 'all' },
		...SCHOOL_LEVEL_OPTIONS.map(l => ({ label: l.label, value: l.id }))
	]

	const subjectItems = [
		{ label: 'Semua mata pelajaran', value: 'all' },
		...INDONESIAN_SUBJECTS.map(s => ({ label: s, value: s }))
	]

	const hasFilter = computed(
		() => selectedLevel.value !== 'all' || selectedSubject.value !== 'all' || searchInput.value !== ''
	)

	function resetFilters() {
		selectedLevel.value = 'all'
		selectedSubject.value = 'all'
		searchInput.value = ''
	}
</script>

<template>
	<UContainer>
		<UPage>
			<UPageHeader
				headline="Perpustakaan terbuka"
				title="Jelajahi kuis komunitas guru"
				description="Semua kuis di bawah ini bisa langsung dibuka untuk sesi kelas live tanpa biaya."
				:links="[{ label: 'Susun Kuis Baru', to: '/build', icon: 'i-lucide-plus' }]"
			/>

			<UPageBody>
				<UPageCard variant="subtle">
					<div class="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
						<UFormField label="Cari judul atau materi">
							<UInput
								v-model="searchInput"
								type="search"
								icon="i-lucide-search"
								placeholder="Misal: Pythagoras, Geografi..."
								:loading="status === 'pending'"
								class="w-full"
							/>
						</UFormField>

						<UFormField label="Jenjang">
							<USelect
								v-model="selectedLevel"
								:items="levelItems"
								icon="i-lucide-school"
								class="w-full"
							/>
						</UFormField>

						<UFormField label="Mata pelajaran">
							<USelect
								v-model="selectedSubject"
								:items="subjectItems"
								icon="i-lucide-book-open"
								class="w-full"
							/>
						</UFormField>

						<UButton
							v-if="hasFilter"
							color="neutral"
							variant="outline"
							icon="i-lucide-rotate-ccw"
							label="Reset"
							@click="resetFilters"
						/>
					</div>
				</UPageCard>

				<div class="flex items-center justify-between gap-2">
					<UBadge
						color="neutral"
						variant="subtle"
						size="lg"
						icon="i-lucide-library"
						:label="`${quizzes.length} kuis ditemukan`"
					/>
				</div>

				<UPageGrid
					v-if="quizzes.length"
					class="transition-opacity lg:grid-cols-2"
					:class="{ 'opacity-60': status === 'pending' }"
				>
					<QuizCard
						v-for="quiz in quizzes"
						:key="quiz.id"
						:quiz="quiz"
						:launching="launchingId === quiz.id"
						show-samples
						@launch="launch"
					/>
				</UPageGrid>

				<UEmpty
					v-else
					icon="i-lucide-search-x"
					title="Kuis tidak ditemukan"
					description="Coba kata kunci lain atau hapus filter yang aktif."
					:actions="[{ label: 'Reset Filter', icon: 'i-lucide-rotate-ccw', onClick: resetFilters }]"
				/>
			</UPageBody>
		</UPage>
	</UContainer>
</template>
