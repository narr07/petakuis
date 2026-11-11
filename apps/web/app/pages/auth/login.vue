<script setup lang="ts">
	import * as z from 'zod'
	import type { AuthFormField, ButtonProps, FormSubmitEvent } from '@nuxt/ui'

	definePageMeta({
		layout: 'auth'
	})

	useSeoMeta({
		title: 'Masuk',
		description: 'Masuk ke Petakuis untuk membuat kuis dan membuka kelas live.'
	})

	const route = useRoute()
	const config = useRuntimeConfig()
	const { refresh } = useCurrentUser()

	const loading = ref(false)
	const errorMessage = ref('')
	const unverifiedEmail = ref('')
	const resendState = ref<'idle' | 'sending' | 'sent'>('idle')

	const redirectTo = computed(() => {
		const r = String(route.query.redirect || '')
		// Hanya alamat di situs ini, supaya tautan login tidak bisa dipakai untuk mengalihkan ke situs lain.
		return r.startsWith('/') && !r.startsWith('//') ? r : ''
	})

	const notice = computed(() => {
		if (route.query.reset === 'ok') return 'Kata sandi baru tersimpan. Silakan masuk.'
		if (route.query.error === 'google') return 'Masuk dengan Google gagal atau dibatalkan. Coba lagi.'
		return ''
	})

	const fields: AuthFormField[] = [
		{
			name: 'email',
			type: 'email',
			label: 'Email',
			placeholder: 'nama@sekolah.sch.id',
			autocomplete: 'email',
			required: true
		},
		{
			name: 'password',
			type: 'password',
			label: 'Kata sandi',
			placeholder: 'Kata sandimu',
			autocomplete: 'current-password',
			required: true
		}
	]

	const schema = z.object({
		email: z.email('Format email belum benar'),
		password: z.string().min(1, 'Isi kata sandi')
	})

	async function signInWithGoogle() {
		errorMessage.value = ''
		await useAuthClient().signIn.social({
			provider: 'google',
			callbackURL: redirectTo.value || '/dashboard',
			newUserCallbackURL: '/auth/pilih-peran',
			errorCallbackURL: '/auth/login?error=google'
		})
	}

	const providers = computed<ButtonProps[]>(() =>
		config.public.googleLoginEnabled
			? [{ label: 'Masuk dengan Google', icon: 'i-lucide-chrome', onClick: signInWithGoogle }]
			: []
	)

	async function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
		loading.value = true
		errorMessage.value = ''
		unverifiedEmail.value = ''
		try {
			const { error } = await useAuthClient().signIn.email({
				email: event.data.email,
				password: event.data.password
			})
			if (error) {
				errorMessage.value = authErrorMessage(error)
				if (error.code === 'EMAIL_NOT_VERIFIED') unverifiedEmail.value = event.data.email
				return
			}
			const current = await refresh()
			await navigateTo(redirectTo.value || homeForRole(current?.role ?? null))
		} finally {
			loading.value = false
		}
	}

	async function resendVerification() {
		resendState.value = 'sending'
		const { error } = await useAuthClient().sendVerificationEmail({
			email: unverifiedEmail.value,
			callbackURL: '/dashboard'
		})
		resendState.value = error ? 'idle' : 'sent'
		if (error) errorMessage.value = authErrorMessage(error)
	}
</script>

<template>
	<div class="flex flex-col gap-6">
		<NuxtLink to="/" class="self-center" aria-label="Kembali ke beranda">
			<AppLogo />
		</NuxtLink>

		<UAlert
			v-if="notice"
			:color="route.query.error ? 'warning' : 'success'"
			variant="subtle"
			:icon="route.query.error ? 'i-lucide-triangle-alert' : 'i-lucide-check'"
			:title="notice"
		/>

		<UAuthForm
			:fields="fields"
			:schema="schema"
			:providers="providers"
			separator="atau"
			title="Masuk ke Petakuis"
			icon="i-lucide-lock"
			:loading="loading"
			:submit="{ label: 'Masuk', block: true }"
			@submit="onSubmit"
		>
			<template #description>
				Belum punya akun?
				<ULink to="/auth/daftar" class="font-medium text-primary">Daftar sebagai guru atau siswa</ULink>.
			</template>

			<template #password-hint>
				<ULink to="/auth/lupa-sandi" class="font-medium text-primary" tabindex="-1">Lupa kata sandi?</ULink>
			</template>

			<template #validation>
				<UAlert
					v-if="errorMessage"
					color="error"
					variant="subtle"
					icon="i-lucide-circle-alert"
					:title="errorMessage"
				>
					<template v-if="unverifiedEmail" #actions>
						<UButton
							:label="resendState === 'sent' ? 'Tautan terkirim' : 'Kirim ulang tautan konfirmasi'"
							:loading="resendState === 'sending'"
							:disabled="resendState === 'sent'"
							size="xs"
							color="neutral"
							variant="outline"
							@click="resendVerification"
						/>
					</template>
				</UAlert>
			</template>

			<template #footer>
				Siswa yang hanya ingin bermain cukup memakai
				<ULink to="/join" class="font-medium text-primary">PIN dari guru</ULink>, tanpa akun.
			</template>
		</UAuthForm>
	</div>
</template>
