<script setup lang="ts">
	import type { AccordionItem, PageFeatureProps } from '@nuxt/ui'
	import { MAP_CATALOG, type QuizDefinition } from '@petakuis/shared'

	useSeoMeta({
		description:
			'Platform kuis kelas berbasis eksplorasi peta pixel art 2D. Gratis untuk guru dan siswa SD, SMP, dan SMA di Indonesia.'
	})

	const router = useRouter()
	const { launchingId, launch } = useLaunchSession()

	const { data: quizzesData } = await useFetch<{ quizzes: QuizDefinition[] }>('/api/quizzes')
	const quizzes = computed(() => (quizzesData.value?.quizzes || []).slice(0, 3))

	const maps = MAP_CATALOG

	const pin = ref<string[]>([])
	const pinCode = computed(() => pin.value.join('').replace(/\D/g, ''))

	function joinWithPin() {
		router.push(pinCode.value ? { path: '/join', query: { code: pinCode.value } } : '/join')
	}

	const DEMO_LINK = '/play/123456?nickname=SiswaDemo&colorway=merah-putih'

	const titleWords = ['Ubah', 'latihan', 'soal', 'jadi']
	const highlightWords = ['petualangan', 'peta', '2D']

	const numberFormat = new Intl.NumberFormat('id-ID')
	const stats = [
		{ title: 'Siswa per sesi', prefix: 'Hingga ', value: 200, from: 0, suffix: '', icon: 'i-lucide-users' },
		{ title: 'Biaya langganan', prefix: 'Rp', value: 0, from: 99000, suffix: '', icon: 'i-lucide-badge-percent' },
		{ title: 'Masuk siswa', prefix: 'PIN ', value: 6, from: 0, suffix: ' digit', icon: 'i-lucide-key-round' },
		{ title: 'Peta 2D', prefix: '', value: MAP_CATALOG.length, from: 0, suffix: ' peta', icon: 'i-lucide-map' }
	]

	const steps: PageFeatureProps[] = [
		{
			title: 'Guru memilih peta dan menyusun soal',
			description: 'Tulis soal sendiri, impor dari CSV, atau minta AI membuat drafnya dari topik pelajaran.',
			icon: 'i-lucide-pencil-ruler'
		},
		{
			title: 'Siswa masuk dengan PIN',
			description: 'Cukup buka browser, ketik 6 digit kode dari proyektor, lalu pilih avatar. Tanpa akun.',
			icon: 'i-lucide-key-round'
		},
		{
			title: 'Jelajahi peta, temukan pos soal',
			description: 'Kompas menunjuk pos terdekat. Jawaban benar dan cepat memberi poin lebih banyak.',
			icon: 'i-lucide-compass'
		},
		{
			title: 'Unduh laporan nilai',
			description: 'Lihat ketepatan per soal dan per siswa, lalu ekspor ke CSV.',
			icon: 'i-lucide-file-spreadsheet'
		}
	]

	const features = [
		{
			title: 'Gratis tanpa paywall',
			description: 'Semua peta, semua tipe soal, dan laporan terbuka tanpa paket berbayar.',
			icon: 'i-lucide-badge-percent'
		},
		{
			title: 'Belajar sambil bergerak',
			description: 'Avatar berjalan di dunia piksel mencari pos soal, bukan sekadar menekan tombol di layar.',
			icon: 'i-lucide-map-pin'
		},
		{
			title: 'Generator soal AI',
			description: 'Buat draf soal pilihan ganda, benar/salah, dan isian singkat dari topik atau teks materi.',
			icon: 'i-lucide-sparkles'
		},
		{
			title: 'Privasi siswa terjaga',
			description: 'Siswa hanya memakai nama panggilan. Tidak perlu email atau nomor HP.',
			icon: 'i-lucide-shield-check'
		},
		{
			title: 'Radar kelas untuk guru',
			description: 'Layar host menampilkan posisi seluruh siswa di peta dan papan peringkat secara langsung.',
			icon: 'i-lucide-radar'
		},
		{
			title: 'Ekspor nilai ke CSV',
			description: 'Rekap nilai per siswa siap diolah di spreadsheet atau diunggah ke Google Classroom.',
			icon: 'i-lucide-file-spreadsheet'
		}
	]

	const faq: AccordionItem[] = [
		{
			label: 'Apakah Petakuis benar-benar gratis?',
			content: 'Ya. Semua peta, tipe soal, dan laporan bisa dipakai tanpa langganan dan tanpa kartu kredit.'
		},
		{
			label: 'Apakah siswa perlu membuat akun?',
			content: 'Tidak. Siswa cukup memasukkan PIN 6 digit dari guru dan nama panggilan, lalu langsung bermain.'
		},
		{
			label: 'Perangkat apa yang dibutuhkan?',
			content: 'Browser modern di HP Android, laptop, atau Chromebook. Tidak perlu memasang aplikasi.'
		},
		{
			label: 'Bagaimana cara membuat soal?',
			content: 'Lewat halaman Buat Kuis: tulis manual, impor dari berkas CSV, atau gunakan generator AI dari topik pelajaran.'
		},
		{
			label: 'Data siswa apa saja yang disimpan?',
			content: 'Hanya nama panggilan selama sesi, beserta jawaban dan skornya untuk laporan guru.'
		}
	]

	// Dekorasi langit hero: awan melayang dan benda piksel yang naik-turun.
	const clouds = [
		{ top: '8%', scale: 5, duration: 70, progress: 0.15 },
		{ top: '26%', scale: 3, duration: 55, progress: 0.6 },
		{ top: '62%', scale: 4, duration: 85, progress: 0.85 }
	]
	const floaters = [
		{ name: 'coin', scale: 3, class: 'left-[3%] top-[18%] hidden sm:block' },
		{ name: 'sparkle', scale: 3, class: 'left-[46%] top-[10%] hidden lg:block' },
		{ name: 'heart', scale: 3, class: 'left-[48%] bottom-[14%] hidden lg:block' },
		{ name: 'coin', scale: 2, class: 'right-[3%] top-[8%] hidden sm:block' },
		{ name: 'sparkle', scale: 2, class: 'left-[6%] bottom-[10%] hidden sm:block' }
	] as const

	const sectionUi = { headline: 'font-pixel text-base tracking-wide' }

	const page = ref<HTMLElement | null>(null)

	useGsapScene(page, ({ gsap, ScrollTrigger, reduced }) => {
		if (reduced) return
		// Semua gerak memakai ease "steps" supaya terasa patah-patah seperti animasi sprite 16-bit.
		const snap4 = gsap.utils.unitize((v: number) => Math.round(v / 4) * 4)

		gsap.timeline({ defaults: { ease: 'steps(5)', duration: 0.45 } })
			.from('[data-hero-badge]', { y: -24, opacity: 0 })
			.from('[data-hero-word]', { y: 48, opacity: 0, stagger: 0.07 }, '-=0.2')
			.from('[data-hero-underline]', { scaleX: 0, ease: 'steps(8)', duration: 0.4, stagger: 0.15 }, '-=0.1')
			.from('[data-hero-fade]', { y: 24, opacity: 0, stagger: 0.1 }, '<')
			.from('[data-hero-window]', { y: 48, opacity: 0, ease: 'steps(6)', duration: 0.6 }, 0.35)
			.from('[data-hero-pin]', { y: 40, opacity: 0, ease: 'steps(6)', duration: 0.6 }, 0.6)

		gsap.utils.toArray<HTMLElement>('[data-cloud]').forEach((cloud, i) => {
			const cfg = clouds[i]!
			gsap.fromTo(cloud,
				{ x: -160 },
				{ x: () => window.innerWidth + 40, duration: cfg.duration, ease: 'none', repeat: -1, modifiers: { x: snap4 } }
			).progress(cfg.progress)
		})

		gsap.to('[data-floater]', { y: -12, duration: 0.8, ease: 'steps(3)', repeat: -1, yoyo: true, stagger: { each: 0.3, from: 'random' } })

		// Angka statistik berhitung naik (atau turun ke Rp0) saat terlihat.
		gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
			const to = Number(el.dataset.to)
			const counter = { v: Number(el.dataset.from) }
			gsap.to(counter, {
				v: to,
				duration: 1.4,
				ease: 'steps(14)',
				scrollTrigger: { trigger: el, start: 'top 90%', once: true },
				onUpdate: () => {
					el.textContent = numberFormat.format(Math.round(counter.v))
				}
			})
		})

		// Kartu muncul berurutan dengan langkah patah-patah.
		gsap.set('[data-reveal]', { opacity: 0 })
		ScrollTrigger.batch('[data-reveal]', {
			start: 'top 90%',
			once: true,
			onEnter: els => gsap.fromTo(els, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'steps(4)', stagger: 0.08 })
		})

		// Pratinjau peta terbuka dari atas ke bawah seperti layar game yang dimuat baris demi baris.
		gsap.set('[data-reveal-scan]', { clipPath: 'inset(0% 0% 100% 0%)' })
		ScrollTrigger.batch('[data-reveal-scan]', {
			start: 'top 88%',
			once: true,
			onEnter: els => gsap.to(els, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'steps(8)', stagger: 0.1 })
		})
	})
</script>

<template>
	<div ref="page">
		<UPageHero
			orientation="horizontal"
			class="relative overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50/60 to-transparent dark:from-sky-950/50 dark:via-sky-950/20"
			:ui="{ container: 'relative z-10' }"
		>
			<template #top>
				<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
					<span
						v-for="(c, i) in clouds"
						:key="`cloud-${i}`"
						data-cloud
						class="absolute left-0 opacity-90 dark:opacity-20"
						:style="{ top: c.top }"
					>
						<PixelArt name="cloud" :scale="c.scale" />
					</span>
					<span
						v-for="(f, i) in floaters"
						:key="`floater-${i}`"
						data-floater
						class="absolute"
						:class="f.class"
					>
						<PixelArt :name="f.name" :scale="f.scale" />
					</span>
				</div>
			</template>

			<template #headline>
				<UBadge
					data-hero-badge
					label="Gratis untuk sekolah Indonesia"
					color="primary"
					variant="subtle"
					size="lg"
					icon="i-lucide-party-popper"
					class="font-pixel"
				/>
			</template>

			<template #title>
				<template v-for="w in titleWords" :key="w">
					<span data-hero-word class="inline-block">{{ w }}</span>{{ ' ' }}
				</template>
				<span class="text-primary">
					<template v-for="(w, i) in highlightWords" :key="w">
						<span data-hero-word class="relative inline-block">
							{{ w }}
							<span data-hero-underline class="pixel-underline absolute inset-x-0 -bottom-1 h-1.5" aria-hidden="true" />
						</span><template v-if="i < highlightWords.length - 1">{{ ' ' }}</template>
					</template>
				</span>
			</template>

			<template #description>
				<span data-hero-fade class="block">
					Siswa menggerakkan avatar di peta piksel, mengikuti kompas ke pos soal, lalu berlomba menjawab dengan tepat dan cepat. Gratis untuk seluruh sekolah Indonesia.
				</span>
			</template>

			<template #links>
				<div data-hero-fade class="flex flex-wrap gap-3">
					<UButton label="Buat Kuis Baru" to="/build" icon="i-lucide-plus" size="xl" class="pixel-shadow transition-transform hover:-translate-y-1" />
					<UButton label="Coba Room Demo" :to="DEMO_LINK" icon="i-lucide-play" color="neutral" variant="outline" size="xl" class="transition-transform hover:-translate-y-1" />
				</div>
			</template>

			<div class="relative mx-auto w-full max-w-xl">
				<UCard
					data-hero-window
					class="pixel-shadow overflow-hidden ring-4 ring-inverted/85"
					:ui="{ body: 'p-0 sm:p-0' }"
				>
					<LandingHeroQuestScene />
				</UCard>

				<UPageCard
					data-hero-pin
					variant="outline"
					icon="i-lucide-gamepad-2"
					title="Punya PIN dari gurumu?"
					description="Masukkan 6 digit kode ruangan, pilih avatar, dan langsung bertualang tanpa akun."
					class="pixel-shadow relative z-10 mx-3 -mt-12 bg-default sm:mx-8"
				>
					<UFormField label="Kode ruangan" hint="Demo: 123456">
						<UPinInput
							v-model="pin"
							:length="6"
							otp
							size="xl"
							placeholder="○"
							class="w-full"
							@complete="joinWithPin"
						/>
					</UFormField>

					<UButton
						label="Pilih Avatar & Main"
						trailing-icon="i-lucide-arrow-right"
						size="xl"
						block
						@click="joinWithPin"
					/>

					<div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
						<span class="inline-flex items-center gap-1">
							<UIcon name="i-lucide-download-cloud" class="size-4" /> Tanpa instal aplikasi
						</span>
						<span class="inline-flex items-center gap-1">
							<UIcon name="i-lucide-smartphone" class="size-4" /> HP, laptop, Chromebook
						</span>
					</div>
				</UPageCard>
			</div>
		</UPageHero>

		<UContainer>
			<UPageGrid class="gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-px">
				<UPageCard
					v-for="stat in stats"
					:key="stat.title"
					data-reveal
					:icon="stat.icon"
					:title="stat.title"
					variant="subtle"
					:ui="{
						container: 'gap-y-1.5',
						wrapper: 'items-start',
						leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
						title: 'font-normal text-muted text-xs uppercase'
					}"
					class="lg:rounded-none lg:first:rounded-l-lg lg:last:rounded-r-lg"
				>
					<span class="font-pixel text-3xl font-semibold text-highlighted">
						{{ stat.prefix }}<span data-count :data-from="stat.from" :data-to="stat.value">{{ numberFormat.format(stat.value) }}</span>{{ stat.suffix }}
					</span>
				</UPageCard>
			</UPageGrid>
		</UContainer>

		<div class="mt-16 sm:mt-24">
			<p class="mb-3 text-center font-pixel text-sm tracking-wide text-muted">
				Pilih satu dari delapan avatar, lalu ikut berbaris ke pos soal
			</p>
			<LandingPixelParade />
		</div>

		<UPageSection
			id="cara-kerja"
			headline="Cara kerja"
			title="Dari soal ke petualangan dalam empat langkah"
			description="Guru mengendalikan kapan sesi dimulai dan berakhir. Siswa fokus menjelajah dan menjawab."
			orientation="horizontal"
			:features="steps"
			:ui="sectionUi"
			class="quest-steps scroll-mt-(--ui-header-height)"
		>
			<UCard :ui="{ body: 'p-0 sm:p-0' }" class="pixel-shadow overflow-hidden ring-4 ring-inverted/85">
				<LandingQuestRouteMap />
			</UCard>
		</UPageSection>

		<UPageSection
			id="fitur"
			headline="Fitur"
			title="Lengkap untuk belajar aktif di kelas"
			description="Semua fitur terbuka tanpa langganan, supaya siswa belajar sambil menjelajah bersama teman sekelas."
			:ui="sectionUi"
			class="scroll-mt-(--ui-header-height)"
		>
			<UPageGrid>
				<UPageCard
					v-for="item in features"
					:key="item.title"
					v-bind="item"
					data-reveal
					spotlight
					class="transition-transform duration-150 ease-[steps(3)] hover:-translate-y-1"
				/>
			</UPageGrid>
		</UPageSection>

		<UPageSection
			id="peta"
			headline="Katalog peta"
			title="Pilih dunia sesuai suasana materi"
			description="Setiap peta punya pos soal yang tersebar di beberapa kawasan dan bisa dipakai untuk kelas mana pun."
			:ui="sectionUi"
			class="scroll-mt-(--ui-header-height)"
		>
			<UPageGrid>
				<MapCard v-for="m in maps" :key="m.id" data-reveal-scan :map="m" />
			</UPageGrid>
		</UPageSection>

		<UPageSection
			headline="Siap dimainkan"
			title="Kuis pilihan dari komunitas guru"
			description="Buka langsung sebagai sesi kelas live, atau coba dulu sebagai siswa."
			:ui="sectionUi"
			:links="[{ label: 'Lihat semua kuis', to: '/explore', color: 'neutral', variant: 'outline', trailingIcon: 'i-lucide-arrow-right' }]"
		>
			<UPageGrid v-if="quizzes.length">
				<div v-for="q in quizzes" :key="q.id" data-reveal class="flex">
					<QuizCard
						:quiz="q"
						:launching="launchingId === q.id"
						class="w-full"
						@launch="launch"
					/>
				</div>
			</UPageGrid>
			<UEmpty
				v-else
				icon="i-lucide-library"
				title="Belum ada kuis"
				description="Jadilah yang pertama menyusun kuis untuk kelasmu."
				:actions="[{ label: 'Buat Kuis', to: '/build', icon: 'i-lucide-plus' }]"
			/>
		</UPageSection>

		<UPageSection
			headline="Pertanyaan umum"
			title="Yang sering ditanyakan guru"
			:ui="sectionUi"
		>
			<UAccordion
				:items="faq"
				type="multiple"
				:default-value="['0']"
				:unmount-on-hide="false"
				class="mx-auto max-w-3xl"
				:ui="{ trigger: 'text-base text-highlighted', body: 'text-base text-muted' }"
			/>
		</UPageSection>

		<USeparator />

		<UPageCTA
			title="Siap mengajak kelasmu bertualang?"
			description="Buat kuis pertamamu dalam hitungan menit. Tanpa kartu kredit, tanpa batas fitur. Peti hartanya sudah menunggu."
			variant="naked"
			orientation="horizontal"
			:links="[
				{ label: 'Mulai Buat Kuis', to: '/build', icon: 'i-lucide-rocket', size: 'xl' },
				{ label: 'Jelajahi Kuis', to: '/explore', color: 'neutral', variant: 'subtle', size: 'xl' }
			]"
		>
			<LandingTreasureChest />
		</UPageCTA>
	</div>
</template>
