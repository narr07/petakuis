<script setup lang="ts">
	const route = useRoute()
	const isFullscreenGame = computed(() => route.path.startsWith('/play/'))
	const isDashboard = computed(() => route.path.startsWith('/dashboard'))
</script>

<template>
	<UApp>
		<div
			v-if="!isFullscreenGame && !isDashboard"
			class="min-h-screen flex flex-col bg-default text-default"
		>
			<AppNavbar />
			<UMain>
				<NuxtPage />
			</UMain>
		</div>
		<div
			v-else
			class="h-screen w-screen overflow-hidden bg-default text-default"
		>
			<NuxtPage />
		</div>
	</UApp>
</template>
