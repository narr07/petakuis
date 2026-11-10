<script setup lang="ts">
	import { io, type Socket } from 'socket.io-client'
	import {
		MAP_CATALOG,
		STARTER_QUIZZES,
		type HostPlayerTuple,
		type LeaderboardEntry,
		type MapTemplate
	} from '@petakuis/shared'

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

		socket.on('host:init', (payload: any) => {
			status.value = payload.status
			quizTitle.value = payload.quizTitle
			subject.value = payload.subject
			mode.value = payload.mode
			mapConfig.value = payload.mapConfig
			totalQuestions.value = payload.totalQuestions
			leaderboard.value = payload.leaderboard || []
		})

		socket.on('host:state', (payload: any) => {
			status.value = payload.status
			players.value = payload.players || []
			leaderboard.value = payload.leaderboard || []
		})

		socket.on('session:status', (payload: any) => {
			status.value = payload.status
		})

		socket.on('map:changed', (payload: { mapConfig: MapTemplate }) => {
			if (payload?.mapConfig) {
				mapConfig.value = payload.mapConfig
			}
		})
	})

	function changeHostMap(mapId: string) {
		const found = MAP_CATALOG.find((m) => m.id === mapId)
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
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
		<!-- Top Banner with Big Projector PIN -->
		<div class="pixel-card rounded-2xl p-6">
			<div class="flex flex-wrap items-center justify-between gap-6">
				<div>
					<div class="flex items-center gap-2">
						<span
							class="rounded border border-[#16211b] bg-[#dcfce7] px-2.5 py-0.5 text-xs font-extrabold uppercase text-[#14532d]"
						>
							LAYAR HOST GURU · {{ status.toUpperCase() }}
						</span>
						<span class="text-xs font-bold text-[#435249]">
							{{ subject }} · Mode {{ mode === 'free' ? 'Bebas' : 'Berurutan' }}
						</span>
					</div>
					<h1 class="mt-2 text-2xl font-extrabold text-[#16211b] sm:text-3xl">
						{{ quizTitle }}
					</h1>
					<p class="mt-1 text-sm text-[#435249]">
						Minta siswa membuka <strong>/join</strong> lalu memasukkan kode ruangan di
						samping.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-4">
					<div
						class="rounded-2xl border-2 border-[#16211b] bg-[#fef08a] px-6 py-3 text-center shadow-[3px_3px_0px_#16211b]"
					>
						<span class="block text-[10px] font-extrabold uppercase text-[#16211b]">
							KODE PIN RUANGAN
						</span>
						<span class="font-mono-num text-3xl font-extrabold tracking-widest text-[#16211b]">
							{{ code }}
						</span>
					</div>

					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<button
								v-if="status !== 'active'"
								type="button"
								class="pixel-btn rounded-xl bg-[#15803d] px-4 py-2.5 text-xs font-extrabold text-white"
								@click="sendControl('start')"
							>
								Mulai / Lanjutkan
							</button>
							<button
								v-if="status === 'active'"
								type="button"
								class="pixel-btn rounded-xl bg-[#f59e0b] px-4 py-2.5 text-xs font-extrabold text-[#16211b]"
								@click="sendControl('pause')"
							>
								Jeda Sesi
							</button>
							<button
								type="button"
								class="pixel-btn rounded-xl bg-[#dc2626] px-4 py-2.5 text-xs font-extrabold text-white"
								@click="sendControl('end')"
							>
								Akhiri Sesi
							</button>
						</div>

						<div class="flex items-center gap-2">
							<NuxtLink
								:to="`/play/${code}?nickname=SiswaUjiCoba&colorway=batik-biru`"
								target="_blank"
								class="rounded-lg border border-[#16211b] bg-white px-3 py-1.5 text-xs font-bold text-[#16211b]"
							>
								+ Buka Tab Siswa Baru
							</NuxtLink>
							<NuxtLink
								:to="`/report/${code}`"
								class="rounded-lg border border-[#16211b] bg-[#16211b] px-3 py-1.5 text-xs font-bold text-[#fef08a]"
							>
								Laporan & Ekspor CSV →
							</NuxtLink>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Grid: Live Mini-map + Live Leaderboard -->
		<div class="mt-6 grid gap-6 lg:grid-cols-12">
			<!-- Live Mini-Map Radar -->
			<div class="pixel-card rounded-2xl p-5 lg:col-span-7">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-base font-extrabold text-[#16211b]">
						Peta Radar Kelas Live ({{ players.length }} Siswa Terhubung)
					</h2>
					<div class="flex flex-wrap items-center gap-1.5">
						<button
							v-for="m in MAP_CATALOG"
							:key="m.id"
							type="button"
							class="rounded-lg border border-[#16211b] px-2 py-1 text-[11px] font-extrabold"
							:class="
								mapConfig?.id === m.id
									? 'bg-[#15803d] text-white'
									: 'bg-[#faf6ee] text-[#16211b]'
							"
							@click="changeHostMap(m.id)"
						>
							{{ m.name.split('(')[0]?.trim() }} ({{ m.widthTiles }}×{{ m.heightTiles }})
						</button>
					</div>
				</div>

				<div
					v-if="mapConfig"
					class="relative mt-4 h-80 sm:h-96 w-full overflow-hidden rounded-xl border-2 border-[#16211b]"
					:style="{ backgroundColor: mapConfig.palette.floorPrimary }"
				>
					<img
						:src="mapConfig.mapImageUrl"
						:alt="mapConfig.name"
						class="absolute inset-0 h-full w-full object-cover"
						style="image-rendering: pixelated"
					/>
					<!-- Building Roof Labels on Mini-Map -->
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
						<span
							class="rounded border border-[#16211b] bg-[#16211b]/85 px-1.5 py-0.5 text-[9px] font-bold text-[#fef08a] shadow"
						>
							{{ obs.label }}
						</span>
					</div>

					<!-- GBA Item Pokéball Spawn Points -->
					<img
						v-for="sp in mapConfig.spawnPoints"
						:key="sp.id"
						src="/gba/sprites/item_ball.png"
						alt="Pokéball"
						class="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2"
						:style="{
							left: `${(sp.tileX / mapConfig.widthTiles) * 100}%`,
							top: `${(sp.tileY / mapConfig.heightTiles) * 100}%`,
							imageRendering: 'pixelated'
						}"
					/>

					<!-- Live Student Dots -->
					<div
						v-for="p in players"
						:key="p[0]"
						class="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
						:style="{
							left: `${(p[3] / (mapConfig.widthTiles * mapConfig.tileSizePx * mapConfig.renderScale)) * 100}%`,
							top: `${(p[4] / (mapConfig.heightTiles * mapConfig.tileSizePx * mapConfig.renderScale)) * 100}%`
						}"
					>
						<div
							class="flex items-center gap-1 rounded-full border border-[#16211b] bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#16211b] shadow"
						>
							<span class="h-2 w-2 rounded-full bg-[#15803d]" />
							<span>{{ p[1] }}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Live Leaderboard & Player Management -->
			<div class="pixel-card rounded-2xl p-5 lg:col-span-5">
				<h2 class="text-base font-extrabold text-[#16211b]">
					Papan Skor & Progres Siswa
				</h2>

				<div
					v-if="leaderboard.length === 0"
					class="mt-6 rounded-xl border border-dashed border-[#16211b]/40 bg-[#faf6ee] p-6 text-center text-xs font-semibold text-[#435249]"
				>
					Belum ada siswa di dalam ruangan. Klik tombol
					<strong>"+ Buka Tab Siswa Baru"</strong> di atas untuk menguji coba
					permainan secara langsung.
				</div>

				<div
					v-else
					class="mt-4 space-y-2.5"
				>
					<div
						v-for="(entry, idx) in leaderboard"
						:key="entry.id"
						class="flex items-center justify-between rounded-xl border-2 border-[#16211b] bg-[#faf6ee] px-3.5 py-2.5"
					>
						<div>
							<div class="flex items-center gap-2">
								<span
									class="rounded bg-[#16211b] px-1.5 py-0.5 font-mono-num text-xs font-bold text-[#fef08a]"
								>
									#{{ idx + 1 }}
								</span>
								<span class="text-sm font-extrabold text-[#16211b]">
									{{ entry.nickname }}
								</span>
							</div>
							<p class="mt-0.5 text-xs font-semibold text-[#435249]">
								Terjawab {{ entry.answeredCount }}/{{ entry.totalQuestions }} soal ({{
									entry.correctCount
								}}
								benar)
							</p>
						</div>

						<div class="flex items-center gap-2">
							<span class="font-mono-num text-sm font-extrabold text-[#15803d]">
								{{ entry.score }} Poin
							</span>
							<button
								type="button"
								class="rounded border border-[#991b1b] px-2 py-1 text-[11px] font-bold text-[#991b1b] hover:bg-[#fee2e2]"
								@click="sendControl('kick', entry.id)"
							>
								Keluarkan
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
