<script setup lang="ts">
	import type { TableColumn } from '@nuxt/ui'
	import { MAP_CATALOG } from '@petakuis/shared'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Laporan & Nilai' })

	type RoomRow = (typeof DEMO_ROOMS)[number] & { mapName: string }

	const rows = computed<RoomRow[]>(() =>
		DEMO_ROOMS.map(room => ({
			...room,
			mapName: MAP_CATALOG.find(m => m.id === room.mapId)?.name ?? room.mapId
		}))
	)

	const columns: TableColumn<RoomRow>[] = [
		{ accessorKey: 'code', header: 'PIN' },
		{ accessorKey: 'mapName', header: 'Peta' },
		{ id: 'status', header: 'Status' },
		{ id: 'actions', header: '' }
	]
</script>

<template>
	<UDashboardPanel id="dashboard-reports">
		<template #header>
			<UDashboardNavbar title="Laporan & Nilai">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<UAlert
				color="info"
				variant="subtle"
				icon="i-lucide-info"
				title="Riwayat sesi belum tersimpan permanen"
				description="Database belum tersambung, jadi yang tampil di sini hanya room demo bawaan game server. Laporan sesi yang kamu buka sendiri bisa diakses dari layar host selama server masih menyala."
			/>

			<UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
				<template #header>
					<p class="font-semibold text-highlighted">Room aktif</p>
					<p class="text-sm text-muted">Buka laporan untuk melihat skor per siswa dan per soal, lalu unduh CSV.</p>
				</template>

				<UTable
						:data="rows"
						:columns="columns"
						class="w-full"
						:ui="{ th: 'first:ps-4 sm:first:ps-6', td: 'first:ps-4 sm:first:ps-6 last:pe-4 sm:last:pe-6' }"
					>
						<template #code-cell="{ row }">
							<UKbd :value="row.original.code" size="lg" />
						</template>
						<template #mapName-cell="{ row }">
							<span class="block truncate">{{ row.original.mapName }}</span>
						</template>
						<template #status-cell>
							<UBadge label="Room demo" color="success" variant="subtle" icon="i-lucide-radio-tower" />
						</template>
						<template #actions-cell="{ row }">
							<div class="flex justify-end gap-2">
								<UButton
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
					</UTable>
			</UCard>
		</template>
	</UDashboardPanel>
</template>
