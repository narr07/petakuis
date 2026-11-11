<script setup lang="ts">
	import type { PageFeatureProps } from '@nuxt/ui'

	useSeoMeta({
		title: 'Status Pengembangan',
		description: 'Progres implementasi Petakuis dan log aktivitas server secara langsung.'
	})

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

	// Ringkasan diselaraskan dengan audit kode 11 November 2026 (LOG_PROGRES.md bagian 0)
	const doneItems: PageFeatureProps[] = [
		{
			title: 'Monorepo Bun: web, game server, dan paket bersama',
			description: 'Nuxt 4 di port 3000, Socket.IO di port 3001, logging terstruktur Consola.'
		},
		{
			title: 'Mesin game 2D',
			description: '6 peta, collision per tile, jalan otomatis saat peta diketuk, D-Pad di HP, kompas penunjuk pos soal, dan NPC.'
		},
		{
			title: 'Kuis dan laporan tersimpan permanen',
			description: 'Database SQLite: kuis buatan guru dan laporan sesi yang sudah berakhir tetap ada setelah server dimulai ulang.'
		},
		{
			title: 'Kontrol sesi hanya untuk guru',
			description: 'Token host diperiksa di game server: siswa tidak bisa mengakhiri sesi, mengeluarkan teman, atau mengganti peta.'
		},
		{
			title: 'Penilaian di server',
			description: 'Kunci jawaban tidak dikirim ke browser. Waktu dihitung sejak soal pertama kali dibuka.'
		},
		{
			title: 'Pembuat kuis',
			description: 'Soal pilihan ganda, benar/salah, dan isian singkat; impor CSV; generator AI Gemini.'
		},
		{
			title: 'Layar host dan laporan',
			description: 'Radar posisi siswa, papan peringkat, kick pemain, dan ekspor nilai CSV.'
		},
		{
			title: 'Tampilan website dengan Nuxt UI',
			description: 'Beranda, jelajah, login, dan dashboard mengikuti pola template resmi SaaS dan Dashboard.'
		}
	]

	const pendingItems: PageFeatureProps[] = [
		{
			title: 'Login guru',
			description: 'Google atau kode OTP lewat email, supaya kuis tersimpan per akun.'
		},
		{
			title: 'Kelengkapan MVP',
			description: 'QR code masuk sesi, filter kata kasar, rate limit, edit/hapus kuis, dan uji beban 200 siswa.'
		},
		{
			title: 'Fase berikutnya',
			description: 'Mode PR tanpa host live, efek suara dengan tombol mute, dan mode permainan tambahan.'
		}
	]

	const progress = Math.round((doneItems.length / (doneItems.length + pendingItems.length)) * 100)

	const logPanels = computed(() => [
		{
			key: 'game',
			title: 'Game Server',
			description: 'Socket.IO · port 3001',
			icon: 'i-lucide-gamepad-2',
			logs: data.value?.gameServerLogs || []
		},
		{
			key: 'web',
			title: 'HTTP & API Nuxt',
			description: 'Nuxt 4 · port 3000',
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

	const autoRefresh = ref(true)
	const { pause, resume } = useIntervalFn(() => refresh(), 3000, { immediate: false })

	watch(autoRefresh, on => (on ? resume() : pause()))
	onMounted(() => {
		if (autoRefresh.value) resume()
	})
</script>

<template>
	<UContainer>
		<UPage>
			<UPageHeader
				headline="Transparansi pengembangan"
				title="Status Petakuis"
				description="Apa yang sudah jalan, apa yang belum, dan log aktivitas server secara langsung."
			>
				<template #links>
					<USwitch v-model="autoRefresh" label="Segarkan otomatis" />
					<UButton
						icon="i-lucide-refresh-cw"
						label="Segarkan"
						color="neutral"
						variant="outline"
						:loading="status === 'pending'"
						@click="refresh()"
					/>
				</template>
			</UPageHeader>

			<UPageBody>
				<UPageCard
					title="Progres implementasi"
					:description="`${doneItems.length} dari ${doneItems.length + pendingItems.length} kelompok pekerjaan selesai.`"
					icon="i-lucide-rocket"
					variant="subtle"
				>
					<UProgress :model-value="progress" status color="success" />
				</UPageCard>

				<div class="grid gap-6 lg:grid-cols-2">
					<UPageCard
						title="Sudah berjalan"
						icon="i-lucide-circle-check-big"
						variant="outline"
						:ui="{ leadingIcon: 'text-success' }"
					>
						<div class="flex flex-col gap-5">
							<UPageFeature
								v-for="item in doneItems"
								:key="item.title"
								v-bind="item"
								icon="i-lucide-check"
								:ui="{ leadingIcon: 'text-success' }"
							/>
						</div>
					</UPageCard>

					<UPageCard
						title="Belum selesai"
						icon="i-lucide-hourglass"
						variant="outline"
						:ui="{ leadingIcon: 'text-warning' }"
					>
						<div class="flex flex-col gap-5">
							<UPageFeature
								v-for="item in pendingItems"
								:key="item.title"
								v-bind="item"
								icon="i-lucide-circle-dashed"
								:ui="{ leadingIcon: 'text-warning' }"
							/>
						</div>
					</UPageCard>
				</div>

				<div class="grid gap-6 lg:grid-cols-2">
					<UCard
						v-for="panel in logPanels"
						:key="panel.key"
						:ui="{ body: 'p-0 sm:p-0' }"
					>
						<template #header>
							<div class="flex items-center justify-between gap-3">
								<UUser
									:name="panel.title"
									:description="panel.description"
									:avatar="{ icon: panel.icon }"
								/>
								<UBadge
									:label="`${panel.logs.length} log`"
									color="neutral"
									variant="subtle"
								/>
							</div>
						</template>

						<div class="max-h-96 divide-y divide-default overflow-y-auto font-mono text-xs">
							<div
								v-for="item in panel.logs"
								:key="item.id"
								class="space-y-1 px-4 py-2.5"
							>
								<div class="flex items-center justify-between gap-2">
									<div class="flex items-center gap-1.5">
										<UBadge
											:label="item.level.toUpperCase()"
											:color="levelColor(item.level)"
											variant="subtle"
											size="sm"
										/>
										<span class="font-semibold text-muted">[{{ item.tag }}]</span>
									</div>
									<span class="text-dimmed">{{ item.timestamp.slice(11, 19) }}</span>
								</div>
								<p class="break-words leading-relaxed text-highlighted">
									{{ item.message }}
								</p>
							</div>

							<UEmpty
								v-if="!panel.logs.length"
								icon="i-lucide-terminal"
								title="Belum ada log"
								description="Log muncul di sini saat ada aktivitas."
								variant="naked"
								class="py-10"
							/>
						</div>
					</UCard>
				</div>
			</UPageBody>
		</UPage>
	</UContainer>
</template>
