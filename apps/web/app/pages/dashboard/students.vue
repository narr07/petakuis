<script setup lang="ts">
	import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
	import type { AdminUser } from '~/composables/useAdminUsers'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Daftar Siswa' })

	const { users, status, refresh, copyEmail, copySignupLink, changeRole, askDelete } = await useAdminUsers()
	const search = ref('')

	const students = computed(() => users.value.filter(u => u.role === 'student'))

	const filtered = computed(() => {
		const term = search.value.trim().toLowerCase()
		return students.value.filter(u => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
	})

	function exportCsv() {
		const header = ['Nama', 'Email', 'Email dikonfirmasi', 'Bergabung']
		const lines = filtered.value.map(s =>
			[s.name, s.email, s.emailVerified ? 'Ya' : 'Belum', s.createdAt.slice(0, 10)]
				.map(v => `"${String(v).replace(/"/g, '""')}"`)
				.join(',')
		)
		const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = 'siswa-petakuis.csv'
		link.click()
		URL.revokeObjectURL(url)
	}

	const pageSize = 20
	const page = ref(1)
	const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
	watch(filtered, () => {
		if ((page.value - 1) * pageSize >= filtered.value.length) page.value = 1
	})

	function rowItems(u: AdminUser): DropdownMenuItem[][] {
		return [
			[{ label: 'Salin email', icon: 'i-lucide-copy', onSelect: () => copyEmail(u.email) }],
			[{ label: 'Jadikan Guru', icon: 'i-lucide-graduation-cap', onSelect: () => changeRole(u, 'teacher') }],
			[{ label: 'Hapus akun', icon: 'i-lucide-user-x', color: 'error' as const, onSelect: () => askDelete(u) }]
		]
	}

	const columns: TableColumn<AdminUser>[] = [
		{ accessorKey: 'name', header: 'Siswa' },
		{ accessorKey: 'emailVerified', header: 'Status' },
		{ accessorKey: 'createdAt', header: 'Bergabung' },
		{ id: 'actions', header: '' }
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
					icon="i-lucide-info"
					title="Siswa tidak wajib punya akun"
					description="Siswa bisa bermain cukup dengan PIN dan nama panggilan; nilainya ada di Laporan & Nilai. Daftar ini hanya berisi siswa yang mendaftar akun."
				/>

				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Cari nama atau email..."
					class="max-w-sm"
				/>

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
					<template #name-cell="{ row }">
						<UUser
							:name="row.original.name"
							:description="row.original.email"
							:avatar="{ src: row.original.image || undefined, alt: row.original.name }"
							:ui="{ name: 'truncate', description: 'truncate' }"
						/>
					</template>
					<template #emailVerified-cell="{ row }">
						<UBadge
							:label="row.original.emailVerified ? 'Aktif' : 'Email belum dikonfirmasi'"
							:color="row.original.emailVerified ? 'success' : 'warning'"
							variant="subtle"
						/>
					</template>
					<template #createdAt-cell="{ row }">
						<span class="text-muted">{{ formatJoinDate(row.original.createdAt) }}</span>
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
						<UEmpty
							icon="i-lucide-backpack"
							title="Belum ada akun siswa"
							description="Siswa yang mendaftar sebagai Siswa akan muncul di sini."
							variant="naked"
							:actions="[{ label: 'Salin tautan daftar', icon: 'i-lucide-link', color: 'neutral', variant: 'outline', onClick: copySignupLink }]"
						/>
					</template>
				</UTable>

				<div class="mt-auto flex items-center justify-between gap-3 border-t border-default pt-4">
					<p class="text-sm text-muted">
						{{ filtered.length }} siswa
					</p>
					<div class="flex items-center gap-2">
						<UButton
							icon="i-lucide-refresh-cw"
							color="neutral"
							variant="ghost"
							aria-label="Segarkan"
							:loading="status === 'pending'"
							@click="refresh()"
						/>
						<UPagination
							v-if="filtered.length > pageSize"
							v-model:page="page"
							:items-per-page="pageSize"
							:total="filtered.length"
						/>
					</div>
				</div>

				<DashboardDeleteUserModal />
			</DashboardAdminOnly>
		</template>
	</UDashboardPanel>
</template>
