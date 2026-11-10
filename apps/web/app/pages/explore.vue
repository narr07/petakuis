<script setup lang="ts">
	import {
		INDONESIAN_SUBJECTS,
		SCHOOL_LEVEL_OPTIONS,
		type QuizDefinition
	} from '@petakuis/shared'

	const router = useRouter()
	const selectedLevel = ref('all')
	const selectedSubject = ref('all')
	const searchQuery = ref('')
	const launchingId = ref<string | null>(null)

	const { data, refresh } = await useFetch<{ quizzes: QuizDefinition[] }>(
		'/api/quizzes',
		{
			query: {
				schoolLevel: selectedLevel,
				subject: selectedSubject,
				q: searchQuery
			}
		}
	)

	const quizzes = computed(() => data.value?.quizzes || [])

	async function launchLiveSession(quizId: string) {
		launchingId.value = quizId
		try {
			const res = await $fetch<{
				ok: boolean
				code: string
			}>('/api/sessions', {
				method: 'POST',
				body: {
					quizId,
					autoStart: true
				}
			})
			await router.push(`/host/${res.code}`)
		} finally {
			launchingId.value = null
		}
	}
</script>

<template>
	<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<div>
				<span class="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
					PERPUSTAKAAN TERBUKA
				</span>
				<h1 class="mt-1 text-3xl font-extrabold text-[#16211b]">
					Jelajahi Kuis Komunitas Guru
				</h1>
				<p class="mt-1 text-sm text-[#435249]">
					Semua kuis di bawah ini dapat langsung dibuka untuk sesi kelas live atau
					dimodifikasi tanpa biaya.
				</p>
			</div>

			<NuxtLink
				to="/build"
				class="pixel-btn rounded-xl bg-[#15803d] px-5 py-3 text-sm font-extrabold text-white"
			>
				+ Susun Kuis Baru
			</NuxtLink>
		</div>

		<!-- Filters -->
		<div class="pixel-card mt-6 grid gap-4 rounded-2xl p-5 sm:grid-cols-3">
			<div>
				<label
					for="filter-search"
					class="block text-xs font-extrabold uppercase tracking-wider text-[#435249]"
				>
					Cari Judul atau Materi
				</label>
				<input
					id="filter-search"
					v-model="searchQuery"
					type="search"
					placeholder="Misal: Pythagoras, Geografi..."
					class="mt-1.5 w-full rounded-xl border-2 border-[#16211b] bg-white px-3.5 py-2.5 text-sm font-semibold"
					@input="refresh()"
				/>
			</div>

			<div>
				<label
					for="filter-level"
					class="block text-xs font-extrabold uppercase tracking-wider text-[#435249]"
				>
					Jenjang Pendidikan
				</label>
				<select
					id="filter-level"
					v-model="selectedLevel"
					class="mt-1.5 w-full rounded-xl border-2 border-[#16211b] bg-white px-3.5 py-2.5 text-sm font-bold"
					@change="refresh()"
				>
					<option value="all">Semua Jenjang</option>
					<option
						v-for="lvl in SCHOOL_LEVEL_OPTIONS"
						:key="lvl.id"
						:value="lvl.id"
					>
						{{ lvl.label }}
					</option>
				</select>
			</div>

			<div>
				<label
					for="filter-subject"
					class="block text-xs font-extrabold uppercase tracking-wider text-[#435249]"
				>
					Mata Pelajaran
				</label>
				<select
					id="filter-subject"
					v-model="selectedSubject"
					class="mt-1.5 w-full rounded-xl border-2 border-[#16211b] bg-white px-3.5 py-2.5 text-sm font-bold"
					@change="refresh()"
				>
					<option value="all">Semua Mata Pelajaran</option>
					<option
						v-for="subj in INDONESIAN_SUBJECTS"
						:key="subj"
						:value="subj"
					>
						{{ subj }}
					</option>
				</select>
			</div>
		</div>

		<!-- Quiz List -->
		<div class="mt-8 grid gap-6 md:grid-cols-2">
			<article
				v-for="quiz in quizzes"
				:key="quiz.id"
				class="pixel-card flex flex-col justify-between rounded-2xl p-6"
			>
				<div>
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
						<span
							class="rounded-md border border-[#16211b] bg-[#f3ecdc] px-2.5 py-0.5 text-xs font-bold text-[#16211b]"
						>
							Mode {{ quiz.mode === 'free' ? 'Bebas' : 'Berurutan' }}
						</span>
					</div>

					<h2 class="mt-3 text-xl font-extrabold text-[#16211b]">
						{{ quiz.title }}
					</h2>
					<p class="mt-1 text-sm text-[#435249]">
						{{ quiz.description }}
					</p>

					<div class="mt-4 rounded-xl border border-[#16211b]/20 bg-[#faf6ee] p-3">
						<p class="text-xs font-extrabold uppercase text-[#435249]">
							Contoh Pertanyaan ({{ quiz.questions.length }} Soal):
						</p>
						<ul class="mt-1.5 space-y-1 text-xs font-semibold text-[#16211b]">
							<li
								v-for="q in quiz.questions.slice(0, 3)"
								:key="q.id"
								class="truncate"
							>
								• [{{
									q.type === 'multiple'
										? 'PG'
										: q.type === 'ox'
											? 'B/S'
											: 'Isian'
								}}] {{ q.prompt }}
							</li>
						</ul>
					</div>
				</div>

				<div class="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e6decb]">
					<span class="text-xs font-semibold text-[#435249]">
						Oleh {{ quiz.ownerName }}
					</span>
					<div class="flex items-center gap-2.5">
						<button
							type="button"
							:disabled="launchingId === quiz.id"
							class="pixel-btn rounded-xl bg-[#15803d] px-4 py-2 text-xs font-extrabold text-white"
							@click="launchLiveSession(quiz.id)"
						>
							{{
								launchingId === quiz.id
									? 'Membuka Kelas...'
									: 'Buka Kelas Live'
							}}
						</button>
					</div>
				</div>
			</article>
		</div>
	</div>
</template>
