<script setup lang="ts">
	import * as z from 'zod'
	import type { AuthFormField, FormSubmitEvent, TabsItem } from '@nuxt/ui'

	definePageMeta({
		layout: 'auth'
	})

	useSeoMeta({
		title: 'Masuk',
		description: 'Masuk ke Petakuis sebagai guru, admin sekolah, atau siswa.'
	})

	type LoginRole = 'teacher' | 'admin' | 'student'

	const router = useRouter()
	const toast = useToast()
	const { setRole } = useDashboardRole()

	const role = ref<LoginRole>('teacher')
	const step = ref<'email' | 'otp'>('email')
	const pendingEmail = ref('')

	const roleTabs: TabsItem[] = [
		{ label: 'Guru', value: 'teacher', icon: 'i-lucide-graduation-cap' },
		{ label: 'Admin', value: 'admin', icon: 'i-lucide-shield-check' },
		{ label: 'Siswa', value: 'student', icon: 'i-lucide-gamepad-2' }
	]

	watch(role, () => {
		step.value = 'email'
	})

	// Langkah 1 guru/admin: email sekolah
	const emailFields: AuthFormField[] = [
		{
			name: 'email',
			type: 'email',
			label: 'Email sekolah atau belajar.id',
			placeholder: 'nama@sekolah.sch.id',
			required: true
		},
		{
			name: 'school',
			type: 'text',
			label: 'Nama sekolah',
			placeholder: 'Contoh: SMPN 5 Bandung'
		}
	]

	const emailSchema = z.object({
		email: z.email('Format email belum benar'),
		school: z.string().optional()
	})

	// Langkah 2 guru/admin: kode OTP
	const otpFields: AuthFormField[] = [
		{
			name: 'otp',
			type: 'otp',
			label: 'Kode verifikasi',
			length: 6,
			size: 'xl'
		}
	]

	const otpSchema = z.object({
		otp: z.array(z.string()).length(6, 'Isi 6 digit kode')
	})

	// Siswa: cukup PIN ruangan
	const pinFields: AuthFormField[] = [
		{
			name: 'pin',
			type: 'otp',
			label: 'PIN ruangan dari guru',
			length: 6,
			size: 'xl'
		}
	]

	const pinSchema = z.object({
		pin: z.array(z.string()).length(6, 'Isi 6 digit PIN')
	})

	const providers = computed(() =>
		step.value === 'email'
			? [{ label: 'Masuk dengan Google', icon: 'i-lucide-circle-user-round', onClick: () => finishLogin() }]
			: []
	)

	function onEmailSubmit(event: FormSubmitEvent<z.output<typeof emailSchema>>) {
		pendingEmail.value = event.data.email
		step.value = 'otp'
		toast.add({
			title: 'Kode terkirim (pratinjau)',
			description: `Pada versi final, kode 6 digit dikirim ke ${event.data.email}. Untuk sekarang isi angka apa saja.`,
			icon: 'i-lucide-mail-check',
			color: 'info'
		})
	}

	function finishLogin() {
		setRole(role.value === 'admin' ? 'admin' : 'teacher')
		router.push('/dashboard')
	}

	function onPinSubmit(event: FormSubmitEvent<z.output<typeof pinSchema>>) {
		router.push({ path: '/join', query: { code: event.data.pin.join('') } })
	}
</script>

<template>
	<div class="flex flex-col gap-6">
		<NuxtLink to="/" class="self-center" aria-label="Kembali ke beranda">
			<AppLogo />
		</NuxtLink>

		<UTabs
			v-model="role"
			:items="roleTabs"
			:content="false"
			color="neutral"
			size="sm"
			class="w-full"
		/>

		<UAuthForm
			v-if="role === 'student'"
			:fields="pinFields"
			:schema="pinSchema"
			title="Masuk sebagai siswa"
			description="Siswa tidak perlu akun. Masukkan PIN dari layar guru, lalu pilih avatar."
			icon="i-lucide-gamepad-2"
			:submit="{ label: 'Masuk ke Ruangan', trailingIcon: 'i-lucide-arrow-right', block: true }"
			@submit="onPinSubmit"
		/>

		<UAuthForm
			v-else-if="step === 'email'"
			:key="`email-${role}`"
			:fields="emailFields"
			:schema="emailSchema"
			:providers="providers"
			separator="atau"
			:title="role === 'admin' ? 'Masuk sebagai admin sekolah' : 'Masuk sebagai guru'"
			:description="role === 'admin'
				? 'Kelola guru, siswa, dan kuota AI untuk sekolahmu.'
				: 'Simpan kuis, buka kelas live, dan unduh laporan nilai.'"
			icon="i-lucide-lock"
			:submit="{ label: 'Kirim Kode Masuk', block: true }"
			@submit="onEmailSubmit"
		>
			<template #footer>
				Dengan masuk, kamu menyetujui penggunaan data seperlunya untuk keperluan kelas.
			</template>
		</UAuthForm>

		<UAuthForm
			v-else
			:key="`otp-${role}`"
			:fields="otpFields"
			:schema="otpSchema"
			title="Cek email kamu"
			icon="i-lucide-mail-check"
			:submit="{ label: 'Verifikasi & Masuk', block: true }"
			@submit="finishLogin"
		>
			<template #description>
				Masukkan kode 6 digit yang dikirim ke <span class="font-medium text-highlighted">{{ pendingEmail }}</span>.
			</template>

			<template #footer>
				<UButton
					label="Ganti email"
					icon="i-lucide-arrow-left"
					color="neutral"
					variant="link"
					size="sm"
					@click="step = 'email'"
				/>
			</template>
		</UAuthForm>

		<UAlert
			color="warning"
			variant="subtle"
			icon="i-lucide-flask-conical"
			title="Mode pratinjau"
			description="Login belum tersambung ke server. Tombol masuk langsung membuka dashboard dengan data contoh."
		/>
	</div>
</template>
