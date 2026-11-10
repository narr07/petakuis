<script setup lang="ts">
	import { io, type Socket } from 'socket.io-client'
	import {
		MAP_CATALOG,
		STARTER_QUIZZES,
		type HostPlayerTuple,
		type LeaderboardEntry,
		type MapTemplate
	} from '@petakuis/shared'

	interface HostInitPayload {
		code: string
		status: 'lobby' | 'active' | 'paused' | 'ended'
		quizTitle: string
		subject: string
		mode: 'free' | 'linear'
		mapConfig: MapTemplate
		totalQuestions: number
		leaderboard?: LeaderboardEntry[]
	}

	interface HostStatePayload {
		status: 'lobby' | 'active' | 'paused' | 'ended'
		players?: HostPlayerTuple[]
		leaderboard?: LeaderboardEntry[]
	}

	const route = useRoute()
	const config = useRuntimeConfig()
	const code = computed(() => String(route.params.code || '123456'))

	const status = ref<'lobby' | 'active' | 'paused' | 'ended'>('active')
	const quizTitle = ref(STARTER_QUIZZES[0]!.title)
	const subject = ref(STARTER_QUIZZES[0]!.subject)
	const mode = ref<'free' | 'linear'>(STARTER_QUIZZES[0]!.mode)
	const totalQuestions = ref(STARTER_QUIZZES[0]!.questions.length)
	const mapConfig = ref<MapTemplate | null>(MAP_CATALOG[0]!)
	const players = ref<HostPlayerTuple[]>([])
	const leaderboard = ref<LeaderboardEntry[]>([])

	let socket: Socket | null = null

	function sendControl(
		action: 'start' | 'pause' | 'resume' | 'end' | 'kick' | 'allow_accessible',
		targetPlayerId?: string
	) {
		socket?.emit('host:control', { action, targetPlayerId })
	}

	onMounted(() => {
		socket = io(config.public.gameServerUrl, {
			transports: ['websocket', 'polling']
		})

		socket.on('connect', () => {
			socket?.emit('join', {
				code: code.value,
				nickname: 'Guru Host',
				avatarId: 'host',
				colorway: 'merah-putih',
				role: 'host'
			})
		})

		socket.on('host:init', (payload: HostInitPayload) => {
			status.value = payload.status
			quizTitle.value = payload.quizTitle
			subject.value = payload.subject
			mode.value = payload.mode
			mapConfig.value = payload.mapConfig
			totalQuestions.value = payload.totalQuestions
			leaderboard.value = payload.leaderboard || []
		})

		socket.on('host:state', (payload: HostStatePayload) => {
			status.value = payload.status
			players.value = payload.players || []
			leaderboard.value = payload.leaderboard || []
		})

		socket.on('session:status', (payload: { status: 'lobby' | 'active' | 'paused' | 'ended' }) => {
			status.value = payload.status
		})

		socket.on('map:changed', (payload: { mapConfig: MapTemplate }) => {
			if (payload?.mapConfig) {
				mapConfig.value = payload.mapConfig
			}
		})
	})

	function changeHostMap(mapId: string) {
		const found = MAP_CATALOG.find(m => m.id === mapId)
		if (found) {
			mapConfig.value = found
		}
		socket?.emit('map:change', { mapId })
	}

	onBeforeUnmount(() => {
		socket?.disconnect()
	})
</script>

<template>
	<UContainer class="py-8 sm:py-10">
		<!-- Banner Layar Proyektor Guru -->
		<UCard :ui="{ header: 'border-b border-default', body: 'p-6' }">
			<template #header>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-2">
						<UBadge
							:color="status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'neutral'"
							variant="solid"
							size="md"
							icon="i-lucide-projector"
						>
							Layar Host Guru · {{ status.toUpperCase() }}
						</UBadge>
						<UBadge color="primary" variant="subtle" size="md">
							{{ subject }} · Mode {{ mode === 'free' ? 'Bebas' : 'Berurutan' }}
						</UBadge>
					</div>

					<div class="flex items-center gap-2">
						<UButton
							:to="`/play/${code}?nickname=SiswaUjiCoba&colorway=batik-biru`"
							target="_blank"
							color="neutral"
							variant="outline"
							size="sm"
							icon="i-lucide-external-link"
							label="Buka Tab Siswa Baru"
						/>
						<UButton
							:to="`/report/${code}`"
							color="primary"
							size="sm"
							icon="i-lucide-file-text"
							label="Laporan & Ekspor CSV"
						/>
					</div>
				</div>
			</template>

			<div class="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
				<div>
					<h1 class="text-2xl font-black tracking-tight sm:text-3xl text-highlighted">
						{{ quizTitle }}
					</h1>
					<p class="mt-1 text-sm text-muted">
						Minta siswa membuka tautan <strong class="text-highlighted">/join</strong> melalui ponsel atau laptop kelas, lalu masukkan kode PIN di samping.
					</p>

					<!-- Tombol Kendali Sesi -->
					<div class="mt-4 flex flex-wrap items-center gap-2">
						<UButton
							v-if="status !== 'active'"
							color="success"
							variant="solid"
							size="md"
							icon="i-lucide-play"
							label="Mulai / Lanjutkan Sesi"
							@click="sendControl('start')"
						/>
						<UButton
							v-if="status === 'active'"
							color="warning"
							variant="solid"
							size="md"
							icon="i-lucide-pause"
							label="Jeda Sesi"
							@click="sendControl('pause')"
						/>
						<UButton
							color="error"
							variant="outline"
							size="md"
							icon="i-lucide-square"
							label="Akhiri Sesi"
							@click="sendControl('end')"
						/>
					</div>
				</div>

				<!-- Kotak PIN Proyektor -->
				<div class="flex flex-col items-center justify-center rounded-2xl border-2 border-primary bg-default px-8 py-4 text-center shadow-sm">
					<span class="text-xs font-black tracking-widest text-primary uppercase">
						PIN Ruangan Kelas
					</span>
					<span class="font-mono text-4xl sm:text-5xl font-black tracking-widest text-highlighted">
						{{ code }}
					</span>
					<span class="mt-1 text-xs font-bold text-muted">
						Tampilkan di Proyektor
					</span>
				</div>
			</div>
		</UCard>

		<!-- Konten Utama: Mini Map Radar + Papan Skor Siswa -->
		<div class="mt-6 grid gap-6 lg:grid-cols-12">
			<!-- Radar Peta Kelas Live -->
			<UCard class="lg:col-span-7" :ui="{ header: 'border-b border-default', body: 'p-4 sm:p-5' }">
				<template #header>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<UIcon name="i-lucide-radar" class="size-5 text-primary" />
							<h2 class="text-base font-bold text-highlighted">
								Peta Radar Kelas ({{ players.length }} Siswa Aktif)
							</h2>
						</div>

						<!-- Pemilihan Peta Aktif -->
						<div class="flex flex-wrap items-center gap-1.5">
							<UButton
								v-for="m in MAP_CATALOG"
								:key="m.id"
								:color="mapConfig?.id === m.id ? 'primary' : 'neutral'"
								:variant="mapConfig?.id === m.id ? 'solid' : 'outline'"
								size="xs"
								:label="m.name.split('(')[0]?.trim()"
								@click="changeHostMap(m.id)"
							/>
						</div>
					</div>
				</template>

				<div
					v-if="mapConfig"
					class="relative h-80 sm:h-96 w-full overflow-hidden rounded-xl border border-default"
					:style="{ backgroundColor: mapConfig.palette.floorPrimary }"
				>
					<img
						:src="mapConfig.mapImageUrl"
						:alt="mapConfig.name"
						class="absolute inset-0 h-full w-full object-cover"
						style="image-rendering: pixelated"
					>

					<!-- Label Rintangan di Mini-Map -->
					<div
						v-for="(obs, idx) in mapConfig.obstacles"
						:key="idx"
						class="pointer-events-none absolute flex items-start justify-center"
						:style="{
							left: `${(obs.tileX / mapConfig.widthTiles) * 100}%`,
							top: `${(obs.tileY / mapConfig.heightTiles) * 100}%`,
							width: `${(obs.width / mapConfig.widthTiles) * 100}%`,
							height: `${(obs.height / mapConfig.heightTiles) * 100}%`
						}"
					>
						<span class="rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
							{{ obs.label }}
						</span>
					</div>

					<!-- Pos Soal Bawaan Peta -->
					<div
						v-for="sp in mapConfig.spawnPoints"
						:key="sp.id"
						class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-warning shadow-xs"
						:style="{
							left: `${((sp.tileX + 0.5) / mapConfig.widthTiles) * 100}%`,
							top: `${((sp.tileY + 0.5) / mapConfig.heightTiles) * 100}%`
						}"
					/>

					<!-- Titik Posisi Siswa Live -->
					<div
						v-for="p in players"
						:key="p[0]"
						class="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
						:style="{
							left: `${(p[3] / (mapConfig.widthTiles * mapConfig.tileSizePx * mapConfig.renderScale)) * 100}%`,
							top: `${(p[4] / (mapConfig.heightTiles * mapConfig.tileSizePx * mapConfig.renderScale)) * 100}%`
						}"
					>
						<div class="flex items-center gap-1 rounded-full border border-default bg-default px-2 py-0.5 text-[10px] font-bold text-highlighted shadow-md">
							<span class="size-2 rounded-full bg-success animate-pulse" />
							<span>{{ p[1] }}</span>
						</div>
					</div>
				</div>
			</UCard>

			<!-- Live Leaderboard & Kelola Siswa -->
			<UCard class="lg:col-span-5" :ui="{ header: 'border-b border-default', body: 'p-4 sm:p-5' }">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<UIcon name="i-lucide-trophy" class="size-5 text-warning" />
							<h2 class="text-base font-bold text-highlighted">
								Papan Skor & Progres Siswa
							</h2>
						</div>
						<UBadge color="secondary" variant="subtle" size="sm">
							{{ leaderboard.length }} Siswa
						</UBadge>
					</div>
				</template>

				<div
					v-if="leaderboard.length === 0"
					class="rounded-xl border border-dashed border-default p-8 text-center text-xs text-muted"
				>
					<UIcon name="i-lucide-users" class="mx-auto size-8 text-muted/60" />
					<p class="mt-2 font-semibold">Belum ada siswa di dalam ruangan.</p>
					<p class="mt-1">
						Klik tombol <strong>"Buka Tab Siswa Baru"</strong> di atas untuk menguji coba sesi secara langsung.
					</p>
				</div>

				<div v-else class="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
					<div
						v-for="(entry, idx) in leaderboard"
						:key="entry.id"
						class="flex items-center justify-between rounded-xl border border-default bg-default p-3 shadow-2xs"
					>
						<div>
							<div class="flex items-center gap-2">
								<UBadge
									:color="idx === 0 ? 'warning' : idx < 3 ? 'secondary' : 'neutral'"
									variant="solid"
									size="xs"
								>
									#{{ idx + 1 }}
								</UBadge>
								<span class="text-sm font-bold text-highlighted">
									{{ entry.nickname }}
								</span>
							</div>
							<p class="mt-0.5 text-xs text-muted">
								Terjawab {{ entry.answeredCount }}/{{ entry.totalQuestions }} soal ({{ entry.correctCount }} benar)
							</p>
						</div>

						<div class="flex items-center gap-2">
							<span class="font-mono text-sm font-black text-primary">
								{{ entry.score }} Poin
							</span>
							<UButton
								color="error"
								variant="ghost"
								size="xs"
								icon="i-lucide-user-x"
								title="Keluarkan dari sesi"
								@click="sendControl('kick', entry.id)"
							/>
						</div>
					</div>
				</div>
			</UCard>
		</div>
	</UContainer>
</template>
