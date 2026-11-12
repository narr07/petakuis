<script setup lang="ts">
	const colorMode = useColorMode()
	const themeColor = computed(() => (colorMode.value === 'dark' ? '#09090b' : '#ffffff'))

	useHead({
		meta: [{ key: 'theme-color', name: 'theme-color', content: themeColor }],
		link: [
			{ rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
			{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
			{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
			{ rel: 'manifest', href: '/site.webmanifest' }
		]
	})

	useSeoMeta({
		titleTemplate: (title?: string) =>
			title
				? `${title} · Petakuis`
				: 'Petakuis · Kuis Kelas Petualangan 2D Gratis untuk Sekolah Indonesia'
	})
</script>

<template>
	<UApp>
		<NuxtLoadingIndicator color="var(--ui-primary)" />

		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>
