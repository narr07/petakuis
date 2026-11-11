<script setup lang="ts">
	import type { NuxtError } from '#app'

	const props = defineProps<{
		error: NuxtError
	}>()

	const isNotFound = computed(() => props.error.statusCode === 404)

	// Pesan bawaan Nuxt berbahasa Inggris, jadi diganti agar konsisten dengan situs
	const localizedError = computed(() => ({
		statusCode: props.error.statusCode,
		statusMessage: isNotFound.value ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan',
		message: isNotFound.value
			? 'Maaf, halaman yang kamu cari tidak tersedia atau sudah dipindahkan.'
			: 'Ada masalah saat memuat halaman ini. Coba muat ulang beberapa saat lagi.'
	}))

	// error.vue menggantikan app.vue, jadi titleTemplate dari app.vue tidak berlaku di sini
	useSeoMeta({
		title: () => `${localizedError.value.statusMessage} · Petakuis`
	})
</script>

<template>
	<UApp>
		<AppHeader />

		<UMain>
			<UContainer>
				<UPage>
					<UError
						:error="localizedError"
						:clear="{ label: 'Kembali ke Beranda', icon: 'i-lucide-house' }"
						redirect="/"
					/>
				</UPage>
			</UContainer>
		</UMain>

		<AppFooter />
	</UApp>
</template>
