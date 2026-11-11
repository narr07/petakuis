<script setup lang="ts">
	import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
	import type { AdminUser } from '~/composables/useAdminUsers'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Daftar Guru' })

	const { users, status, refresh, copyEmail, copySignupLink, changeRole, askDelete } = await useAdminUsers()
	const search = ref('')
	const filter = ref<'all' | 'admin' | 'teacher' | 'none'>('all')

	const filterItems = [
		{ label: 'Guru & admin', value: 'all' },
		{ label: 'Admin', value: 'admin' },
		{ label: 'Guru', value: 'teacher' },
		{ label: 'Belum memilih peran', value: 'none' }
	]

	// Akun Google yang belum memilih peran ikut tampil di sini supaya admin bisa membantu mengaturnya.
	const staff = computed(() => users.value.filter(u => u.role !== 'student'))

	const filtered = computed(() => {
		const term = search.value.trim().toLowerCase()
		return staff.value.filter((u) => {
			const matchFilter = filter.value === 'all'
				|| (filter.value === 'none' ? u.role === null : u.role === filter.value)
			const matchTerm = !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
			return matchFilter && matchTerm
		})
	})

	const pageSize = 20
	const page = ref(1)
	const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
	watch(filtered, () => {
		if ((page.value - 1) * pageSize >= filtered.value.length) page.value = 1
	})

	function rowItems(u: AdminUser): DropdownMenuItem[][] {
		return [
			[{ label: 'Salin email', icon: 'i-lucide-copy', onSelect: () => copyEmail(u.email) }],
			[
				...(u.storedRole !== 'teacher' ? [{ label: 'Jadikan Guru', icon: 'i-lucide-graduation-cap', onSelect: () => changeRole(u, 'teacher') }] : []),
				...(u.storedRole !== 'student' ? [{ label: 'Jadikan Siswa', icon: 'i-lucide-backpack', onSelect: () => changeRole(u, 'student') }] : [])
			],
			[{ label: 'Hapus akun', icon: 'i-lucide-user-x', color: 'error' as const, onSelect: () => askDelete(u) }]
		]
	}

	const columns: TableColumn<AdminUser>[] = [
		{ accessorKey: 'name', header: 'Akun' },
		{ accessorKey: 'role', header: 'Peran' },
		{ accessorKey: 'quizCount', header: 'Kuis' },
		{ accessorKey: 'sessionCount', header: 'Sesi live' },
		{ accessorKey: 'createdAt', header: 'Bergabung' },
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
						label="Salin tautan daftar"
						icon="i-lucide-link"
						size="md"
						@click="copySignupLink"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<DashboardAdminOnly page-name="Daftar guru">
				<div class="flex flex-wrap items-center justify-between gap-1.5">
					<UInput
						v-model="search"
						icon="i-lucide-search"
						placeholder="Cari nama atau email..."
						class="max-w-sm"
					/>
					<USelect v-model="filter" :items="filterItems" class="min-w-48" />
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
					<template #name-cell="{ row }">
						<UUser
							:name="row.original.name"
							:description="row.original.email"
							:avatar="{ src: row.original.image || undefined, alt: row.original.name }"
							:ui="{ name: 'truncate', description: 'truncate' }"
						/>
					</template>
					<template #role-cell="{ row }">
						<div class="flex flex-wrap gap-1">
							<UBadge
								:label="roleBadge(row.original.role).label"
								:color="roleBadge(row.original.role).color"
								variant="subtle"
							/>
							<UBadge
								v-if="!row.original.emailVerified"
								label="Email belum dikonfirmasi"
								color="warning"
								variant="outline"
							/>
						</div>
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
							icon="i-lucide-users"
							title="Belum ada akun guru"
							description="Bagikan tautan daftar kepada guru di sekolahmu."
							variant="naked"
						/>
					</template>
				</UTable>

				<div class="mt-auto flex items-center justify-between gap-3 border-t border-default pt-4">
					<p class="text-sm text-muted">
						{{ filtered.length }} akun
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
