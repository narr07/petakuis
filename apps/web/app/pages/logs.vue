<script setup lang="ts">
	interface LogEntry {
		id: string
		timestamp: string
		service: string
		level: string
		tag: string
		message: string
	}

	const { data, refresh, status } = await useFetch<{
		webLogs: LogEntry[]
		gameServerLogs: LogEntry[]
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
			title: 'Perbaikan Tuntas Bug UI Terhalang (Teleport ke Body & Z-Index Root 99999)',
			detail: 'QuestionModal di-teleport ke root body dengan z-index: 99999, efek backdrop-blur dihapus agar GPU Chromium tidak menembus, dan semua sprite pemain/pin canvas disembunyikan otomatis saat soal aktif.'
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

	const progress = computed(() =>
		Math.round(
			(doneItems.length / (doneItems.length + pendingItems.length)) * 100
		)
	)

	const progressSections = [
		{
			key: 'done',
			title: 'Sudah selesai',
			badge: 'Terverifikasi',
			badgeColor: 'success' as const,
			icon: 'i-lucide-circle-check-big',
			iconClass: 'bg-success text-inverted',
			items: doneItems
		},
		{
			key: 'pending',
			title: 'Tahap berikutnya',
			badge: 'Backlog fase 2',
			badgeColor: 'warning' as const,
			icon: 'i-lucide-hourglass',
			iconClass: 'bg-warning text-inverted',
			items: pendingItems
		}
	]

	const logPanels = computed(() => [
		{
			key: 'game',
			title: 'Game Server',
			subtitle: 'Socket.IO · Port 3001',
			icon: 'i-lucide-gamepad-2',
			logs: data.value?.gameServerLogs || []
		},
		{
			key: 'web',
			title: 'HTTP & API Nuxt',
			subtitle: 'Nuxt 4 · Port 3000',
			icon: 'i-lucide-globe',
			logs: data.value?.webLogs || []
		}
	])

	function levelColor(level: string) {
		switch (level.toLowerCase()) {
			case 'error':
			case 'fatal':
				return 'error' as const
			case 'warn':
			case 'warning':
				return 'warning' as const
			case 'info':
				return 'info' as const
			case 'success':
				return 'success' as const
			default:
				return 'neutral' as const
		}
	}

	// Auto-refresh
	const autoRefresh = ref(true)
	let timer: ReturnType<typeof setInterval> | null = null

	function stopTimer() {
		if (timer) clearInterval(timer)
		timer = null
	}

	function startTimer() {
		stopTimer()
		timer = setInterval(() => refresh(), 3000)
	}

	watch(autoRefresh, (on) => {
		if (on) startTimer()
		else stopTimer()
	})

	onMounted(() => {
		if (autoRefresh.value) startTimer()
	})

	onBeforeUnmount(stopTimer)
</script>

<template>
	<UContainer class="py-8">
		<!-- Header -->
		<UPageHeader
			headline="Observabilitas realtime"
			title="Log Aktivitas Server & Sesi Game"
			description="Memantau log terstruktur dari Nuxt Server (apps/web) dan Socket.IO Game Server (apps/game-server) secara langsung."
			:ui="{ root: 'border-b-0 pb-0' }"
		>
			<template #links>
				<div class="flex items-center gap-2 rounded-lg border-2 border-accented px-3 py-2">
					<USwitch v-model="autoRefresh" size="sm" label="Auto 3 dtk" />
				</div>
				<UButton
					icon="i-lucide-refresh-cw"
					label="Segarkan"
					:loading="status === 'pending'"
					@click="refresh()"
				/>
			</template>
		</UPageHeader>

		<!-- Ringkasan progres -->
		<UCard class="mt-6" :ui="{ body: 'p-4 sm:p-5' }">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<UIcon name="i-lucide-rocket" class="size-5 text-primary" />
					<h2 class="font-bold">Progres implementasi</h2>
				</div>
				<UBadge color="primary" variant="solid" size="lg">
					{{ progress }}% · {{ doneItems.length }} dari {{ doneItems.length + pendingItems.length }} modul
				</UBadge>
			</div>
			<UProgress v-model="progress" class="mt-3" color="success" />
		</UCard>

		<!-- Daftar progres -->
		<div class="mt-6 grid gap-6 lg:grid-cols-2">
			<UCard
				v-for="section in progressSections"
				:key="section.key"
				:ui="{ body: 'p-4 sm:p-5' }"
			>
				<template #header>
					<div class="flex items-center justify-between gap-3">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-xl border-2 border-[var(--ui-text-highlighted)]"
								:class="section.iconClass"
							>
								<UIcon :name="section.icon" class="size-5" />
							</div>
							<h2 class="text-base font-bold">
								{{ section.title }}
								<span class="text-muted">({{ section.items.length }})</span>
							</h2>
						</div>
						<UBadge :color="section.badgeColor" variant="subtle" size="sm">
							{{ section.badge }}
						</UBadge>
					</div>
				</template>

				<ul class="space-y-3">
					<li
						v-for="(item, idx) in section.items"
						:key="item.title"
						class="flex gap-3 rounded-xl border-2 border-default bg-muted p-3"
					>
						<UIcon
							:name="section.key === 'done' ? 'i-lucide-check' : 'i-lucide-circle-dashed'"
							class="mt-0.5 size-5 shrink-0"
							:class="section.key === 'done' ? 'text-success' : 'text-warning'"
						/>
						<div class="min-w-0">
							<p class="text-sm font-bold leading-snug">
								<span class="text-dimmed">{{ idx + 1 }}.</span> {{ item.title }}
							</p>
							<p class="mt-1 text-xs leading-relaxed text-muted">
								{{ item.detail }}
							</p>
						</div>
					</li>
				</ul>
			</UCard>
		</div>

		<!-- Log -->
		<div class="mt-6 grid gap-6 lg:grid-cols-2">
			<UCard
				v-for="panel in logPanels"
				:key="panel.key"
				:ui="{ body: 'p-0 sm:p-0' }"
			>
				<template #header>
					<div class="flex items-center justify-between gap-3">
						<div class="flex items-center gap-3">
							<div class="flex size-10 items-center justify-center rounded-xl border-2 border-[var(--ui-text-highlighted)] bg-primary text-inverted">
								<UIcon :name="panel.icon" class="size-5" />
							</div>
							<div>
								<h2 class="font-bold leading-tight">{{ panel.title }}</h2>
								<p class="text-xs text-muted">{{ panel.subtitle }}</p>
							</div>
						</div>
						<UBadge color="neutral" variant="subtle" size="sm">
							{{ panel.logs.length }} log
						</UBadge>
					</div>
				</template>

				<div class="max-h-96 divide-y divide-default overflow-y-auto bg-muted font-mono text-xs">
					<div
						v-for="item in panel.logs"
						:key="item.id"
						class="space-y-1 px-4 py-2.5"
					>
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-1.5">
								<UBadge :color="levelColor(item.level)" variant="subtle" size="sm">
									{{ item.level.toUpperCase() }}
								</UBadge>
								<span class="font-bold text-muted">[{{ item.tag }}]</span>
							</div>
							<span class="text-dimmed">{{ item.timestamp.slice(11, 19) }}</span>
						</div>
						<p class="break-words font-semibold leading-relaxed text-highlighted">
							{{ item.message }}
						</p>
					</div>

					<UEmpty
						v-if="!panel.logs.length"
						class="py-10"
						icon="i-lucide-terminal"
						title="Belum ada log"
						description="Log akan muncul di sini saat ada aktivitas."
					/>
				</div>
			</UCard>
		</div>
	</UContainer>
</template>