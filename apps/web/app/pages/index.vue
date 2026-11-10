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

	function handleQuickJoin() {
		const cleaned = quickPin.value.trim()
		if (!cleaned) return
		router.push({
			path: '/join',
			query: { code: cleaned }
		})
	}

	async function startHostSession(quizId: string) {
		creatingQuizId.value = quizId
		try {
			const res = await $fetch<{
				ok: boolean
				code: string
				hostToken: string
			}>('/api/sessions', {
				method: 'POST',
				body: {
					quizId,
					autoStart: true
				}
			})
			await router.push(`/host/${res.code}`)
		} finally {
			creatingQuizId.value = null
		}
	}
</script>

<template>
	<div class="pb-20">
		<!-- Hero Section -->
		<section class="border-b-2 border-[#16211b] bg-[#f3ecdc] py-12 sm:py-16">
			<div class="mx-auto max-w-7xl px-4 sm:px-6">
				<div class="grid items-center gap-10 lg:grid-cols-12">
					<div class="lg:col-span-7">
						<div
							class="inline-flex items-center gap-2 rounded-full border-2 border-[#16211b] bg-[#dcfce7] px-3.5 py-1 text-xs font-extrabold text-[#14532d]"
						>
							<span>TERBUKA & GRATIS UNTUK SELURUH SEKOLAH INDONESIA</span>
						</div>

						<h1
							class="mt-5 text-3xl font-extrabold tracking-tight text-[#16211b] sm:text-5xl sm:leading-[1.12]"
						>
							Ubah latihan soal di kelas menjadi petualangan peta 2D.
						</h1>

						<p class="mt-4 max-w-2xl text-base leading-relaxed text-[#435249] sm:text-lg">
							Siswa menggerakkan avatar di peta sekolah atau candi kuno, mengikuti
							kompas penunjuk arah ke pos soal, lalu berlomba menjawab dengan tepat.
							Tanpa biaya langganan, semua peta terbuka hingga 200 siswa per sesi.
						</p>

						<div class="mt-7 flex flex-wrap items-center gap-3.5">
							<NuxtLink
								to="/build"
								class="pixel-btn rounded-xl bg-[#15803d] px-6 py-3.5 text-sm font-extrabold text-white"
							>
								Buat Kuis Baru Sekarang
							</NuxtLink>
							<NuxtLink
								to="/play/123456?nickname=SiswaDemo&colorway=merah-putih"
								class="pixel-btn rounded-xl bg-white px-5 py-3.5 text-sm font-extrabold text-[#16211b]"
							>
								Coba Mainkan Room Demo (PIN 123456)
							</NuxtLink>
						</div>
					</div>

					<!-- Quick PIN Card -->
					<div class="lg:col-span-5">
						<div class="pixel-card rounded-2xl p-6 sm:p-7">
							<div class="flex items-center justify-between">
								<span
									class="font-pixel text-[11px] uppercase tracking-wider text-[#15803d]"
								>
									MASUK RUANG KELAS
								</span>
								<span
									class="rounded border border-[#16211b] bg-[#fef08a] px-2 py-0.5 font-mono-num text-xs font-bold text-[#16211b]"
								>
									Demo Aktif: 123456
								</span>
							</div>

							<h2 class="mt-3 text-xl font-extrabold text-[#16211b]">
								Punya kode PIN dari gurumu?
							</h2>
							<p class="mt-1 text-sm text-[#435249]">
								Masukkan kode 6 digit untuk memilih warna seragam avatar dan mulai
								bermain tanpa perlu membuat akun.
							</p>

							<form
								class="mt-5 space-y-3"
								@submit.prevent="handleQuickJoin"
							>
								<div>
									<label
										for="quick-pin-input"
										class="block text-xs font-bold uppercase tracking-wider text-[#435249]"
									>
										Kode Ruangan (6 Digit)
									</label>
									<input
										id="quick-pin-input"
										v-model="quickPin"
										type="text"
										maxlength="8"
										placeholder="123456"
										class="font-mono-num mt-1.5 w-full rounded-xl border-2 border-[#16211b] bg-[#faf6ee] px-4 py-3 text-center text-2xl font-extrabold tracking-widest text-[#16211b]"
									/>
								</div>

								<button
									type="submit"
									class="pixel-btn w-full rounded-xl bg-[#f59e0b] py-3.5 text-base font-extrabold text-[#16211b]"
								>
									Lanjut Pilih Avatar
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Map Catalog Section -->
		<section class="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<span class="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
						KATALOG DUNIA 2D
					</span>
					<h2 class="mt-1 text-2xl font-extrabold text-[#16211b] sm:text-3xl">
						Pilih peta permainan sesuai suasana materi kelas
					</h2>
				</div>
				<p class="text-sm text-[#435249]">
					Seluruh peta terbuka gratis dengan kapasitas hingga 200 siswa per sesi.
				</p>
			</div>

			<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<article
					v-for="map in maps"
					:key="map.id"
					class="pixel-card flex flex-col justify-between rounded-2xl p-5"
				>
					<div>
						<!-- Visual GBA Map Preview Header -->
						<div
							class="relative h-36 w-full overflow-hidden rounded-xl border-2 border-[#16211b]"
							:style="{ backgroundColor: map.palette.floorPrimary }"
						>
							<img
								:src="map.mapImageUrl"
								:alt="map.name"
								class="h-full w-full object-cover"
								style="image-rendering: pixelated"
							/>
							<div
								class="absolute bottom-3 left-3 rounded-md border border-[#16211b] bg-white/95 px-2 py-0.5 text-[11px] font-extrabold text-[#16211b]"
							>
								{{
									map.defaultMode === 'free'
										? 'Mode Eksplorasi Bebas'
										: 'Mode Jalur Berurutan'
								}}
							</div>
							<div
								class="absolute bottom-3 right-3 rounded-md border border-[#16211b] bg-[#fef08a] px-2 py-0.5 font-mono-num text-[11px] font-bold text-[#16211b]"
							>
								{{ map.spawnPoints.length }} Pos Soal
							</div>
						</div>

						<h3 class="mt-4 text-lg font-extrabold text-[#16211b]">
							{{ map.name }}
						</h3>
						<p class="mt-1.5 text-xs leading-relaxed text-[#435249]">
							{{ map.description }}
						</p>
					</div>

					<div class="mt-5 flex items-center gap-2 pt-3 border-t border-[#e6decb]">
						<NuxtLink
							:to="`/build?mapId=${map.id}`"
							class="pixel-btn flex-1 rounded-lg bg-[#15803d] py-2 text-center text-xs font-extrabold text-white"
						>
							Pakai Peta Ini
						</NuxtLink>
					</div>
				</article>
			</div>
		</section>

		<!-- Ready-to-play Starter Quizzes -->
		<section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<span class="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
						SIAP DIMAINKAN DI KELAS
					</span>
					<h2 class="mt-1 text-2xl font-extrabold text-[#16211b] sm:text-3xl">
						Kuis komunitas pilihan guru Indonesia
					</h2>
				</div>
				<NuxtLink
					to="/explore"
					class="text-sm font-extrabold text-[#15803d] underline"
				>
					Lihat seluruh perpustakaan kuis
				</NuxtLink>
			</div>

			<div class="mt-6 grid gap-6 md:grid-cols-2">
				<article
					v-for="quiz in quizzes"
					:key="quiz.id"
					class="pixel-card rounded-2xl p-6"
				>
					<div class="flex flex-wrap items-center gap-2">
						<span
							class="rounded-md border border-[#16211b] bg-[#fef3c7] px-2.5 py-0.5 text-xs font-extrabold uppercase text-[#92400e]"
						>
							{{ quiz.schoolLevel.toUpperCase() }} · {{ quiz.gradeLabel }}
						</span>
						<span
							class="rounded-md border border-[#16211b] bg-[#dcfce7] px-2.5 py-0.5 text-xs font-extrabold text-[#14532d]"
						>
							{{ quiz.subject }}
						</span>
						<span class="font-mono-num text-xs font-bold text-[#435249]">
							{{ quiz.questions.length }} Soal
						</span>
					</div>

					<h3 class="mt-3 text-xl font-extrabold text-[#16211b]">
						{{ quiz.title }}
					</h3>
					<p class="mt-1.5 text-sm text-[#435249]">
						{{ quiz.description }}
					</p>
					<p class="mt-2 text-xs font-semibold text-[#435249]">
						Disusun oleh {{ quiz.ownerName }}
					</p>

					<div class="mt-5 flex flex-wrap items-center gap-3">
						<button
							type="button"
							:disabled="creatingQuizId === quiz.id"
							class="pixel-btn rounded-xl bg-[#15803d] px-4 py-2.5 text-xs font-extrabold text-white"
							@click="startHostSession(quiz.id)"
						>
							{{
								creatingQuizId === quiz.id
									? 'Menyiapkan Ruangan...'
									: 'Buka Kelas Live (Layar Guru)'
							}}
						</button>
						<NuxtLink
							to="/play/123456?nickname=Siswa&colorway=batik-biru"
							class="pixel-btn rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#16211b]"
						>
							Coba sebagai Siswa
						</NuxtLink>
					</div>
				</article>
			</div>
		</section>
	</div>
</template>
