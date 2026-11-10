<script setup lang="ts">
	const navItems = [
		{ label: 'Jelajah', to: '/explore', icon: 'i-lucide-compass' },
		{ label: 'Buat Kuis', to: '/build', icon: 'i-lucide-plus-circle' },
		{ label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
		{ label: 'Status', to: '/logs', icon: 'i-lucide-activity' }
	]
</script>

<template>
	<UHeader>
		<template #left>
			<NuxtLink to="/" class="flex items-center gap-2.5 group">
				<img
					src="/mascot.svg"
					alt="Maskot Kuispi Petakuis"
					class="h-8 w-8 shrink-0 transition-transform group-hover:scale-105"
				>
				<div class="flex items-center gap-2">
					<span class="text-lg font-bold tracking-tight">Petakuis</span>
					<UBadge color="primary" variant="subtle" size="xs">100% GRATIS</UBadge>
				</div>
			</NuxtLink>
		</template>

		<UNavigationMenu :items="navItems" variant="link" />

		<template #right>
			<UButton
				to="/join"
				color="primary"
				icon="i-lucide-gamepad-2"
				label="Masuk PIN"
			/>
			<UButton
				to="/auth/login"
				variant="outline"
				color="neutral"
				icon="i-lucide-log-in"
				label="Masuk"
			/>
		</template>
	</UHeader>
</template>
