<script setup lang="ts">
	import * as z from 'zod'
	import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

	definePageMeta({
		layout: 'auth'
	})

	useSeoMeta({ title: 'Lupa kata sandi' })

	const loading = ref(false)
	const sentTo = ref('')
	const errorMessage = ref('')

	const fields: AuthFormField[] = [
		{ name: 'email', type: 'email', label: 'Email akun', placeholder: 'nama@sekolah.sch.id', autocomplete: 'email', required: true }
	]
	const schema = z.object({ email: z.email('Format email belum benar') })

	async function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
		loading.value = true
		errorMessage.value = ''
		try {
			const { error } = await useAuthClient().requestPasswordReset({
				email: event.data.email,
				redirectTo: '/auth/reset-sandi'
			})
			// Pesan sama untuk email terdaftar maupun tidak, supaya tidak bisa dipakai menebak akun.
			if (error && error.status === 429) {
				errorMessage.value = authErrorMessage(error)
				return
			}
			sentTo.value = event.data.email
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
			v-if="sentTo"
			icon="i-lucide-mail-check"
			title="Cek emailmu"
			:description="`Bila ${sentTo} terdaftar dengan kata sandi, kami sudah mengirim tautan untuk membuat kata sandi baru. Tautan berlaku 1 jam. Akun yang dibuat lewat Google cukup masuk dengan tombol Google.`"
			variant="naked"
			:actions="[{ label: 'Kembali ke halaman masuk', to: '/auth/login', icon: 'i-lucide-arrow-left' }]"
		/>

		<UAuthForm
			v-else
			:fields="fields"
			:schema="schema"
			title="Lupa kata sandi"
			description="Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi baru."
			icon="i-lucide-key-round"
			:loading="loading"
			:submit="{ label: 'Kirim tautan', block: true }"
			@submit="onSubmit"
		>
			<template #validation>
				<UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMessage" />
			</template>
			<template #footer>
				Ingat kata sandimu? <ULink to="/auth/login" class="font-medium text-primary">Masuk</ULink>.
			</template>
		</UAuthForm>
	</div>
</template>
