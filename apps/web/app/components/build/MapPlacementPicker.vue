<script setup lang="ts">
	import {
		getNpcCharacter,
		isTileWalkable,
		type MapTemplate,
		type QuizQuestion,
		type TilePosition
	} from '@petakuis/shared'

	const props = defineProps<{
		map: MapTemplate
		questions: QuizQuestion[]
		activeIndex: number
	}>()

	const emit = defineEmits<{
		pick: [position: TilePosition]
		clear: []
		close: []
	}>()

	const surfaceEl = ref<HTMLDivElement | null>(null)
	const hover = ref<TilePosition | null>(null)

	const activeQuestion = computed(() => props.questions[props.activeIndex])
	const hoverWalkable = computed(
		() =>
			!!hover.value &&
			isTileWalkable(props.map, hover.value.tileX, hover.value.tileY) &&
			!occupiedByOther(hover.value)
	)

	function occupiedByOther(pos: TilePosition): boolean {
		return props.questions.some(
			(q, idx) =>
				idx !== props.activeIndex &&
				q.placement?.tileX === pos.tileX &&
				q.placement?.tileY === pos.tileY
		)
	}

	function tileFromEvent(e: PointerEvent): TilePosition | null {
		const el = surfaceEl.value
		if (!el) return null
		const rect = el.getBoundingClientRect()
		const tileX = Math.floor(
			((e.clientX - rect.left) / rect.width) * props.map.widthTiles
		)
		const tileY = Math.floor(
			((e.clientY - rect.top) / rect.height) * props.map.heightTiles
		)
		if (
			tileX < 0 ||
			tileY < 0 ||
			tileX >= props.map.widthTiles ||
			tileY >= props.map.heightTiles
		) {
			return null
		}
		return { tileX, tileY }
	}

	function handleMove(e: PointerEvent) {
		hover.value = tileFromEvent(e)
	}

	function handlePick(e: PointerEvent) {
		const pos = tileFromEvent(e)
		if (!pos) return
		hover.value = pos
		if (!isTileWalkable(props.map, pos.tileX, pos.tileY) || occupiedByOther(pos)) {
			return
		}
		emit('pick', pos)
	}

	function cellStyle(pos: TilePosition) {
		return {
			left: `${(pos.tileX / props.map.widthTiles) * 100}%`,
			top: `${(pos.tileY / props.map.heightTiles) * 100}%`,
			width: `${100 / props.map.widthTiles}%`,
			height: `${100 / props.map.heightTiles}%`
		}
	}

	function markerStyle(pos: TilePosition) {
		return {
			left: `${((pos.tileX + 0.5) / props.map.widthTiles) * 100}%`,
			top: `${((pos.tileY + 0.8) / props.map.heightTiles) * 100}%`
		}
	}

	// Esc dan klik di luar ditangani UModal.
	const open = computed({
		get: () => true,
		set: (value: boolean) => {
			if (!value) emit('close')
		}
	})
</script>

<template>
	<UModal
		v-model:open="open"
		:title="`Posisi Soal #${activeIndex + 1} di ${map.name}`"
		description="Ketuk tempat yang bisa dilewati. Area merah (rumah, air, pohon) tidak bisa dipilih."
		:ui="{ content: 'sm:max-w-5xl' }"
	>
		<template #actions>
			<div class="flex flex-wrap items-center gap-2">
				<GameNpcSprite :npc-id="activeQuestion?.npcId" :scale="2" />
				<UBadge
					:label="hover ? `Kolom ${hover.tileX}, Baris ${hover.tileY}` : 'Arahkan ke peta'"
					color="neutral"
					variant="outline"
					class="font-mono"
				/>
			</div>
		</template>

		<template #body>
				<div class="overflow-auto">
					<div
						ref="surfaceEl"
						class="relative mx-auto w-full cursor-crosshair select-none overflow-hidden rounded-lg border-2 border-[#16211b]"
						:style="{ aspectRatio: `${map.widthTiles} / ${map.heightTiles}` }"
						@pointermove="handleMove"
						@pointerleave="hover = null"
						@pointerdown="handlePick"
					>
						<img
							:src="map.mapImageUrl"
							:alt="map.name"
							class="pointer-events-none absolute inset-0 h-full w-full"
							style="image-rendering: pixelated"
							draggable="false"
						>

						<!-- Sel yang sedang ditunjuk -->
						<div
							v-if="hover"
							class="pointer-events-none absolute border-2"
							:class="
								hoverWalkable
									? 'border-white bg-[#22c55e]/60'
									: 'border-white bg-[#dc2626]/70'
							"
							:style="cellStyle(hover)"
						/>

						<!-- Karakter semua soal yang sudah diberi posisi -->
						<template
							v-for="(q, idx) in questions"
							:key="q.id"
						>
							<div
								v-if="q.placement"
								class="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
								:style="markerStyle(q.placement)"
							>
								<span
									class="rounded border border-[#16211b] px-1 font-mono-num text-[10px] font-extrabold leading-tight text-[#16211b]"
									:class="idx === activeIndex ? 'bg-[#facc15]' : 'bg-white'"
								>
									#{{ idx + 1 }}
								</span>
								<GameNpcSprite
									:npc-id="q.npcId"
									:scale="1"
									:animated="idx === activeIndex"
								/>
							</div>
						</template>
					</div>
				</div>

		</template>

		<template #footer>
			<div class="flex w-full flex-wrap items-center justify-between gap-3">
				<p class="text-sm text-muted">
					Karakter: <strong class="text-highlighted">{{ getNpcCharacter(activeQuestion?.npcId).label }}</strong>
					·
					{{
						activeQuestion?.placement
							? `berdiri di kolom ${activeQuestion.placement.tileX}, baris ${activeQuestion.placement.tileY}`
							: 'posisi otomatis (pos bawaan peta)'
					}}
				</p>
				<div class="flex gap-2">
					<UButton label="Posisi otomatis" color="neutral" variant="outline" @click="emit('clear')" />
					<UButton label="Selesai" icon="i-lucide-check" @click="emit('close')" />
				</div>
			</div>
		</template>
	</UModal>
</template>
