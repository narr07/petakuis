<script setup lang="ts">
	import { renderSVG } from 'uqr'

	const props = defineProps<{
		/** PIN 6 digit sesi. */
		code: string
	}>()

	// Siswa memindai lalu langsung sampai di halaman masuk dengan PIN terisi.
	// Alamat publik dari konfigurasi (di belakang Cloudflare, URL permintaan bisa berupa http internal).
	const origin = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
	const joinUrl = computed(() => `${origin}/join?code=${encodeURIComponent(props.code)}`)
	const svg = computed(() => renderSVG(joinUrl.value, { ecc: 'M', border: 1 }))
	const enlarged = ref(false)
</script>

<!-- v-html aman: SVG dibuat uqr dari alamat situs + PIN, bukan dari masukan pengguna. -->
<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="flex flex-col items-center gap-2">
		<button
			type="button"
			class="block size-28 overflow-hidden rounded-lg border-2 border-primary bg-white p-1 transition hover:scale-105 focus-visible:outline-3 focus-visible:outline-primary/40 sm:size-32 [&>svg]:size-full"
			:aria-label="`Perbesar QR code untuk PIN ${code}`"
			@click="enlarged = true"
			v-html="svg"
		/>
		<span class="text-xs font-bold text-muted">Pindai untuk masuk</span>

		<UModal
			v-model:open="enlarged"
			fullscreen
			:title="`Masuk ke kelas: PIN ${code}`"
			description="Pindai dengan kamera HP, atau buka petakuis lalu ketik PIN."
		>
			<template #body>
				<div class="flex h-full flex-col items-center justify-center gap-6">
					<div class="aspect-square w-full max-w-[min(80vh,80vw)] rounded-2xl bg-white p-4 [&>svg]:size-full" v-html="svg" />
					<p class="font-mono text-5xl font-black tracking-widest text-highlighted sm:text-7xl">
						{{ code }}
					</p>
				</div>
			</template>
		</UModal>
	</div>
</template>
