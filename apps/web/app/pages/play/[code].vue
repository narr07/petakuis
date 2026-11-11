<script setup lang="ts">
	import {
		MAP_CATALOG,
		type AvatarColorway,
		type Direction
	} from '@petakuis/shared'
	import { useSessionStore } from '~/stores/useSessionStore'

	definePageMeta({
		layout: 'game'
	})

	const route = useRoute()
	const store = useSessionStore()
	const {
		connectPlayer,
		sendMove,
		requestOpenQuestion,
		submitAnswer,
		toggleAccessibleMode,
		changeRoomMap
	} = useGameSocket()

	const code = computed(() => String(route.params.code || '123456'))
	const nickname = computed(() =>
		String(route.query.nickname || 'Petualang')
	)
	const colorway = computed(
		() => (String(route.query.colorway || 'merah-putih') as AvatarColorway)
	)

	const showLeaderboardDrawer = ref(false)

	const mapShortLabels: Record<string, string> = {
		'map-halaman-sekolah': '1. Hoenn GBA (60×50)',
		'map-desa-sunnyside': '2. Lembah Sunnyside (64×48)',
		'map-kampus-modern': '3. Kampus Modern (48×36)'
	}

	function handleSelectDemoMap(mapId: string) {
		store.switchMap(mapId)
		changeRoomMap(mapId)
	}

	function resolveInitialMapId(): string | null {
		const q = String(route.query.map || '').toLowerCase().trim()
		if (q) {
			const exact = MAP_CATALOG.find((m) => m.id === q || m.slug === q)
			if (exact) return exact.id
			if (q.includes('sunnyside') || q.includes('farm') || q === '2') {
				return 'map-desa-sunnyside'
			}
			if (q.includes('modern') || q.includes('kampus') || q === '3') {
				return 'map-kampus-modern'
			}
			if (q.includes('hoenn') || q.includes('gba') || q === '1') {
				return 'map-halaman-sekolah'
			}
		}
		if (code.value === '222222') return 'map-desa-sunnyside'
		if (code.value === '333333') return 'map-kampus-modern'
		return null
	}

	function handleMove(x: number, y: number, dir: Direction) {
		sendMove(x, y, dir)
	}

	function handleOpenObject(objectId: string) {
		requestOpenQuestion(objectId)
	}

	function handleSubmitAnswer(value: string[]) {
		if (!store.activeQuestion) return
		submitAnswer({
			objectId: store.activeQuestion.objectId,
			questionId: store.activeQuestion.questionId,
			value
		})
	}

	function handleAccessibleNextQuestion() {
		const target = store.nextTargetObject
		if (!target) return
		requestOpenQuestion(target.objectId)
	}

	onMounted(() => {
		store.nickname = nickname.value
		store.colorway = colorway.value
		const initialMap = resolveInitialMapId()
		if (initialMap) {
			store.switchMap(initialMap)
		}
		connectPlayer({
			code: code.value,
			nickname: nickname.value,
			colorway: colorway.value
		})
		if (initialMap) {
			setTimeout(() => {
				handleSelectDemoMap(initialMap)
			}, 300)
		}
	})
</script>

<template>
	<div class="relative h-screen w-screen overflow-hidden bg-[#0f172a]">
		<!-- Top HUD Bar -->
		<header
			class="absolute inset-x-0 top-0 z-[1000] flex items-center justify-between gap-2 border-b-2 border-[#16211b] bg-[#faf6ee]/95 px-3 py-1.5 sm:px-4"
		>
			<div class="flex items-center gap-2 min-w-0">
				<NuxtLink
					to="/"
					class="shrink-0 rounded-lg border-2 border-[#16211b] bg-white px-2.5 py-1 text-xs font-extrabold text-[#16211b]"
				>
					← Keluar
				</NuxtLink>
				<div class="flex items-center gap-1.5 min-w-0">
					<span class="shrink-0 font-mono-num text-xs font-extrabold text-[#15803d]">
						PIN {{ code }}
					</span>
					<span class="hidden md:inline-block text-xs font-extrabold text-[#16211b] truncate max-w-44">
						{{ store.quizTitle || 'Memuat Peta...' }}
					</span>
				</div>
			</div>

			<!-- Live Multi-Region Tilemap Switcher -->
			<div class="flex items-center gap-1 rounded-xl border-2 border-[#16211b] bg-white p-0.5 shrink-0">
				<span class="hidden xl:inline-block px-2 text-[10px] font-extrabold uppercase tracking-wider text-[#435249] whitespace-nowrap">
					Demo Tilemap:
				</span>
				<button
					v-for="m in MAP_CATALOG"
					:key="m.id"
					type="button"
					class="whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-extrabold transition-colors"
					:class="
						store.mapConfig?.id === m.id
							? 'bg-[#15803d] text-white shadow-[1px_1px_0px_#16211b]'
							: 'bg-transparent text-[#16211b] hover:bg-[#faf6ee]'
					"
					@click="handleSelectDemoMap(m.id)"
				>
					{{ mapShortLabels[m.id] || m.name }}
				</button>
			</div>

			<div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
				<!-- Progress Counter -->
				<div
					class="whitespace-nowrap rounded-lg border-2 border-[#16211b] bg-white px-2.5 py-1 font-mono-num text-xs font-extrabold text-[#16211b]"
				>
					Sisa Pos: {{ store.unansweredObjects.length }} /
					{{ store.assignedObjects.length }}
				</div>

				<!-- Score Badge -->
				<div
					class="whitespace-nowrap rounded-lg border-2 border-[#16211b] bg-[#fef08a] px-2.5 py-1 font-mono-num text-xs font-extrabold text-[#16211b]"
				>
					Skor: {{ store.myScore }}
				</div>

				<!-- Accessible Mode Toggle -->
				<button
					type="button"
					class="hidden lg:inline-flex whitespace-nowrap rounded-lg border-2 border-[#16211b] px-2.5 py-1 text-xs font-extrabold"
					:class="
						store.isAccessibleMode
							? 'bg-[#dcfce7] text-[#14532d]'
							: 'bg-white text-[#16211b]'
					"
					@click="toggleAccessibleMode(!store.isAccessibleMode)"
				>
					{{ store.isAccessibleMode ? 'Aksesibel: Aktif' : 'Mode Aksesibel' }}
				</button>

				<!-- Leaderboard Drawer Toggle -->
				<button
					type="button"
					class="whitespace-nowrap pixel-btn rounded-lg bg-[#16211b] px-2.5 py-1 text-xs font-extrabold text-[#fef08a]"
					@click="showLeaderboardDrawer = !showLeaderboardDrawer"
				>
					Peringkat
				</button>
			</div>
		</header>

		<!-- Error Toast Banner -->
		<div
			v-if="store.errorBanner"
			role="status"
			class="fixed left-1/2 top-28 z-40 -translate-x-1/2 rounded-xl border-2 border-[#16211b] bg-[#fee2e2] px-4 py-2 text-xs font-extrabold text-[#991b1b] shadow-[3px_3px_0px_#16211b]"
		>
			{{ store.errorBanner }}
		</div>

		<!-- Interactive 2D Pixel Map Canvas -->
		<ClientOnly>
			<GameCanvas
				v-if="store.mapConfig"
				:map-config="store.mapConfig"
				:my-x="store.myX"
				:my-y="store.myY"
				:my-nickname="store.nickname"
				:my-colorway="store.colorway"
				:assigned-objects="store.assignedObjects"
				:nearby-players="store.nearbyPlayers"
				:next-target-object="store.nextTargetObject"
				:disabled="Boolean(store.activeQuestion) || store.sessionStatus !== 'active'"
				@move="handleMove"
				@open-object="handleOpenObject"
			/>
		</ClientOnly>

		<!-- Floating Action Prompt when near a quiz object OR in Accessible Mode -->
		<div
			v-if="
				store.sessionStatus === 'active' &&
				!store.activeQuestion &&
				(store.nearestInteractableObject ||
					(store.isAccessibleMode && store.nextTargetObject))
			"
			class="fixed bottom-6 right-6 z-30"
		>
			<button
				type="button"
				class="pixel-btn rounded-2xl bg-[#f59e0b] px-6 py-4 text-sm font-extrabold text-[#16211b]"
				@click="
					store.isAccessibleMode
						? handleAccessibleNextQuestion()
						: handleOpenObject(store.nearestInteractableObject!.objectId)
				"
			>
				{{
					store.isAccessibleMode
						? `Buka Soal #${store.nextTargetObject?.orderIndex} (Aksesibel)`
						: `Buka Pos Soal #${store.nearestInteractableObject?.orderIndex} (Spasi / Ketuk)`
				}}
			</button>
		</div>

		<!-- Live Leaderboard Side Drawer -->
		<aside
			v-if="showLeaderboardDrawer"
			class="fixed right-4 top-14 z-30 w-72 rounded-2xl border-2 border-[#16211b] bg-[#faf6ee] p-4 shadow-[4px_4px_0px_#16211b]"
		>
			<div class="flex items-center justify-between border-b border-[#16211b] pb-2">
				<h2 class="text-xs font-extrabold uppercase tracking-wider text-[#16211b]">
					Peringkat Kelas Live
				</h2>
				<button
					type="button"
					class="text-xs font-bold text-[#435249]"
					@click="showLeaderboardDrawer = false"
				>
					Tutup
				</button>
			</div>
			<ul class="mt-3 space-y-2">
				<li
					v-for="(item, idx) in store.leaderboard"
					:key="item.id"
					class="flex items-center justify-between rounded-lg border border-[#16211b] bg-white px-3 py-1.5 text-xs font-bold"
				>
					<span>#{{ idx + 1 }} {{ item.nickname }}</span>
					<span class="font-mono-num font-extrabold text-[#15803d]">
						{{ item.score }} pts
					</span>
				</li>
			</ul>
		</aside>

		<!-- Question Modal -->
		<GameQuestionModal
			v-if="store.activeQuestion"
			:question="store.activeQuestion"
			:result="store.lastAnswerResult"
			@submit="handleSubmitAnswer"
			@close="
				store.activeQuestion = null;
				store.lastAnswerResult = null
			"
		/>

		<!-- Session End Podium Overlay -->
		<div
			v-if="
				store.sessionStatus === 'ended' ||
				(store.assignedObjects.length > 0 && store.unansweredObjects.length === 0 && !store.activeQuestion)
			"
			class="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
		>
			<div class="pixel-card w-full max-w-lg rounded-2xl p-6 text-center">
				<span class="font-pixel text-xs text-[#15803d]">PETUALANGAN SELESAI</span>
				<h2 class="mt-2 text-2xl font-extrabold text-[#16211b]">
					Seluruh Pos Soal Telah Dijawab!
				</h2>
				<p class="mt-1 text-sm text-[#435249]">
					Total Skor Akhir Kamu:
					<strong class="font-mono-num text-lg text-[#15803d]">
						{{ store.myScore }} Poin
					</strong>
				</p>

				<div class="mt-5 space-y-2 text-left">
					<p class="text-xs font-extrabold uppercase text-[#435249]">
						Podium Kelas Saat Ini:
					</p>
					<div
						v-for="(entry, idx) in store.leaderboard.slice(0, 5)"
						:key="entry.id"
						class="flex items-center justify-between rounded-xl border-2 border-[#16211b] bg-[#faf6ee] px-4 py-2.5 text-sm font-extrabold"
					>
						<span>#{{ idx + 1 }} {{ entry.nickname }}</span>
						<span class="font-mono-num text-[#15803d]">
							{{ entry.score }} Poin ({{ entry.correctCount }}/{{ entry.totalQuestions }} Benar)
						</span>
					</div>
				</div>

				<div class="mt-6 flex flex-wrap justify-center gap-3">
					<NuxtLink
						:to="`/report/${code}`"
						class="pixel-btn rounded-xl bg-[#15803d] px-5 py-3 text-xs font-extrabold text-white"
					>
						Lihat Laporan Lengkap & CSV
					</NuxtLink>
					<NuxtLink
						to="/"
						class="pixel-btn rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-[#16211b]"
					>
						Kembali ke Beranda
					</NuxtLink>
				</div>
			</div>
		</div>
	</div>
</template>
