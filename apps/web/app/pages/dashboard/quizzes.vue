<script setup lang="ts">
	import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
	import { MAP_CATALOG, SCHOOL_LEVEL_OPTIONS, type QuizDefinition } from '@petakuis/shared'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Koleksi Kuis' })

	const { launchingId, launch } = useLaunchSession()

	const { data, status } = await useFetch<{ quizzes: QuizDefinition[] }>('/api/quizzes', {
		key: 'dashboard-quizzes'
	})

	const search = ref('')
	const level = ref('all')

	const levelItems = [
		{ label: 'Semua jenjang', value: 'all' },
		...SCHOOL_LEVEL_OPTIONS.map(l => ({ label: l.label, value: l.id }))
	]

	const filtered = computed(() => {
		const term = search.value.trim().toLowerCase()
		return (data.value?.quizzes || []).filter((q) => {
			const matchLevel = level.value === 'all' || q.schoolLevel === level.value
			const matchTerm
				= !term
					|| q.title.toLowerCase().includes(term)
					|| q.subject.toLowerCase().includes(term)
			return matchLevel && matchTerm
		})
	})

	const pageSize = 10
	const page = ref(1)
	const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

	watch([search, level], () => {
		page.value = 1
	})

	function mapName(mapId: string) {
		return MAP_CATALOG.find(m => m.id === mapId)?.name ?? 'Peta tidak dikenal'
	}

	function rowItems(quiz: QuizDefinition): DropdownMenuItem[][] {
		return [
			[
				{ label: 'Buka kelas live', icon: 'i-lucide-presentation', onSelect: () => launch(quiz.id) },
				{ label: 'Coba sebagai siswa', icon: 'i-lucide-gamepad-2', to: '/play/123456?nickname=GuruDemo&colorway=merah-putih' }
			],
			[
				{ label: 'Kuis baru di peta ini', icon: 'i-lucide-map-pin', to: `/build?mapId=${quiz.mapId}` }
			]
		]
	}

	const columns: TableColumn<QuizDefinition>[] = [
		{ accessorKey: 'title', header: 'Kuis' },
		{ accessorKey: 'subject', header: 'Mapel' },
		{ id: 'questions', header: 'Soal' },
		{ accessorKey: 'mode', header: 'Mode' },
		{ id: 'map', header: 'Peta' },
		{ id: 'actions', header: '' }
	]
</script>

<template>
	<UDashboardPanel id="dashboard-quizzes">
		<template #header>
			<UDashboardNavbar title="Koleksi Kuis">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<UButton label="Buat Kuis" icon="i-lucide-plus" size="md" to="/build" />
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<div class="flex flex-wrap items-center justify-between gap-1.5">
				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Cari judul atau mapel..."
					class="max-w-sm"
				/>
				<USelect
					v-model="level"
					:items="levelItems"
					class="min-w-40"
					:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
				/>
			</div>

			<UTable
				:data="paged"
				:columns="columns"
				:loading="status === 'pending'"
				class="shrink-0"
				:ui="{
					base: 'table-fixed border-separate border-spacing-0',
					thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
					tbody: '[&>tr]:last:[&>td]:border-b-0',
					th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
					td: 'border-b border-default',
					separator: 'h-0'
				}"
			>
				<template #title-cell="{ row }">
					<p class="truncate font-medium text-highlighted">{{ row.original.title }}</p>
					<p class="truncate text-xs text-muted">
						{{ row.original.schoolLevel.toUpperCase() }} · {{ row.original.gradeLabel }} · {{ row.original.ownerName }}
					</p>
				</template>
				<template #subject-cell="{ row }">
					<UBadge :label="row.original.subject" color="neutral" variant="subtle" />
				</template>
				<template #questions-cell="{ row }">
					{{ row.original.questions.length }}
				</template>
				<template #mode-cell="{ row }">
					<UBadge
						:label="modeLabel(row.original.mode)"
						:icon="row.original.mode === 'linear' ? 'i-lucide-list-ordered' : 'i-lucide-shuffle'"
						color="warning"
						variant="subtle"
					/>
				</template>
				<template #map-cell="{ row }">
					<span class="block truncate text-muted">{{ mapName(row.original.mapId) }}</span>
				</template>
				<template #actions-cell="{ row }">
					<div class="flex items-center justify-end gap-1">
						<UButton
							label="Mulai"
							icon="i-lucide-play"
							size="sm"
							class="hidden sm:inline-flex"
							:loading="launchingId === row.original.id"
							@click="launch(row.original.id)"
						/>
						<UDropdownMenu :items="rowItems(row.original)" :content="{ align: 'end' }">
							<UButton
								icon="i-lucide-ellipsis-vertical"
								color="neutral"
								variant="ghost"
								aria-label="Aksi lain"
							/>
						</UDropdownMenu>
					</div>
				</template>
				<template #empty>
					<UEmpty
						icon="i-lucide-search-x"
						title="Kuis tidak ditemukan"
						description="Ubah kata kunci atau filter jenjang."
						variant="naked"
					/>
				</template>
			</UTable>

			<div class="mt-auto flex items-center justify-between gap-3 border-t border-default pt-4">
				<p class="text-sm text-muted">
					{{ filtered.length }} kuis
				</p>
				<UPagination
					v-model:page="page"
					:items-per-page="pageSize"
					:total="filtered.length"
				/>
			</div>
		</template>
	</UDashboardPanel>
</template>
