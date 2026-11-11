<script setup lang="ts">
	import type { TableColumn } from '@nuxt/ui'
	import type { DemoStudent } from '~/utils/dashboard-demo'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Daftar Siswa' })

	const search = ref('')
	const grade = ref('all')

	const gradeItems = computed(() => [
		{ label: 'Semua kelas', value: 'all' },
		...[...new Set(DEMO_STUDENTS.map(s => s.grade))].map(g => ({ label: `Kelas ${g}`, value: g }))
	])

	const filtered = computed(() => {
		const term = search.value.trim().toLowerCase()
		return DEMO_STUDENTS.filter((s) => {
			const matchGrade = grade.value === 'all' || s.grade === grade.value
			const matchTerm = !term || s.name.toLowerCase().includes(term) || s.nisn.includes(term)
			return matchGrade && matchTerm
		})
	})

	function exportCsv() {
		const header = ['NISN', 'Nama', 'Kelas', 'Kuis Diikuti', 'Rata-rata Skor']
		const lines = filtered.value.map(s =>
			[s.nisn, s.name, s.grade, s.quizzesJoined, s.avgScore].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
		)
		const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = grade.value === 'all' ? 'siswa-petakuis.csv' : `siswa-petakuis-${grade.value}.csv`
		link.click()
		URL.revokeObjectURL(url)
	}

	const columns: TableColumn<DemoStudent>[] = [
		{ accessorKey: 'name', header: 'Siswa' },
		{ accessorKey: 'grade', header: 'Kelas' },
		{ accessorKey: 'quizzesJoined', header: 'Kuis diikuti' },
		{ accessorKey: 'avgScore', header: 'Rata-rata skor' }
	]
</script>

<template>
	<UDashboardPanel id="dashboard-students">
		<template #header>
			<UDashboardNavbar title="Siswa">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<UButton
						label="Ekspor CSV"
						icon="i-lucide-download"
						color="neutral"
						variant="outline"
						size="md"
						:disabled="!filtered.length"
						@click="exportCsv"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<DashboardAdminOnly page-name="Daftar siswa">
				<UAlert
					color="neutral"
					variant="subtle"
					icon="i-lucide-flask-conical"
					title="Data contoh"
					description="Nama dan nilai di tabel ini fiktif sampai database sekolah tersambung."
				/>

				<div class="flex flex-wrap items-center justify-between gap-1.5">
					<UInput
						v-model="search"
						icon="i-lucide-search"
						placeholder="Cari nama atau NISN..."
						class="max-w-sm"
					/>
					<USelect
						v-model="grade"
						:items="gradeItems"
						class="min-w-36"
						:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
					/>
				</div>

				<UTable
					:data="filtered"
					:columns="columns"
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
					<template #name-cell="{ row }">
						<UUser
							:name="row.original.name"
							:description="`NISN ${row.original.nisn}`"
							:avatar="{ alt: row.original.name }"
						/>
					</template>
					<template #grade-cell="{ row }">
						<UBadge :label="row.original.grade" color="neutral" variant="subtle" />
					</template>
					<template #avgScore-cell="{ row }">
						<div class="flex max-w-40 items-center gap-2">
							<UProgress
								:model-value="row.original.avgScore"
								size="sm"
								:color="row.original.avgScore >= 85 ? 'success' : 'warning'"
							/>
							<span class="w-8 shrink-0 text-right font-medium text-highlighted">{{ row.original.avgScore }}</span>
						</div>
					</template>
					<template #empty>
						<UEmpty icon="i-lucide-search-x" title="Siswa tidak ditemukan" variant="naked" />
					</template>
				</UTable>
			</DashboardAdminOnly>
		</template>
	</UDashboardPanel>
</template>
