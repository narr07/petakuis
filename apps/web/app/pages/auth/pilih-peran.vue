<script setup lang="ts">
	definePageMeta({
		layout: 'auth'
	})

	useSeoMeta({ title: 'Konfirmasi akun guru' })

	const route = useRoute()
	const toast = useToast()
	const { user, refresh, signOut } = useCurrentUser()

	const loading = ref<'teacher' | 'cancel' | null>(null)
	const errorMessage = ref('')

	function messageOf(err: unknown, fallback: string) {
		const e = err as { data?: { statusMessage?: string } }
		return e?.data?.statusMessage || fallback
	}

	async function continueAsTeacher() {
		loading.value = 'teacher'
		errorMessage.value = ''
		try {
			await $fetch('/api/me/role', { method: 'POST', body: { role: 'teacher' } })
			const current = await refresh()
			const redirect = String(route.query.redirect || '')
			const safe = redirect.startsWith('/') && !redirect.startsWith('//')
			await navigateTo(safe ? redirect : homeForRole(current?.role ?? null))
		} catch (err: unknown) {
			errorMessage.value = messageOf(err, 'Akun gagal disimpan. Coba lagi.')
		} finally {
			loading.value = null
		}
	}

	/** Siswa tidak memerlukan akun: akun Google yang baru terbentuk dihapus lagi. */
	async function cancelAsStudent() {
		loading.value = 'cancel'
		errorMessage.value = ''
		try {
			await $fetch('/api/me/batal-daftar', { method: 'POST' })
			user.value = null
			toast.add({
				title: 'Akun tidak dibuat',
				description: 'Siswa tidak perlu akun. Masukkan PIN dari guru untuk bermain.',
				icon: 'i-lucide-backpack',
				color: 'info'
			})
			await navigateTo('/join')
		} catch (err: unknown) {
			errorMessage.value = messageOf(err, 'Pendaftaran gagal dibatalkan. Coba lagi.')
		} finally {
			loading.value = null
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
				Akun Petakuis untuk guru: menyusun kuis, membuka kelas live, dan melihat nilai.
			</p>
		</div>

		<UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMessage" />

		<UButton
			label="Lanjut sebagai Guru"
			trailing-icon="i-lucide-arrow-right"
			block
			:loading="loading === 'teacher'"
			:disabled="loading === 'cancel'"
			@click="continueAsTeacher"
		/>

		<UAlert
			color="info"
			variant="subtle"
			icon="i-lucide-backpack"
			title="Kamu siswa?"
			description="Siswa tidak perlu akun. Batalkan pendaftaran ini (akunmu langsung dihapus), lalu masukkan PIN dari guru."
			:actions="[{
				label: 'Saya siswa, batalkan',
				color: 'info',
				variant: 'outline',
				loading: loading === 'cancel',
				disabled: loading === 'teacher',
				onClick: cancelAsStudent
			}]"
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
