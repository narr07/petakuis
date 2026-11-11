<script setup lang="ts">
	import type { NavigationMenuItem } from '@nuxt/ui'

	const route = useRoute()
	const open = ref(false)

	// Tautan hash (#fitur, #peta) diberi `active` eksplisit agar tidak ikut aktif di setiap halaman beranda
	const items = computed<NavigationMenuItem[]>(() => [
		{ label: 'Fitur', to: '/#fitur', active: route.path === '/' && route.hash === '#fitur' },
		{ label: 'Peta', to: '/#peta', active: route.path === '/' && route.hash === '#peta' },
		{ label: 'Jelajah Kuis', to: '/explore' },
		{ label: 'Status', to: '/logs' }
	])
</script>

<template>
	<UHeader v-model:open="open">
		<template #left>
			<NuxtLink
				to="/"
				aria-label="Petakuis, kembali ke beranda"
				class="-ms-1 rounded-md p-1 outline-primary/25 focus-visible:outline-3"
			>
				<AppLogo />
			</NuxtLink>
			<UBadge
				label="Gratis"
				color="primary"
				variant="subtle"
				size="sm"
				class="hidden sm:inline-flex"
			/>
		</template>

		<UNavigationMenu :items="items" variant="link" />

		<template #right>
			<UColorModeButton />

			<UButton
				icon="i-lucide-gamepad-2"
				color="neutral"
				variant="ghost"
				to="/join"
				aria-label="Masuk dengan PIN"
				class="lg:hidden"
			/>

			<UButton
				label="Masuk PIN"
				icon="i-lucide-gamepad-2"
				color="neutral"
				variant="ghost"
				to="/join"
				class="hidden lg:inline-flex"
			/>

			<UButton
				label="Masuk"
				color="neutral"
				variant="outline"
				to="/auth/login"
				class="hidden lg:inline-flex"
			/>

			<UButton
				label="Buat Kuis"
				trailing-icon="i-lucide-arrow-right"
				to="/build"
				class="hidden lg:inline-flex"
			/>
		</template>

		<template #body>
			<UNavigationMenu
				:items="items"
				orientation="vertical"
				class="-mx-2.5"
			/>

			<USeparator class="my-6" />

			<div class="flex flex-col gap-3">
				<UButton
					label="Masuk dengan PIN"
					icon="i-lucide-gamepad-2"
					color="neutral"
					variant="subtle"
					to="/join"
					block
				/>
				<UButton
					label="Masuk sebagai Guru"
					icon="i-lucide-log-in"
					color="neutral"
					variant="outline"
					to="/auth/login"
					block
				/>
				<UButton
					label="Buat Kuis"
					trailing-icon="i-lucide-arrow-right"
					to="/build"
					block
				/>
			</div>
		</template>
	</UHeader>
</template>
