<script setup lang="ts">
	import type { CommandPaletteGroup, NavigationMenuItem } from '@nuxt/ui'

	const router = useRouter()
	const { isAdmin } = useDashboardRole()
	const open = ref(false)

	const close = () => {
		open.value = false
	}

	const links = computed<NavigationMenuItem[][]>(() => [
		[
			{ label: 'Ringkasan', icon: 'i-lucide-house', to: '/dashboard', exact: true, onSelect: close },
			{ label: 'Koleksi Kuis', icon: 'i-lucide-book-open', to: '/dashboard/quizzes', onSelect: close },
			{ label: 'Peta 2D', icon: 'i-lucide-map', to: '/dashboard/maps', onSelect: close },
			{ label: 'Laporan & Nilai', icon: 'i-lucide-file-spreadsheet', to: '/dashboard/reports', onSelect: close },
			// Menu administrasi hanya ditampilkan untuk admin (halamannya juga dijaga middleware dan server).
			...(isAdmin.value
				? [
						{ label: 'Administrasi', type: 'label' as const },
						{ label: 'Guru', icon: 'i-lucide-graduation-cap', to: '/dashboard/teachers', onSelect: close },
						{ label: 'Siswa', icon: 'i-lucide-users', to: '/dashboard/students', onSelect: close },
						{ label: 'Pengaturan Sekolah', icon: 'i-lucide-settings', to: '/dashboard/settings', onSelect: close },
						{ label: 'Log Server', icon: 'i-lucide-terminal', to: '/dashboard/logs', onSelect: close }
					]
				: [])
		],
		[
			{ label: 'Buat Kuis Baru', icon: 'i-lucide-circle-plus', to: '/build' },
			{ label: 'Kembali ke Beranda', icon: 'i-lucide-arrow-left', to: '/' }
		]
	])

	const groups = computed<CommandPaletteGroup[]>(() => [
		{
			id: 'links',
			label: 'Buka halaman',
			items: links.value
				.flat()
				.filter(item => item.type !== 'label')
				.map(item => ({ label: item.label, icon: item.icon, to: item.to }))
		},
		{
			id: 'actions',
			label: 'Aksi cepat',
			items: [
				{ label: 'Halaman masuk PIN siswa', icon: 'i-lucide-gamepad-2', to: '/join' },
				{ label: 'Coba room demo', icon: 'i-lucide-play', to: '/play/123456?nickname=GuruDemo&colorway=merah-putih' }
			]
		}
	])

	defineShortcuts({
		'g-h': () => router.push('/dashboard'),
		'g-k': () => router.push('/dashboard/quizzes'),
		'g-p': () => router.push('/dashboard/maps'),
		'g-l': () => router.push('/dashboard/reports'),
		'n': () => router.push('/build')
	})
</script>

<template>
	<UDashboardGroup unit="rem">
		<UDashboardSidebar
			id="dashboard"
			v-model:open="open"
			collapsible
			resizable
			class="bg-elevated/25"
			:ui="{ footer: 'lg:border-t lg:border-default' }"
		>
			<template #header="{ collapsed }">
				<DashboardSchoolMenu :collapsed="collapsed" />
			</template>

			<template #default="{ collapsed }">
				<UDashboardSearchButton
					:collapsed="collapsed"
					label="Cari..."
					class="bg-transparent ring-default"
				/>

				<UNavigationMenu
					:collapsed="collapsed"
					:items="links[0]"
					orientation="vertical"
					tooltip
					popover
				/>

				<UNavigationMenu
					:collapsed="collapsed"
					:items="links[1]"
					orientation="vertical"
					tooltip
					class="mt-auto"
				/>
			</template>

			<template #footer="{ collapsed }">
				<DashboardUserMenu :collapsed="collapsed" />
			</template>
		</UDashboardSidebar>

		<UDashboardSearch
			:groups="groups"
			placeholder="Cari halaman atau aksi..."
		/>

		<slot />
	</UDashboardGroup>
</template>
