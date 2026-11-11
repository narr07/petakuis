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
	const previewMap = MAP_CATALOG.find(m => m.id === 'map-desa-sunnyside') ?? MAP_CATALOG[0]

	const pin = ref<string[]>([])
	const pinCode = computed(() => pin.value.join('').replace(/\D/g, ''))

	function joinWithPin() {
		router.push(pinCode.value ? { path: '/join', query: { code: pinCode.value } } : '/join')
	}

	const stats = [
		{ title: 'Siswa per sesi', value: 'Hingga 200', icon: 'i-lucide-users' },
		{ title: 'Biaya langganan', value: 'Rp0', icon: 'i-lucide-badge-percent' },
		{ title: 'Masuk siswa', value: 'PIN 6 digit', icon: 'i-lucide-key-round' },
		{ title: 'Peta 2D', value: `${MAP_CATALOG.length} peta`, icon: 'i-lucide-map' }
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
</script>

<template>
	<div>
		<UPageHero
			orientation="horizontal"
			description="Siswa menggerakkan avatar di peta piksel, mengikuti kompas ke pos soal, lalu berlomba menjawab dengan tepat dan cepat. Gratis untuk seluruh sekolah Indonesia."
			:links="[
				{ label: 'Buat Kuis Baru', to: '/build', icon: 'i-lucide-plus', size: 'xl' },
				{ label: 'Coba Room Demo', to: '/play/123456?nickname=SiswaDemo&colorway=merah-putih', icon: 'i-lucide-play', color: 'neutral', variant: 'outline', size: 'xl' }
			]"
		>
			<template #headline>
				<UBadge
					label="Gratis untuk sekolah Indonesia"
					color="primary"
					variant="subtle"
					size="lg"
					icon="i-lucide-party-popper"
				/>
			</template>

			<template #title>
				Ubah latihan soal jadi <span class="text-primary">petualangan peta 2D</span>
			</template>

			<UPageCard
				variant="subtle"
				icon="i-lucide-gamepad-2"
				title="Punya PIN dari gurumu?"
				description="Masukkan 6 digit kode ruangan, pilih avatar, dan langsung bertualang tanpa akun."
				class="w-full max-w-md justify-self-center"
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
		</UPageHero>

		<UContainer>
			<UPageGrid class="gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-px">
				<UPageCard
					v-for="stat in stats"
					:key="stat.title"
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
					<span class="text-2xl font-semibold text-highlighted">{{ stat.value }}</span>
				</UPageCard>
			</UPageGrid>
		</UContainer>

		<UPageSection
			headline="Cara kerja"
			title="Dari soal ke petualangan dalam empat langkah"
			description="Guru mengendalikan kapan sesi dimulai dan berakhir. Siswa fokus menjelajah dan menjawab."
			orientation="horizontal"
			:features="steps"
		>
			<UCard :ui="{ body: 'p-0 sm:p-0' }" class="overflow-hidden">
				<!-- Nuxt UI tidak punya komponen gambar biasa, jadi pratinjau peta memakai <img> -->
				<img
					:src="previewMap?.mapImageUrl"
					:alt="`Pratinjau peta ${previewMap?.name}`"
					loading="lazy"
					class="aspect-[4/3] w-full object-cover [image-rendering:pixelated]"
				>
			</UCard>
		</UPageSection>

		<UPageSection
			id="fitur"
			headline="Fitur"
			title="Lengkap untuk belajar aktif di kelas"
			description="Semua fitur terbuka tanpa langganan, supaya siswa belajar sambil menjelajah bersama teman sekelas."
			class="scroll-mt-(--ui-header-height)"
		>
			<UPageGrid>
				<UPageCard
					v-for="item in features"
					:key="item.title"
					v-bind="item"
					spotlight
				/>
			</UPageGrid>
		</UPageSection>

		<UPageSection
			id="peta"
			headline="Katalog peta"
			title="Pilih dunia sesuai suasana materi"
			description="Setiap peta punya pos soal yang tersebar di beberapa kawasan dan bisa dipakai untuk kelas mana pun."
			class="scroll-mt-(--ui-header-height)"
		>
			<UPageGrid>
				<MapCard v-for="m in maps" :key="m.id" :map="m" />
			</UPageGrid>
		</UPageSection>

		<UPageSection
			headline="Siap dimainkan"
			title="Kuis pilihan dari komunitas guru"
			description="Buka langsung sebagai sesi kelas live, atau coba dulu sebagai siswa."
			:links="[{ label: 'Lihat semua kuis', to: '/explore', color: 'neutral', variant: 'outline', trailingIcon: 'i-lucide-arrow-right' }]"
		>
			<UPageGrid v-if="quizzes.length">
				<QuizCard
					v-for="q in quizzes"
					:key="q.id"
					:quiz="q"
					:launching="launchingId === q.id"
					@launch="launch"
				/>
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
			description="Buat kuis pertamamu dalam hitungan menit. Tanpa kartu kredit, tanpa batas fitur."
			variant="naked"
			:links="[
				{ label: 'Mulai Buat Kuis', to: '/build', icon: 'i-lucide-rocket', size: 'xl' },
				{ label: 'Jelajahi Kuis', to: '/explore', color: 'neutral', variant: 'subtle', size: 'xl' }
			]"
		/>
	</div>
</template>
