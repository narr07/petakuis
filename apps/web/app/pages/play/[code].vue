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

	// Layar selesai: sesi diakhiri guru, atau semua pos soal milik siswa ini sudah dijawab.
	const showFinished = computed(() =>
		store.sessionStatus === 'ended'
		|| (store.assignedObjects.length > 0 && store.unansweredObjects.length === 0 && !store.activeQuestion)
	)

	const showActionPrompt = computed(() =>
		store.sessionStatus === 'active'
		&& !store.activeQuestion
		&& Boolean(store.nearestInteractableObject || (store.isAccessibleMode && store.nextTargetObject))
	)

	const mapShortLabels: Record<string, string> = {
		'map-pesisir-karang': '1. Pesisir Karang (64×48)',
		'map-desa-sunnyside': '2. Lembah Sunnyside (64×48)',
		'map-kampus-modern': '3. Kampus Modern (48×36)',
		'map-dataran-angin': '4. Dataran Angin (64×48)',
		'map-kota-pasar': '5. Kota Pasar (64×48)'
	}

	function handleSelectDemoMap(mapId: string) {
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
			if (q.includes('pesisir') || q.includes('pantai') || q === '1') {
				return 'map-pesisir-karang'
			}
		}
		if (code.value === '222222') return 'map-desa-sunnyside'
		if (code.value === '333333') return 'map-kampus-modern'
		if (code.value === '555555') return 'map-dataran-angin'
		if (code.value === '666666') return 'map-kota-pasar'
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
		connectPlayer({
			code: code.value,
			nickname: nickname.value,
			colorway: colorway.value,
			// Peta pilihan lewat ?map= hanya berlaku di room demo, setelah bergabung.
			onJoined: (payload) => {
				if (initialMap && payload.isDemo && payload.mapConfig.id !== initialMap) {
					handleSelectDemoMap(initialMap)
				}
			}
		})
	})
</script>

<template>
	<div class="relative h-screen w-screen overflow-hidden bg-[#0f172a]">
		<!-- HUD atas -->
		<header
			class="absolute inset-x-0 top-0 z-[1000] flex items-center justify-between gap-2 border-b border-default bg-default/95 px-3 py-1.5 backdrop-blur sm:px-4"
		>
			<div class="flex min-w-0 items-center gap-2">
				<UButton
					to="/"
					icon="i-lucide-log-out"
					label="Keluar"
					color="neutral"
					variant="outline"
					size="sm"
				/>
				<UBadge
					:label="`PIN ${code}`"
					color="primary"
					variant="subtle"
					class="shrink-0 font-mono"
				/>
				<span class="hidden max-w-44 truncate text-sm font-semibold text-highlighted md:inline-block">
					{{ store.quizTitle || 'Memuat peta...' }}
				</span>
			</div>

			<!-- Ganti peta (hanya di room demo) -->
			<div v-if="store.isDemoRoom" class="hidden shrink-0 items-center gap-1 lg:flex">
				<UButton
					v-for="m in MAP_CATALOG"
					:key="m.id"
					:label="mapShortLabels[m.id] || m.name"
					:color="store.mapConfig?.id === m.id ? 'primary' : 'neutral'"
					:variant="store.mapConfig?.id === m.id ? 'solid' : 'ghost'"
					size="xs"
					@click="handleSelectDemoMap(m.id)"
				/>
			</div>

			<div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
				<UBadge
					:label="`Sisa pos: ${store.unansweredObjects.length}/${store.assignedObjects.length}`"
					icon="i-lucide-map-pin"
					color="neutral"
					variant="outline"
					class="font-mono"
				/>
				<UBadge
					:label="`Skor: ${store.myScore}`"
					icon="i-lucide-star"
					color="warning"
					variant="solid"
					class="font-mono"
				/>
				<UButton
					:label="store.isAccessibleMode ? 'Aksesibel: aktif' : 'Mode aksesibel'"
					icon="i-lucide-accessibility"
					:color="store.isAccessibleMode ? 'success' : 'neutral'"
					:variant="store.isAccessibleMode ? 'subtle' : 'outline'"
					size="sm"
					class="hidden lg:inline-flex"
					@click="toggleAccessibleMode(!store.isAccessibleMode)"
				/>
				<UButton
					label="Peringkat"
					icon="i-lucide-trophy"
					color="neutral"
					size="sm"
					@click="showLeaderboardDrawer = !showLeaderboardDrawer"
				/>
			</div>
		</header>

		<!-- Pesan galat -->
		<UAlert
			v-if="store.errorBanner"
			role="status"
			color="error"
			variant="solid"
			icon="i-lucide-circle-alert"
			:description="store.errorBanner"
			class="fixed left-1/2 top-16 z-[1001] w-auto max-w-md -translate-x-1/2"
		/>

		<!-- Peta 2D -->
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

		<!-- Tombol buka soal saat dekat pos (atau mode aksesibel) -->
		<div v-if="showActionPrompt" class="fixed bottom-6 right-6 z-30">
			<UButton
				size="xl"
				color="warning"
				icon="i-lucide-scroll-text"
				class="shadow-lg"
				:label="store.isAccessibleMode
					? `Buka Soal #${store.nextTargetObject?.orderIndex} (Aksesibel)`
					: `Buka Pos Soal #${store.nearestInteractableObject?.orderIndex} (Spasi / Ketuk)`"
				@click="store.isAccessibleMode
					? handleAccessibleNextQuestion()
					: handleOpenObject(store.nearestInteractableObject!.objectId)"
			/>
		</div>

		<!-- Peringkat kelas -->
		<USlideover
			v-model:open="showLeaderboardDrawer"
			title="Peringkat Kelas Live"
			description="Diperbarui otomatis selama sesi berjalan."
			:overlay="false"
		>
			<template #body>
				<ol class="space-y-2">
					<li
						v-for="(item, idx) in store.leaderboard"
						:key="item.id"
						class="flex items-center justify-between gap-3 rounded-lg border border-default px-3 py-2 text-sm"
					>
						<span class="truncate font-medium text-highlighted">#{{ idx + 1 }} {{ item.nickname }}</span>
						<UBadge :label="`${item.score} poin`" color="success" variant="subtle" class="shrink-0 font-mono" />
					</li>
				</ol>
				<UEmpty
					v-if="!store.leaderboard.length"
					icon="i-lucide-trophy"
					title="Belum ada skor"
					description="Jawab soal pertama untuk masuk papan peringkat."
					variant="naked"
				/>
			</template>
		</USlideover>

		<!-- Jendela soal -->
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

		<!-- Layar selesai -->
		<UModal
			:open="showFinished"
			:dismissible="false"
			:close="false"
			title="Petualangan selesai!"
			description="Seluruh pos soal sudah kamu jawab."
		>
			<template #body>
				<div class="space-y-5">
					<div class="text-center">
						<p class="text-sm text-muted">
							Total skor akhirmu
						</p>
						<p class="font-mono text-4xl font-black text-primary">
							{{ store.myScore }} poin
						</p>
					</div>

					<div class="space-y-2">
						<p class="text-xs font-semibold uppercase text-muted">
							Podium kelas saat ini
						</p>
						<div
							v-for="(entry, idx) in store.leaderboard.slice(0, 5)"
							:key="entry.id"
							class="flex items-center justify-between gap-3 rounded-lg border border-default px-3 py-2 text-sm"
						>
							<span class="truncate font-medium text-highlighted">#{{ idx + 1 }} {{ entry.nickname }}</span>
							<span class="shrink-0 font-mono text-muted">
								{{ entry.score }} poin ({{ entry.correctCount }}/{{ entry.totalQuestions }} benar)
							</span>
						</div>
					</div>
				</div>
			</template>

			<template #footer>
				<div class="flex w-full flex-wrap justify-end gap-2">
					<UButton to="/" label="Kembali ke beranda" color="neutral" variant="outline" />
					<UButton :to="`/report/${code}`" icon="i-lucide-file-spreadsheet" label="Lihat laporan lengkap" />
				</div>
			</template>
		</UModal>
	</div>
</template>
