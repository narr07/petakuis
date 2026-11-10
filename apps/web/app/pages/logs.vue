<script setup lang="ts">
	const { data, refresh } = await useFetch<{
		webLogs: Array<{
			id: string
			timestamp: string
			service: string
			level: string
			tag: string
			message: string
		}>
		gameServerLogs: Array<{
			id: string
			timestamp: string
			service: string
			level: string
			tag: string
			message: string
		}>
	}>('/api/logs')

	const doneItems = [
		{
			title: '3 Peta Dunia Terbuka Multi-Region (Hoenn GBA 60×50, Lembah Sunnyside 64×48, Kampus Modern 48×36)',
			detail: 'Setiap peta menggabungkan 4 kawasan/kota sekaligus dengan 24 pos soal dan 3 gaya tilemap berbeda.'
		},
		{
			title: 'Fisika Collision 2D Ketat (move_and_slide) & BFS Shortest-Path Pathfinding',
			detail: 'Siswa tidak dapat menembus rumah, atap, pohon, atau air. Klik/tap otomatis mencari jalan setapak (959 unit test assertions lolos).'
		},
		{
			title: 'Perbaikan Bug UI Terhalang (Z-Index Modal Soal & Isolasi Canvas)',
			detail: 'GameCanvas terisolasi pada z-index 0 (Y-sort 2..80) dan QuestionModal berada di z-index 2000 tanpa tertimpa sprite/pin.'
		},
		{
			title: 'Live Demo Tilemap Switcher & Pembersihan Plang P.C / MART / GYM',
			detail: 'Ganti tilemap secara instan di HUD /play/[code] & /host/[code], ditambah 3 PIN demo aktif (123456, 222222, 333333).'
		},
		{
			title: 'Identitas Visual & Maskot Kuispi Refined (Logo Design Skill)',
			detail: 'Maskot rubah petualang bertopi ranger ramah & gemas, vektor SVG 256×256, favicon .ico/.svg, dan logo kit PWA lengkap terpasang di Navbar.'
		},
		{
			title: 'Alur Lengkap ZEP QUIZ (Explore, Build 3 Langkah + AI, Join, Play, Host 5 Hz, Report CSV)',
			detail: 'Mendukung tipe soal Pilihan Ganda, Benar/Salah (O/X), dan Isian Singkat (ignoreSpaces + Hint) serta Mode Aksesibel.'
		}
	]

	const pendingItems = [
		{
			title: 'Persistensi Database Permanen (PostgreSQL + Drizzle ORM + Redis)',
			detail: 'Saat ini penyimpanan kuis baru dan sesi masih in-memory (reset saat server di-restart).'
		},
		{
			title: 'Autentikasi Akun Guru (Google OAuth & Magic Link Email)',
			detail: 'Menyimpan koleksi kuis dan riwayat laporan secara permanen per akun guru.'
		},
		{
			title: 'Mode Pekerjaan Rumah (PR Asinkron dengan Tenggat Waktu)',
			detail: 'Penugasan mandiri yang dapat dikerjakan siswa di rumah tanpa layar Host live.'
		},
		{
			title: 'Efek Suara (SFX) & Musik Latar (BGM) 8-Bit dengan Kontrol Mute',
			detail: 'Audio interaktif saat membuka Pokéball/peti soal, menjawab benar/salah, dan podium akhir.'
		},
		{
			title: 'Importer TileMapLayer Godot 4.7.2 (.tscn) ke MapTemplate',
			detail: 'Alat konversi otomatis bila mendesain peta kustom langsung di editor Godot 4.7.2.'
		}
	]

	let timer: ReturnType<typeof setInterval> | null = null

	onMounted(() => {
		timer = setInterval(() => {
			refresh()
		}, 3000)
	})

	onBeforeUnmount(() => {
		if (timer) clearInterval(timer)
	})
</script>

<template>
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<span class="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
					OBSERVABILITAS REALTIME (CONSOLA)
				</span>
				<h1 class="mt-1 text-2xl font-extrabold text-[#16211b] sm:text-3xl">
					Log Aktivitas Server & Sesi Game
				</h1>
				<p class="mt-1 text-sm text-[#435249]">
					Memantau log terstruktur dari Nuxt Server (`apps/web`) dan Socket.IO Game
					Server (`apps/game-server`) secara langsung.
				</p>
			</div>

			<button
				type="button"
				class="pixel-btn rounded-xl bg-[#15803d] px-4 py-2.5 text-xs font-extrabold text-white"
				@click="refresh()"
			>
				Segarkan Log Sekarang
			</button>
		</div>

		<!-- Status Progres Implementasi: Apa yang Sudah & Apa yang Belum -->
		<div class="mt-6 grid gap-6 lg:grid-cols-2">
			<section class="pixel-card rounded-2xl p-5">
				<div class="flex items-center justify-between border-b-2 border-[#16211b] pb-3">
					<h2 class="text-base font-extrabold text-[#14532d]">
						✅ Apa yang Sudah Selesai ({{ doneItems.length }} Modul Inti)
					</h2>
					<span class="rounded-md border border-[#16211b] bg-[#dcfce7] px-2 py-0.5 text-[11px] font-extrabold text-[#14532d]">
						TERVERIFIKASI
					</span>
				</div>
				<ul class="mt-4 space-y-2.5">
					<li
						v-for="(item, idx) in doneItems"
						:key="idx"
						class="rounded-xl border border-[#16211b] bg-[#f0fdf4] p-3"
					>
						<p class="text-xs font-extrabold text-[#16211b]">
							{{ idx + 1 }}. {{ item.title }}
						</p>
						<p class="mt-1 text-xs text-[#435249]">
							{{ item.detail }}
						</p>
					</li>
				</ul>
			</section>

			<section class="pixel-card rounded-2xl p-5">
				<div class="flex items-center justify-between border-b-2 border-[#16211b] pb-3">
					<h2 class="text-base font-extrabold text-[#92400e]">
						⏳ Apa yang Belum / Tahap Berikutnya ({{ pendingItems.length }} Item)
					</h2>
					<span class="rounded-md border border-[#16211b] bg-[#fef08a] px-2 py-0.5 text-[11px] font-extrabold text-[#16211b]">
						BACKLOG FASE 2
					</span>
				</div>
				<ul class="mt-4 space-y-2.5">
					<li
						v-for="(item, idx) in pendingItems"
						:key="idx"
						class="rounded-xl border border-[#16211b] bg-[#faf6ee] p-3"
					>
						<p class="text-xs font-extrabold text-[#16211b]">
							{{ idx + 1 }}. {{ item.title }}
						</p>
						<p class="mt-1 text-xs text-[#435249]">
							{{ item.detail }}
						</p>
					</li>
				</ul>
			</section>
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-2">
			<!-- Game Server Logs -->
			<section class="pixel-card rounded-2xl p-5">
				<h2 class="text-base font-extrabold text-[#16211b]">
					Log Realtime Game Server (Port 3001)
				</h2>
				<div class="mt-4 max-h-96 space-y-2 overflow-y-auto font-mono-num text-xs">
					<div
						v-for="item in data?.gameServerLogs || []"
						:key="item.id"
						class="rounded-lg border border-[#16211b] bg-[#faf6ee] p-2.5"
					>
						<div class="flex items-center justify-between text-[11px] font-bold text-[#435249]">
							<span>[{{ item.tag }}] · {{ item.level.toUpperCase() }}</span>
							<span>{{ item.timestamp.slice(11, 19) }}</span>
						</div>
						<p class="mt-1 font-bold text-[#16211b]">
							{{ item.message }}
						</p>
					</div>
				</div>
			</section>

			<!-- Web API Logs -->
			<section class="pixel-card rounded-2xl p-5">
				<h2 class="text-base font-extrabold text-[#16211b]">
					Log HTTP & API Nuxt 4 (Port 3000)
				</h2>
				<div class="mt-4 max-h-96 space-y-2 overflow-y-auto font-mono-num text-xs">
					<div
						v-for="item in data?.webLogs || []"
						:key="item.id"
						class="rounded-lg border border-[#16211b] bg-[#faf6ee] p-2.5"
					>
						<div class="flex items-center justify-between text-[11px] font-bold text-[#435249]">
							<span>[{{ item.tag }}] · {{ item.level.toUpperCase() }}</span>
							<span>{{ item.timestamp.slice(11, 19) }}</span>
						</div>
						<p class="mt-1 font-bold text-[#16211b]">
							{{ item.message }}
						</p>
					</div>
				</div>
			</section>
		</div>
	</div>
</template>
