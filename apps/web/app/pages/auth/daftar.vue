<script setup lang="ts">
	import * as z from 'zod'
	import type { AuthFormField, ButtonProps, FormSubmitEvent, RadioGroupItem } from '@nuxt/ui'

	definePageMeta({
		layout: 'auth'
	})

	useSeoMeta({
		title: 'Daftar',
		description: 'Buat akun Petakuis sebagai guru atau siswa.'
	})

	const config = useRuntimeConfig()

	const role = ref<'teacher' | 'student'>('teacher')
	const roleItems: RadioGroupItem[] = [
		{ label: 'Guru', value: 'teacher', description: 'Menyusun kuis, membuka kelas live, melihat nilai.' },
		{ label: 'Siswa', value: 'student', description: 'Ikut kuis dari guru dengan akun sendiri.' }
	]

	const loading = ref(false)
	const errorMessage = ref('')
	const sentTo = ref('')
	const resendState = ref<'idle' | 'sending' | 'sent'>('idle')

	const fields: AuthFormField[] = [
		{ name: 'name', type: 'text', label: 'Nama', placeholder: 'Nama lengkap', autocomplete: 'name', required: true },
		{ name: 'email', type: 'email', label: 'Email', placeholder: 'nama@sekolah.sch.id', autocomplete: 'email', required: true },
		{
			name: 'password',
			type: 'password',
			label: 'Kata sandi',
			placeholder: 'Minimal 8 karakter',
			autocomplete: 'new-password',
			required: true
		}
	]

	const schema = z.object({
		name: z.string().trim().min(2, 'Nama terlalu pendek').max(80, 'Nama terlalu panjang'),
		email: z.email('Format email belum benar'),
		password: z.string().min(8, 'Minimal 8 karakter').max(128, 'Maksimal 128 karakter')
	})

	async function signUpWithGoogle() {
		// Pilihan Guru/Siswa dibawa ke halaman pilih peran setelah kembali dari Google.
		try {
			sessionStorage.setItem('petakuis-peran-pilihan', role.value)
		} catch {
			// Penyimpanan diblokir: pengguna tinggal memilih lagi di halaman pilih peran.
		}
		await useAuthClient().signIn.social({
			provider: 'google',
			callbackURL: '/dashboard',
			newUserCallbackURL: '/auth/pilih-peran',
			errorCallbackURL: '/auth/daftar'
		})
	}

	const providers = computed<ButtonProps[]>(() =>
		config.public.googleLoginEnabled
			? [{ label: 'Daftar dengan Google', icon: 'i-lucide-chrome', onClick: signUpWithGoogle }]
			: []
	)

	async function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
		loading.value = true
		errorMessage.value = ''
		try {
			const { error } = await useAuthClient().signUp.email({
				name: event.data.name,
				email: event.data.email,
				password: event.data.password,
				role: role.value,
				callbackURL: '/dashboard'
			})
			if (error) {
				errorMessage.value = authErrorMessage(error)
				return
			}
			sentTo.value = event.data.email
		} finally {
			loading.value = false
		}
	}

	async function resend() {
		resendState.value = 'sending'
		const { error } = await useAuthClient().sendVerificationEmail({ email: sentTo.value, callbackURL: '/dashboard' })
		resendState.value = error ? 'idle' : 'sent'
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
			:description="`Kami mengirim tautan konfirmasi ke ${sentTo}. Buka tautan itu untuk mengaktifkan akun dan langsung masuk. Periksa juga folder spam.`"
			variant="naked"
			:actions="[
				{
					label: resendState === 'sent' ? 'Tautan terkirim ulang' : 'Kirim ulang',
					icon: 'i-lucide-refresh-cw',
					color: 'neutral',
					variant: 'outline',
					loading: resendState === 'sending',
					disabled: resendState === 'sent',
					onClick: resend
				},
				{ label: 'Ke halaman masuk', to: '/auth/login' }
			]"
		/>

		<template v-else>
			<UFormField label="Daftar sebagai" required>
				<URadioGroup
					v-model="role"
					:items="roleItems"
					variant="card"
					orientation="horizontal"
					class="w-full"
					:ui="{ fieldset: 'grid grid-cols-2 gap-2', item: 'w-full' }"
				/>
			</UFormField>

			<UAuthForm
				:fields="fields"
				:schema="schema"
				:providers="providers"
				separator="atau"
				title="Buat akun"
				icon="i-lucide-user-plus"
				:loading="loading"
				:submit="{ label: role === 'teacher' ? 'Daftar sebagai Guru' : 'Daftar sebagai Siswa', block: true }"
				@submit="onSubmit"
			>
				<template #description>
					Sudah punya akun?
					<ULink to="/auth/login" class="font-medium text-primary">Masuk</ULink>.
				</template>

				<template #validation>
					<UAlert
						v-if="errorMessage"
						color="error"
						variant="subtle"
						icon="i-lucide-circle-alert"
						:title="errorMessage"
					/>
				</template>

				<template #footer>
					Dengan mendaftar, kamu menyetujui data dipakai seperlunya untuk keperluan kelas.
				</template>
			</UAuthForm>
		</template>
	</div>
</template>
