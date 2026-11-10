<script lang="ts">
	// Satu pewaktu untuk semua sprite supaya animasi diam serempak dan murah.
	</script>

<script setup lang="ts">
	import { getNpcCharacter } from '@petakuis/shared'
const npcTick = ref(0)
	let npcTickUsers = 0
	let npcTickTimer: ReturnType<typeof setInterval> | null = null

	const props = withDefaults(
		defineProps<{
			npcId?: string
			scale?: number
			animated?: boolean
			flip?: boolean
		}>(),
		{ npcId: undefined, scale: 3, animated: true, flip: false }
	)

	// Frame asli 32x32; karakter berdiri di jendela 24x22 ini (kaki di tepi bawah).
	const FRAME = 32
	const VIEW = { x: 4, y: 6, w: 24, h: 22 }

	const npc = computed(() => getNpcCharacter(props.npcId))
	const frame = computed(() =>
		props.animated ? npcTick.value % npc.value.frames : 0
	)
	const boxStyle = computed(() => ({
		width: `${VIEW.w * props.scale}px`,
		height: `${VIEW.h * props.scale}px`,
		backgroundImage: `url(${npc.value.spriteUrl})`,
		backgroundSize: `${npc.value.frames * FRAME * props.scale}px ${FRAME * props.scale}px`,
		backgroundPosition: `${-(frame.value * FRAME + VIEW.x) * props.scale}px ${-VIEW.y * props.scale}px`,
		backgroundRepeat: 'no-repeat',
		imageRendering: 'pixelated' as const,
		transform: props.flip ? 'scaleX(-1)' : 'none'
	}))

	onMounted(() => {
		npcTickUsers++
		if (!npcTickTimer) {
			npcTickTimer = setInterval(() => {
				npcTick.value = (npcTick.value + 1) % 3600
			}, 120)
		}
	})

	onBeforeUnmount(() => {
		npcTickUsers--
		if (npcTickUsers <= 0 && npcTickTimer) {
			clearInterval(npcTickTimer)
			npcTickTimer = null
			npcTickUsers = 0
		}
	})
</script>

<template>
	<div
		class="shrink-0"
		role="img"
		:aria-label="npc.label"
		:style="boxStyle"
	/>
</template>
