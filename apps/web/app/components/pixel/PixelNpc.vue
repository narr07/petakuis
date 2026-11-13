<script setup lang="ts">
	import { getNpcCharacter } from '@petakuis/shared'

	// NPC penjaga pos soal yang diam di tempat dengan animasi idle (frame 32x32, CSS steps).
	const props = withDefaults(
		defineProps<{
			npcId: string
			/** Posisi kaki (tengah bawah). */
			x: number
			y: number
			scale?: number
			flip?: boolean
		}>(),
		{ scale: 0.75, flip: false }
	)

	const FRAME = 32
	const VIEW = { x: 4, y: 6, w: 24, h: 22 }

	const npc = computed(() => getNpcCharacter(props.npcId))
	const style = computed(() => {
		const s = props.scale
		const w = VIEW.w * s
		const h = VIEW.h * s
		return {
			left: `${props.x - w / 2}px`,
			top: `${props.y - h}px`,
			width: `${w}px`,
			height: `${h}px`,
			zIndex: 10 + Math.round(props.y),
			backgroundImage: `url(${npc.value.spriteUrl})`,
			backgroundSize: `${npc.value.frames * FRAME * s}px ${FRAME * s}px`,
			backgroundPosition: `${-VIEW.x * s}px ${-VIEW.y * s}px`,
			transform: props.flip ? 'scaleX(-1)' : undefined,
			'--npc-from': `${-VIEW.x * s}px`,
			'--npc-to': `${-(npc.value.frames * FRAME + VIEW.x) * s}px`,
			'--npc-steps': npc.value.frames,
			'--npc-duration': `${npc.value.frames * 0.12}s`
		}
	})
</script>

<template>
	<div class="pixel-npc" role="img" :aria-label="npc.label" :style="style" />
</template>

<style scoped>
	.pixel-npc {
		position: absolute;
		background-repeat: no-repeat;
		image-rendering: pixelated;
		animation: npc-idle var(--npc-duration) steps(var(--npc-steps)) infinite;
	}

	@keyframes npc-idle {
		from {
			background-position-x: var(--npc-from);
		}
		to {
			background-position-x: var(--npc-to);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pixel-npc {
			animation: none;
		}
	}
</style>
