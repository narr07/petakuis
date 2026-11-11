<script setup lang="ts">
	import * as z from 'zod'
	import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

	definePageMeta({
		layout: 'auth'
	})

	useSeoMeta({ title: 'Buat kata sandi baru' })

	const route = useRoute()
	const token = computed(() => String(route.query.token || ''))
	// Better Auth mengarahkan ke sini dengan ?error=INVALID_TOKEN bila tautan kedaluwarsa.
	const linkInvalid = computed(() => !token.value || route.query.error === 'INVALID_TOKEN')

	const loading = ref(false)
	const errorMessage = ref('')

	const fields: AuthFormField[] = [
		{ name: 'password', type: 'password', label: 'Kata sandi baru', placeholder: 'Minimal 8 karakter', autocomplete: 'new-password', required: true },
		{ name: 'confirm', type: 'password', label: 'Ulangi kata sandi', placeholder: 'Ketik ulang', autocomplete: 'new-password', required: true }
	]

	const schema = z.object({
		password: z.string().min(8, 'Minimal 8 karakter').max(128, 'Maksimal 128 karakter'),
		confirm: z.string()
	}).refine(d => d.password === d.confirm, { message: 'Kata sandi tidak sama', path: ['confirm'] })

	async function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
		loading.value = true
		errorMessage.value = ''
		try {
			const { error } = await useAuthClient().resetPassword({
				newPassword: event.data.password,
				token: token.value
			})
			if (error) {
				errorMessage.value = authErrorMessage(error)
				return
			}
			await navigateTo({ path: '/auth/login', query: { reset: 'ok' } })
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

		<UEmpty
			v-if="linkInvalid"
			icon="i-lucide-link-2-off"
			title="Tautan tidak berlaku"
			description="Tautan untuk membuat kata sandi baru sudah kedaluwarsa atau sudah dipakai. Minta tautan baru."
			variant="naked"
			:actions="[{ label: 'Minta tautan baru', to: '/auth/lupa-sandi', icon: 'i-lucide-key-round' }]"
		/>

		<UAuthForm
			v-else
			:fields="fields"
			:schema="schema"
			title="Buat kata sandi baru"
			description="Setelah disimpan, semua perangkat yang sedang masuk akan dikeluarkan."
			icon="i-lucide-key-round"
			:loading="loading"
			:submit="{ label: 'Simpan kata sandi', block: true }"
			@submit="onSubmit"
		>
			<template #validation>
				<UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMessage" />
			</template>
		</UAuthForm>
	</div>
</template>
