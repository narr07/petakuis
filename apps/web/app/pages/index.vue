<script setup lang="ts">
	import {
		MAP_CATALOG,
		type MapTemplate,
		type QuizDefinition
	} from '@petakuis/shared'

	const router = useRouter()
	const quickPin = ref('123456')
	const creatingQuizId = ref<string | null>(null)

	const { data: quizzesData } = await useFetch<{ quizzes: QuizDefinition[] }>(
		'/api/quizzes'
	)

	const maps = computed<MapTemplate[]>(() => MAP_CATALOG)
	const quizzes = computed(() => quizzesData.value?.quizzes || [])

	const stats = computed(() => [
		{ value: '200', label: 'Siswa per sesi', icon: 'i-lucide-users' },
		{ value: '100%', label: 'Gratis selamanya', icon: 'i-lucide-badge-percent' },
		{ value: '6 digit', label: 'PIN tanpa akun', icon: 'i-lucide-key-round' },
		{ value: String(maps.value.length), label: 'Peta 2D terbuka', icon: 'i-lucide-map' }
	])

	// Class ditulis utuh agar terdeteksi Tailwind
	const features = [
		{
			title: '100% Gratis Tanpa Paywall',
			description: 'Semua peta, semua tipe soal, dan kapasitas hingga 200 siswa dibuka tanpa langganan.',
			icon: 'i-lucide-badge-percent',
			tile: 'bg-primary'
		},
		{
			title: 'Game Eksplorasi Peta 2D',
			description: 'Avatar bergerak di dunia piksel retro mencari pos soal, bukan sekadar menatap layar teks kaku.',
			icon: 'i-lucide-map-pin',
			tile: 'bg-secondary'
		},
		{
			title: 'AI Generator Soal Kurikulum',
			description: 'Buat draf 10 soal otomatis dari topik pelajaran dalam hitungan detik dengan opsi kunci jawaban instan.',
			icon: 'i-lucide-sparkles',
			tile: 'bg-warning'
		},
		{
			title: 'Siswa Masuk Tanpa Akun',
			description: 'Cukup masukkan 6-digit PIN dari proyektor guru. Privasi murid terlindungi tanpa email atau nomor HP.',
			icon: 'i-lucide-shield-check',
			tile: 'bg-success'
		},
		{
			title: 'Radar Mini-Map Host 5 Hz',
			description: 'Guru memantau pergerakan seluruh siswa di peta proyektor kelas dan podium live realtime.',
			icon: 'i-lucide-radar',
			tile: 'bg-info'
		},
		{
			title: 'Ekspor Nilai Kompatibel CSV',
			description: 'Unduh laporan per soal dan nilai per siswa yang siap diimpor ke Google Classroom atau Dapodik.',
			icon: 'i-lucide-file-spreadsheet',
			tile: 'bg-error'
		}
	]

	function handleQuickJoin() {
		const cleaned = quickPin.value.trim()
		if (!cleaned) return
		router.push({ path: '/join', query: { code: cleaned } })
	}

	async function startHostSession(quizId: string) {
		creatingQuizId.value = quizId
		try {
			const res = await $fetch<{ ok: boolean, code: string, hostToken: string }>(
				'/api/sessions',
				{ method: 'POST', body: { quizId, autoStart: true } }
			)
			await router.push(`/host/${res.code}`)
		} finally {
			creatingQuizId.value = null
		}
	}
</script>

<template>
	<UPage>
		<UPageBody class="mt-0">
			<!-- Hero -->
			<UPageHero
				orientation="horizontal"
				headline="Terbuka & gratis untuk seluruh sekolah Indonesia"
				description="Siswa menggerakkan avatar di peta sekolah atau lembah piksel, mengikuti kompas ke pos soal, lalu berlomba menjawab dengan tepat. Tanpa langganan, semua peta terbuka hingga 200 siswa per sesi."
				class="relative overflow-hidden"
			>
				<template #top>
					<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
						<div class="absolute -left-16 top-10 size-64 rounded-full bg-secondary/25 blur-2xl" />
						<div class="absolute right-0 top-0 size-80 rounded-full bg-primary/25 blur-2xl" />
						<div class="absolute bottom-0 left-1/3 size-56 rounded-full bg-warning/25 blur-2xl" />
						<UIcon name="i-lucide-star" class="absolute left-[8%] top-[18%] size-8 animate-bounce text-warning" />
						<UIcon name="i-lucide-sparkles" class="absolute right-[10%] bottom-[22%] size-8 animate-pulse text-secondary" />
						<UIcon name="i-lucide-cloud" class="absolute right-[40%] top-[8%] size-10 text-primary/60" />
					</div>
				</template>

				<template #headline>
					<UBadge color="secondary" variant="solid" size="lg" icon="i-lucide-party-popper">
						Terbuka & gratis untuk seluruh sekolah Indonesia
					</UBadge>
				</template>

				<template #title>
					Ubah latihan soal jadi
					<span class="text-primary">petualangan peta 2D</span>
				</template>

				<template #links>
					<UButton
						to="/build"
						size="xl"
						icon="i-lucide-plus-circle"
						label="Buat Kuis Baru"
					/>
					<UButton
						to="/play/123456?nickname=SiswaDemo&colorway=merah-putih"
						size="xl"
						color="secondary"
						icon="i-lucide-play"
						label="Coba Room Demo"
					/>
					<UButton
						to="/dashboard"
						size="xl"
						variant="outline"
						color="neutral"
						icon="i-lucide-layout-dashboard"
						label="Dashboard Guru"
					/>
				</template>

				<!-- Quick join -->
				<template #default>
					<div class="relative mx-auto w-full max-w-md">
						<UIcon
							name="i-lucide-gamepad-2"
							class="absolute -right-4 -top-6 z-10 size-14 rotate-12 rounded-xl border-2 border-[var(--ui-text-highlighted)] bg-warning p-2.5 text-inverted"
						/>
						<UCard :ui="{ header: 'bg-primary/10', footer: 'bg-muted' }">
							<template #header>
								<div class="flex items-center justify-between gap-2">
									<UBadge color="primary" variant="solid">Masuk ruang kelas</UBadge>
									<UBadge color="warning" variant="subtle">Demo: 123456</UBadge>
								</div>
								<h3 class="mt-3 text-xl font-bold">Punya kode PIN dari gurumu?</h3>
								<p class="mt-1 text-sm text-muted">
									Masukkan 6 digit, pilih avatar, dan langsung bertualang tanpa akun.
								</p>
							</template>

							<div class="space-y-4">
								<UFormField label="Kode ruangan">
									<UInput
										v-model="quickPin"
										size="xl"
										class="w-full"
										:ui="{ base: 'text-center font-mono text-2xl font-bold tracking-[0.4em]' }"
										placeholder="••••••"
										icon="i-lucide-key-round"
										maxlength="6"
										inputmode="numeric"
										@keyup.enter="handleQuickJoin"
									/>
								</UFormField>

								<UButton
									size="xl"
									color="secondary"
									trailing-icon="i-lucide-arrow-right"
									label="Pilih Avatar & Main"
									block
									@click="handleQuickJoin"
								/>
							</div>

							<template #footer>
								<div class="flex items-center justify-between gap-2 text-xs text-muted">
									<span class="flex items-center gap-1">
										<UIcon name="i-lucide-download-cloud" /> Tanpa instal aplikasi
									</span>
									<span class="flex items-center gap-1 font-semibold text-primary">
										<UIcon name="i-lucide-smartphone" /> HP Android & Chrome
									</span>
								</div>
							</template>
						</UCard>
					</div>
				</template>

				<template #bottom>
					<div class="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
						<div
							v-for="s in stats"
							:key="s.label"
							class="flex items-center gap-3 rounded-xl border-2 border-[var(--ui-text-highlighted)] bg-default p-3"
						>
							<UIcon :name="s.icon" class="size-7 shrink-0 text-primary" />
							<div>
								<p class="text-xl font-extrabold leading-none">{{ s.value }}</p>
								<p class="mt-1 text-xs text-muted">{{ s.label }}</p>
							</div>
						</div>
					</div>
				</template>
			</UPageHero>

			<!-- Fitur -->
			<UPageSection
				headline="Fitur Petakuis"
				title="Lengkap untuk belajar aktif di kelas"
				description="Semua fitur dan peta terbuka tanpa langganan, agar murid belajar sambil menjelajah bersama teman sekelas."
			>
				<UPageGrid>
					<UCard
						v-for="(f, idx) in features"
						:key="f.title"
						class="transition-transform hover:-translate-y-1"
					>
						<div class="flex items-start gap-4">
							<div
								class="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--ui-text-highlighted)] text-inverted"
								:class="f.tile"
							>
								<UIcon :name="f.icon" class="size-6" />
							</div>
							<div>
								<span class="text-xs font-bold text-dimmed">0{{ idx + 1 }}</span>
								<h3 class="text-base font-bold leading-snug">{{ f.title }}</h3>
								<p class="mt-2 text-sm leading-relaxed text-muted">{{ f.description }}</p>
							</div>
						</div>
					</UCard>
				</UPageGrid>
			</UPageSection>

			<!-- Peta -->
			<UPageSection
				headline="Katalog dunia 2D"
				title="Pilih peta sesuai suasana materi"
				description="Seluruh peta gratis dengan kapasitas hingga 200 siswa per sesi."
				class="bg-primary/5"
			>
				<UPageGrid>
					<UCard
						v-for="m in maps"
						:key="m.id"
						:ui="{ header: 'p-0 sm:p-0', body: 'flex-1' }"
						class="group flex flex-col"
					>
						<template #header>
							<div class="relative h-48 w-full overflow-hidden border-b-2 border-[var(--ui-text-highlighted)]">
								<img
									:src="m.mapImageUrl"
									:alt="m.name"
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
									style="image-rendering: pixelated"
								>
								<div class="absolute left-2 top-2 flex gap-1.5">
									<UBadge color="neutral" variant="solid" size="sm">
										{{ m.defaultMode === 'free' ? 'Mode Bebas' : 'Mode Berurutan' }}
									</UBadge>
									<UBadge color="success" variant="solid" size="sm" icon="i-lucide-flag">
										{{ m.spawnPoints.length }} Pos Soal
									</UBadge>
								</div>
							</div>
						</template>

						<h3 class="text-lg font-bold">{{ m.name }}</h3>
						<p class="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{{ m.description }}</p>

						<template #footer>
							<UButton
								:to="`/build?mapId=${m.id}`"
								icon="i-lucide-map-pin"
								label="Pakai Peta Ini"
								block
							/>
						</template>
					</UCard>
				</UPageGrid>
			</UPageSection>

			<!-- Kuis -->
			<UPageSection
				headline="Siap dimainkan di kelas"
				title="Kuis komunitas pilihan guru Indonesia"
				description="Pilih kuis siap pakai yang disusun oleh guru-guru Indonesia."
			>
				<template #links>
					<UButton
						to="/explore"
						color="neutral"
						variant="outline"
						trailing-icon="i-lucide-arrow-right"
						label="Lihat Seluruh Koleksi"
					/>
				</template>

				<UPageGrid>
					<UCard
						v-for="q in quizzes"
						:key="q.id"
						:ui="{ body: 'flex-1' }"
						class="flex flex-col"
					>
						<template #header>
							<div class="flex flex-wrap items-center gap-1.5">
								<UBadge color="neutral" variant="solid" size="sm">
									{{ q.schoolLevel.toUpperCase() }} · {{ q.gradeLabel }}
								</UBadge>
								<UBadge color="primary" variant="subtle" size="sm">{{ q.subject }}</UBadge>
								<UBadge color="warning" variant="subtle" size="sm" icon="i-lucide-list-checks">
									{{ q.questions.length }} Soal
								</UBadge>
							</div>
						</template>

						<h3 class="text-lg font-bold leading-snug">{{ q.title }}</h3>
						<p class="mt-2 text-sm leading-relaxed text-muted">{{ q.description }}</p>
						<p class="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
							<UIcon name="i-lucide-graduation-cap" class="size-4" />
							{{ q.ownerName }}
						</p>

						<template #footer>
							<div class="flex flex-col gap-3 sm:flex-row">
								<UButton
									class="flex-1 justify-center"
									icon="i-lucide-presentation"
									label="Layar Guru"
									:loading="creatingQuizId === q.id"
									@click="startHostSession(q.id)"
								/>
								<UButton
									to="/play/123456?nickname=Siswa&colorway=batik-biru"
									class="flex-1 justify-center"
									color="secondary"
									icon="i-lucide-gamepad-2"
									label="Coba sebagai Siswa"
								/>
							</div>
						</template>
					</UCard>
				</UPageGrid>
			</UPageSection>

			<!-- CTA -->
			<UPageSection>
				<UPageCTA
					title="Siap mengajak kelasmu bertualang?"
					description="Buat kuis pertamamu dalam hitungan menit. Tanpa kartu kredit, tanpa batas siswa."
					variant="solid"
					:links="[
						{ label: 'Mulai Buat Kuis', to: '/build', icon: 'i-lucide-rocket', color: 'secondary', size: 'xl' },
						{ label: 'Jelajahi Kuis', to: '/explore', color: 'neutral', variant: 'outline', size: 'xl' }
					]"
				/>
			</UPageSection>
		</UPageBody>
	</UPage>
</template>