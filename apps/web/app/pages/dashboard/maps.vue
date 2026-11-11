<script setup lang="ts">
	import { MAP_CATALOG } from '@petakuis/shared'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Peta 2D' })
</script>

<template>
	<UDashboardPanel id="dashboard-maps">
		<template #header>
			<UDashboardNavbar title="Peta 2D">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<UBadge
						:label="`${MAP_CATALOG.length} peta`"
						color="neutral"
						variant="subtle"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<UPageCard
				title="Katalog peta petualangan"
				description="Semua peta gratis dan bisa dipakai untuk kuis baru. Pilih peta, lalu susun soal di halaman Buat Kuis."
				variant="naked"
			/>

			<UPageGrid>
				<MapCard v-for="m in MAP_CATALOG" :key="m.id" :map="m" />
			</UPageGrid>
		</template>
	</UDashboardPanel>
</template>
