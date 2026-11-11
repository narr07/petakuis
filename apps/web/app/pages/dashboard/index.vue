<script setup lang="ts">
	import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
	import { MAP_CATALOG, type QuizDefinition } from '@petakuis/shared'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Ringkasan Dashboard' })

	const { roleLabel } = useDashboardRole()
	const { launchingId, launch } = useLaunchSession()

	const { data, status } = await useFetch<{ quizzes: QuizDefinition[] }>('/api/quizzes', {
		key: 'dashboard-quizzes',
		// Hanya kuis milik guru yang masuk (admin: semua kuis).
		query: { mine: 1 }
	})
	const quizzes = computed(() => data.value?.quizzes || [])
	const recentQuizzes = computed(() => quizzes.value.slice(0, 5))

	const stats = computed(() => [
		{ title: 'Koleksi kuis', value: quizzes.value.length, icon: 'i-lucide-book-open', to: '/dashboard/quizzes' },
		{
			title: 'Total soal',
			value: quizzes.value.reduce((sum, q) => sum + q.questions.length, 0),
			icon: 'i-lucide-list-checks',
			to: '/dashboard/quizzes'
		},
		{ title: 'Peta tersedia', value: MAP_CATALOG.length, icon: 'i-lucide-map', to: '/dashboard/maps' },
		{ title: 'Room demo aktif', value: DEMO_ROOMS.length, icon: 'i-lucide-radio-tower', to: '/dashboard/reports' }
	])

	const quickActions = [
		{
			title: 'Susun kuis baru',
			description: 'Pilih peta, jenjang, lalu tulis soal atau buat dengan AI.',
			icon: 'i-lucide-pencil-ruler',
			to: '/build'
		},
		{
			title: 'Halaman PIN siswa',
			description: 'Buka di tab baru atau tampilkan di proyektor kelas.',
			icon: 'i-lucide-gamepad-2',
			to: '/join',
			target: '_blank'
		},
		{
			title: 'Coba room demo',
			description: 'Rasakan alur bermain siswa di room PIN 123456.',
			icon: 'i-lucide-play',
			to: '/play/123456?nickname=GuruDemo&colorway=merah-putih'
		}
	]

	const createItems: DropdownMenuItem[][] = [
		[
			{ label: 'Kuis baru', icon: 'i-lucide-file-plus', to: '/build' },
			{ label: 'Kuis dari peta', icon: 'i-lucide-map-pin', to: '/dashboard/maps' }
		]
	]

	const columns: TableColumn<QuizDefinition>[] = [
		{ accessorKey: 'title', header: 'Kuis' },
		{ accessorKey: 'subject', header: 'Mapel' },
		{ id: 'questions', header: 'Soal' },
		{ id: 'actions', header: '' }
	]
</script>

<template>
	<UDashboardPanel id="dashboard-home">
		<template #header>
			<UDashboardNavbar title="Ringkasan" :ui="{ right: 'gap-3' }">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<UBadge
						:label="`Peran: ${roleLabel}`"
						color="neutral"
						variant="subtle"
						class="hidden sm:inline-flex"
					/>

					<UTooltip text="Buat baru" :kbds="['n']">
						<UDropdownMenu :items="createItems">
							<UButton
								icon="i-lucide-plus"
								size="md"
								class="rounded-full"
								aria-label="Buat baru"
							/>
						</UDropdownMenu>
					</UTooltip>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<UPageGrid class="gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-px">
				<UPageCard
					v-for="stat in stats"
					:key="stat.title"
					:icon="stat.icon"
					:title="stat.title"
					:to="stat.to"
					variant="subtle"
					:ui="{
						container: 'gap-y-1.5',
						wrapper: 'items-start',
						leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
						title: 'font-normal text-muted text-xs uppercase'
					}"
					class="hover:z-1 lg:rounded-none lg:first:rounded-l-lg lg:last:rounded-r-lg"
				>
					<span class="text-2xl font-semibold text-highlighted">{{ stat.value }}</span>
				</UPageCard>
			</UPageGrid>

			<div class="grid items-start gap-4 sm:gap-6 xl:grid-cols-3">
				<UCard
					variant="subtle"
					class="xl:col-span-2"
					:ui="{ body: 'p-0 sm:p-0', footer: 'flex justify-end py-2 sm:py-2' }"
				>
					<template #header>
						<p class="font-semibold text-highlighted">Kuis terbaru</p>
						<p class="text-sm text-muted">Buka langsung sebagai kelas live atau lihat koleksi lengkap.</p>
					</template>

					<UTable
						:data="recentQuizzes"
						:columns="columns"
						:loading="status === 'pending'"
						class="w-full"
						:ui="{ th: 'first:ps-4 sm:first:ps-6', td: 'first:ps-4 sm:first:ps-6 last:pe-4 sm:last:pe-6' }"
					>
						<template #title-cell="{ row }">
							<p class="font-medium text-highlighted">{{ row.original.title }}</p>
							<p class="text-xs text-muted">
								{{ row.original.schoolLevel.toUpperCase() }} · {{ row.original.gradeLabel }}
							</p>
						</template>
						<template #subject-cell="{ row }">
							<UBadge :label="row.original.subject" color="neutral" variant="subtle" />
						</template>
						<template #questions-cell="{ row }">
							{{ row.original.questions.length }}
						</template>
						<template #actions-cell="{ row }">
							<div class="text-right">
								<UButton
									label="Mulai"
									icon="i-lucide-play"
									size="sm"
									:loading="launchingId === row.original.id"
									@click="launch(row.original.id)"
								/>
							</div>
						</template>
						<template #empty>
							<UEmpty
								icon="i-lucide-book-open"
								title="Belum ada kuis"
								:actions="[{ label: 'Buat Kuis', to: '/build', icon: 'i-lucide-plus' }]"
								variant="naked"
							/>
						</template>
					</UTable>

					<template #footer>
						<UButton
							label="Lihat semua kuis"
							trailing-icon="i-lucide-arrow-right"
							color="neutral"
							variant="ghost"
							size="sm"
							to="/dashboard/quizzes"
						/>
					</template>
				</UCard>

				<div class="flex flex-col gap-4 sm:gap-6">
					<UPageCard
						v-for="action in quickActions"
						:key="action.title"
						v-bind="action"
						variant="subtle"
						spotlight
					/>
				</div>
			</div>
		</template>
	</UDashboardPanel>
</template>
