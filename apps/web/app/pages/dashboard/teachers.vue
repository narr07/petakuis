<script setup lang="ts">
	import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
	import type { DemoTeacher } from '~/utils/dashboard-demo'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Daftar Guru' })

	const toast = useToast()
	const search = ref('')

	const filtered = computed(() => {
		const term = search.value.trim().toLowerCase()
		if (!term) return DEMO_TEACHERS
		return DEMO_TEACHERS.filter(
			t => t.name.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term)
		)
	})

	function notReady(feature: string) {
		toast.add({
			title: `${feature} belum tersedia`,
			description: 'Fitur ini aktif setelah database dan login guru tersambung.',
			icon: 'i-lucide-construction',
			color: 'warning'
		})
	}

	async function copyEmail(email: string) {
		try {
			await navigator.clipboard.writeText(email)
			toast.add({ title: 'Email disalin', description: email, icon: 'i-lucide-copy-check' })
		} catch {
			toast.add({ title: 'Gagal menyalin email', color: 'error', icon: 'i-lucide-circle-alert' })
		}
	}

	function rowItems(teacher: DemoTeacher): DropdownMenuItem[][] {
		return [
			[{ label: 'Salin email', icon: 'i-lucide-copy', onSelect: () => copyEmail(teacher.email) }],
			[{ label: 'Nonaktifkan', icon: 'i-lucide-user-x', color: 'error', onSelect: () => notReady('Menonaktifkan guru') }]
		]
	}

	const columns: TableColumn<DemoTeacher>[] = [
		{ accessorKey: 'name', header: 'Guru' },
		{ accessorKey: 'subject', header: 'Mapel' },
		{ accessorKey: 'quizzes', header: 'Kuis' },
		{ accessorKey: 'sessions', header: 'Sesi' },
		{ accessorKey: 'status', header: 'Status' },
		{ id: 'actions', header: '' }
	]
</script>

<template>
	<UDashboardPanel id="dashboard-teachers">
		<template #header>
			<UDashboardNavbar title="Guru">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<UButton
						label="Undang Guru"
						icon="i-lucide-user-plus"
						size="md"
						@click="notReady('Undangan guru')"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<DashboardAdminOnly page-name="Daftar guru">
				<UAlert
					color="neutral"
					variant="subtle"
					icon="i-lucide-flask-conical"
					title="Data contoh"
					description="Nama dan angka di tabel ini fiktif sampai database sekolah tersambung."
				/>

				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Cari nama atau mapel..."
					class="max-w-sm"
				/>

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
							:description="row.original.email"
							:avatar="{ alt: row.original.name }"
						/>
					</template>
					<template #subject-cell="{ row }">
						<UBadge :label="row.original.subject" color="neutral" variant="subtle" />
					</template>
					<template #status-cell="{ row }">
						<UBadge
							:label="row.original.status"
							:color="row.original.status === 'Aktif' ? 'success' : 'warning'"
							variant="subtle"
						/>
					</template>
					<template #actions-cell="{ row }">
						<div class="text-right">
							<UDropdownMenu :items="rowItems(row.original)" :content="{ align: 'end' }">
								<UButton
									icon="i-lucide-ellipsis-vertical"
									color="neutral"
									variant="ghost"
									aria-label="Aksi"
								/>
							</UDropdownMenu>
						</div>
					</template>
					<template #empty>
						<UEmpty icon="i-lucide-search-x" title="Guru tidak ditemukan" variant="naked" />
					</template>
				</UTable>
			</DashboardAdminOnly>
		</template>
	</UDashboardPanel>
</template>
