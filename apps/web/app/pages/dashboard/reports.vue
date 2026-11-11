<script setup lang="ts">
	import type { TableColumn } from '@nuxt/ui'
	import { MAP_CATALOG } from '@petakuis/shared'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Laporan & Nilai' })

	interface SessionRow {
		key: string
		code: string
		quizTitle: string
		mapName: string
		status: 'lobby' | 'active' | 'paused' | 'ended' | 'demo'
		totalPlayers: number | null
		createdAt: string | null
	}

	const { data, status, refresh } = await useFetch<{
		sessions: Array<{
			id: string
			code: string
			quizTitle: string
			mapId: string
			status: 'lobby' | 'active' | 'paused' | 'ended'
			createdAt: string
			totalPlayers: number
		}>
	}>('/api/sessions')

	const mapName = (mapId: string) => MAP_CATALOG.find(m => m.id === mapId)?.name ?? mapId

	const sessionRows = computed<SessionRow[]>(() =>
		(data.value?.sessions ?? []).map(s => ({
			key: s.id,
			code: s.code,
			quizTitle: s.quizTitle,
			mapName: mapName(s.mapId),
			status: s.status,
			totalPlayers: s.status === 'ended' ? s.totalPlayers : null,
			createdAt: s.createdAt
		}))
	)

	const demoRows = computed<SessionRow[]>(() =>
		DEMO_ROOMS.map(room => ({
			key: `demo-${room.code}`,
			code: room.code,
			quizTitle: 'Room demo bawaan',
			mapName: mapName(room.mapId),
			status: 'demo',
			totalPlayers: null,
			createdAt: null
		}))
	)

	const statusBadge: Record<SessionRow['status'], { label: string, color: 'success' | 'warning' | 'neutral' | 'info' }> = {
		lobby: { label: 'Lobi', color: 'info' },
		active: { label: 'Berjalan', color: 'success' },
		paused: { label: 'Dijeda', color: 'warning' },
		ended: { label: 'Selesai', color: 'neutral' },
		demo: { label: 'Room demo', color: 'info' }
	}

	const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

	const columns: TableColumn<SessionRow>[] = [
		{ accessorKey: 'code', header: 'PIN' },
		{ accessorKey: 'quizTitle', header: 'Kuis' },
		{ accessorKey: 'totalPlayers', header: 'Siswa' },
		{ accessorKey: 'status', header: 'Status' },
		{ accessorKey: 'createdAt', header: 'Dimulai' },
		{ id: 'actions', header: '' }
	]

	const tableUi = {
		base: 'table-fixed border-separate border-spacing-0',
		thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
		tbody: '[&>tr]:last:[&>td]:border-b-0',
		th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
		td: 'border-b border-default',
		separator: 'h-0'
	}
</script>

<template>
	<UDashboardPanel id="dashboard-reports">
		<template #header>
			<UDashboardNavbar title="Laporan & Nilai">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<UButton
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="ghost"
						aria-label="Muat ulang"
						:loading="status === 'pending'"
						@click="refresh()"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<UAlert
				color="info"
				variant="subtle"
				icon="i-lucide-database"
				title="Laporan tersimpan otomatis"
				description="Saat guru menekan Akhiri Sesi, skor per siswa dan per soal disimpan ke database, jadi tetap bisa dibuka dan diunduh setelah server dimulai ulang. Riwayat ini sementara tampil untuk semua guru sampai login guru aktif."
			/>

			<UPageCard
				title="Riwayat sesi"
				:description="`${sessionRows.length} sesi tercatat`"
				variant="naked"
			/>

			<UTable
				:data="sessionRows"
				:columns="columns"
				:loading="status === 'pending'"
				class="shrink-0"
				:ui="tableUi"
			>
				<template #code-cell="{ row }">
					<UKbd :value="row.original.code" size="lg" />
				</template>
				<template #quizTitle-cell="{ row }">
					<p class="truncate font-medium text-highlighted">{{ row.original.quizTitle }}</p>
					<p class="truncate text-xs text-muted">{{ row.original.mapName }}</p>
				</template>
				<template #totalPlayers-cell="{ row }">
					{{ row.original.totalPlayers ?? '–' }}
				</template>
				<template #status-cell="{ row }">
					<UBadge
						:label="statusBadge[row.original.status].label"
						:color="statusBadge[row.original.status].color"
						variant="subtle"
					/>
				</template>
				<template #createdAt-cell="{ row }">
					<span class="text-muted">
						{{ row.original.createdAt ? dateFormat.format(new Date(row.original.createdAt)) : '–' }}
					</span>
				</template>
				<template #actions-cell="{ row }">
					<div class="flex justify-end gap-2">
						<UButton
							v-if="row.original.status !== 'ended'"
							:to="`/host/${row.original.code}`"
							label="Layar Host"
							icon="i-lucide-presentation"
							color="neutral"
							variant="outline"
							size="sm"
							class="hidden md:inline-flex"
						/>
						<UButton
							:to="`/report/${row.original.code}`"
							label="Laporan"
							icon="i-lucide-file-spreadsheet"
							size="sm"
						/>
					</div>
				</template>
				<template #empty>
					<UEmpty
						icon="i-lucide-history"
						title="Belum ada sesi"
						description="Buka kelas live dari Koleksi Kuis; sesinya akan muncul di sini."
						:actions="[{ label: 'Ke Koleksi Kuis', to: '/dashboard/quizzes', icon: 'i-lucide-book-open' }]"
						variant="naked"
					/>
				</template>
			</UTable>

			<UPageCard
				title="Room demo"
				description="Room bawaan untuk mencoba permainan. Tidak disimpan ke riwayat."
				variant="naked"
			/>

			<UTable
				:data="demoRows"
				:columns="columns"
				class="shrink-0"
				:ui="tableUi"
			>
				<template #code-cell="{ row }">
					<UKbd :value="row.original.code" size="lg" />
				</template>
				<template #quizTitle-cell="{ row }">
					<p class="truncate font-medium text-highlighted">{{ row.original.mapName }}</p>
				</template>
				<template #totalPlayers-cell>
					–
				</template>
				<template #status-cell>
					<UBadge label="Room demo" color="info" variant="subtle" />
				</template>
				<template #createdAt-cell>
					–
				</template>
				<template #actions-cell="{ row }">
					<div class="flex justify-end gap-2">
						<UButton
							:to="`/host/${row.original.code}`"
							label="Pantau"
							icon="i-lucide-eye"
							color="neutral"
							variant="outline"
							size="sm"
							class="hidden md:inline-flex"
						/>
						<UButton
							:to="`/report/${row.original.code}`"
							label="Laporan"
							icon="i-lucide-file-spreadsheet"
							size="sm"
						/>
					</div>
				</template>
			</UTable>
		</template>
	</UDashboardPanel>
</template>
