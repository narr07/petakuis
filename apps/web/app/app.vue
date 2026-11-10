<script setup lang="ts">
	const route = useRoute()
	const isFullscreenGame = computed(() => route.path.startsWith('/play/'))
</script>

<template>
	<div class="min-h-screen flex flex-col">
		<AppNavbar v-if="!isFullscreenGame" />
		<main class="flex-1">
			<NuxtPage />
		</main>
	</div>
</template>
