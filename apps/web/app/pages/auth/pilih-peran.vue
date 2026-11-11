<script setup lang="ts">
	import type { RadioGroupItem } from '@nuxt/ui'

	definePageMeta({
		layout: 'auth'
	})

	useSeoMeta({ title: 'Pilih peran' })

	const route = useRoute()
	const { user, refresh, signOut } = useCurrentUser()

	const role = ref<'teacher' | 'student'>('teacher')
	const roleItems: RadioGroupItem[] = [
		{ label: 'Guru', value: 'teacher', description: 'Menyusun kuis, membuka kelas live, melihat nilai.' },
		{ label: 'Siswa', value: 'student', description: 'Ikut kuis dari guru dengan akun sendiri.' }
	]

	onMounted(() => {
		// Pilihan dari halaman daftar sebelum pergi ke Google.
		try {
			const saved = sessionStorage.getItem('petakuis-peran-pilihan')
			if (saved === 'teacher' || saved === 'student') role.value = saved
			sessionStorage.removeItem('petakuis-peran-pilihan')
		} catch {
			// abaikan
		}
	})

	const loading = ref(false)
	const errorMessage = ref('')

	async function save() {
		loading.value = true
		errorMessage.value = ''
		try {
			await $fetch('/api/me/role', { method: 'POST', body: { role: role.value } })
			const current = await refresh()
			const redirect = String(route.query.redirect || '')
			const safe = redirect.startsWith('/') && !redirect.startsWith('//') && current?.role !== 'student'
			await navigateTo(safe ? redirect : homeForRole(current?.role ?? null))
		} catch (err: unknown) {
			const e = err as { data?: { statusMessage?: string } }
			errorMessage.value = e?.data?.statusMessage || 'Peran gagal disimpan. Coba lagi.'
		} finally {
			loading.value = false
		}
	}
</script>

<template>
	<div class="flex flex-col gap-6">
		<NuxtLink to="/" class="self-center" aria-label="Kembali ke beranda">
			<AppLogo />
		</NuxtLink>

		<div class="text-center">
			<UIcon name="i-lucide-user-round-check" class="size-8 text-primary" />
			<h1 class="mt-2 text-xl font-semibold text-highlighted">
				Halo{{ user?.name ? `, ${user.name}` : '' }}!
			</h1>
			<p class="mt-1 text-sm text-muted">
				Satu langkah lagi: kamu memakai Petakuis sebagai apa? Pilihan ini hanya sekali.
			</p>
		</div>

		<URadioGroup
			v-model="role"
			:items="roleItems"
			variant="card"
			class="w-full"
			:ui="{ fieldset: 'grid gap-2', item: 'w-full' }"
		/>

		<UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMessage" />

		<UButton
			:label="role === 'teacher' ? 'Lanjut sebagai Guru' : 'Lanjut sebagai Siswa'"
			trailing-icon="i-lucide-arrow-right"
			block
			:loading="loading"
			@click="save"
		/>

		<UButton
			label="Bukan akunmu? Keluar"
			color="neutral"
			variant="link"
			size="sm"
			class="self-center"
			@click="signOut"
		/>
	</div>
</template>
