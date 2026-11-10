<script setup lang="ts">
	definePageMeta({
		layout: false
	})

	const role = ref<'teacher' | 'admin' | 'student'>('teacher')
	const email = ref('guru@sekolah.sch.id')
	const otp = ref('')
	const schoolName = ref('SMP Negeri 5 Bandung')
	const isOtpSent = ref(false)
	const isSubmitting = ref(false)
	const router = useRouter()

	const roles = [
		{
			id: 'teacher',
			label: 'Guru / Host',
			icon: 'i-lucide-graduation-cap',
			description: 'Buat kuis, luncurkan room 2D, pantau kelas real-time & unduh nilai CSV'
		},
		{
			id: 'admin',
			label: 'Admin Sekolah / Kurikulum',
			icon: 'i-lucide-shield-check',
			description: 'Kelola lisensi sekolah gratis, direktori guru, analitik lintas mapel & kuota AI'
		},
		{
			id: 'student',
			label: 'Siswa / Murid',
			icon: 'i-lucide-gamepad-2',
			description: 'Masuk instan tanpa akun menggunakan 6-digit PIN ruangan dari guru'
		}
	]

	function handleSendOtp() {
		if (role.value === 'student') {
			router.push('/join')
			return
		}
		isSubmitting.value = true
		setTimeout(() => {
			isSubmitting.value = false
			isOtpSent.value = true
		}, 600)
	}

	function handleLoginSuccess() {
		isSubmitting.value = true
		setTimeout(() => {
			isSubmitting.value = false
			router.push({
				path: '/dashboard',
				query: { role: role.value }
			})
		}, 500)
	}
</script>

<template>
	<div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
		<div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
			<NuxtLink to="/" class="inline-flex items-center gap-3 group">
				<img
					src="/mascot.svg"
					alt="Maskot Kuispi"
					class="h-12 w-12 transition-transform group-hover:scale-105"
				>
				<div class="text-left">
					<div class="flex items-center gap-2">
						<span class="text-2xl font-bold">Petakuis</span>
						<UBadge color="primary" variant="subtle" size="xs">100% GRATIS</UBadge>
					</div>
					<p class="text-xs text-muted">Portal Masuk Multi-Peran</p>
				</div>
			</NuxtLink>
			<h1 class="mt-6 text-2xl font-bold">
				Masuk ke Portal Petakuis
			</h1>
			<p class="mt-2 text-sm text-muted">
				Pilih peran Anda sesuai skema PRD (Tahap ini simulasi navigasi tanpa autentikasi ketat).
			</p>
		</div>

		<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
			<UCard>
				<div class="space-y-6">
					<!-- Role Selection Tabs -->
					<div class="space-y-4">
						<span class="block text-xs font-bold uppercase tracking-wider text-muted">
							Pilih Peran Akun:
						</span>
						<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
							<UButton
								v-for="r in roles"
								:key="r.id"
								:variant="role === r.id ? 'solid' : 'outline'"
								:color="role === r.id ? 'primary' : 'neutral'"
								class="flex flex-col items-center justify-center p-3 h-auto"
								@click="role = r.id as 'teacher' | 'admin' | 'student'; isOtpSent = false"
							>
								<UIcon :name="r.icon" class="w-6 h-6 mb-1.5" />
								<span class="text-xs font-bold">{{ r.label }}</span>
							</UButton>
						</div>
						<p class="text-xs text-muted p-2.5 rounded-lg bg-muted/20">
							{{ roles.find((r) => r.id === role)?.description }}
						</p>
					</div>

					<USeparator />

					<!-- Student Direct Redirect Notice -->
					<div v-if="role === 'student'" class="text-center py-4 space-y-4">
						<UIcon name="i-lucide-sparkles" class="w-10 h-10 text-warning mx-auto" />
						<p class="text-sm font-semibold">
							Siswa tidak membutuhkan akun atau password. Anda cukup memasukkan 6 digit PIN sesi kelas dari guru.
						</p>
						<UButton
							to="/join"
							color="primary"
							icon="i-lucide-gamepad-2"
							label="Buka Halaman Masuk PIN Siswa"
							block
						/>
					</div>

					<!-- Teacher / Admin Form -->
					<div v-else class="space-y-5">
						<!-- Step 1: Email & School Input -->
						<div v-if="!isOtpSent" class="space-y-4">
							<UFormField label="Email Resmi / Akun Belajar.id">
								<UInput
									v-model="email"
									type="email"
									icon="i-lucide-mail"
									placeholder="nama@sekolah.sch.id atau @guru.smp.belajar.id"
									size="lg"
								/>
							</UFormField>

							<UFormField label="Nama Sekolah / Instansi">
								<UInput
									v-model="schoolName"
									icon="i-lucide-school"
									placeholder="Contoh: SMPN 5 Bandung / SMAN 1 Jakarta"
									size="lg"
								/>
							</UFormField>

							<UButton
								color="primary"
								icon="i-lucide-key-round"
								label="Kirim Kode OTP (Magic Link)"
								block
								:loading="isSubmitting"
								@click="handleSendOtp"
							/>

							<div class="relative flex items-center justify-center my-4">
								<USeparator label="Atau" />
							</div>

							<UButton
								variant="outline"
								color="neutral"
								icon="i-lucide-chrome"
								label="Masuk Cepat dengan Akun Google Workspace"
								block
								@click="handleLoginSuccess"
							/>
						</div>

						<!-- Step 2: OTP Verification Simulation -->
						<div v-else class="space-y-4">
							<UAlert
								icon="i-lucide-mail-check"
								color="success"
								variant="subtle"
								title="Kode OTP Terkirim (Simulasi)"
								description="Kode akses verifikasi 6 digit telah dikirim ke alamat email Anda."
							/>

							<UFormField label="Masukkan Kode 6-Digit:">
								<UInput
									v-model="otp"
									placeholder="Contoh: 849201"
									icon="i-lucide-lock"
									size="lg"
									class="font-mono text-center tracking-widest text-lg font-bold"
								/>
							</UFormField>

							<UButton
								color="primary"
								icon="i-lucide-check-circle"
								label="Verifikasi & Masuk Dashboard"
								block
								:loading="isSubmitting"
								@click="handleLoginSuccess"
							/>

							<UButton
								variant="ghost"
								color="neutral"
								label="← Ubah Email / Ganti Peran"
								block
								size="sm"
								@click="isOtpSent = false"
							/>
						</div>
					</div>
				</div>

				<template #footer>
					<div class="flex items-center justify-between text-xs text-muted">
						<span>Bebas biaya langganan untuk selamanya</span>
						<NuxtLink to="/" class="font-bold text-primary hover:underline">
							Kembali ke Beranda →
						</NuxtLink>
					</div>
				</template>
			</UCard>
		</div>
	</div>
</template>
