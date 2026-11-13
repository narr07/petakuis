<script setup lang="ts">
	// Avatar 16x16 yang posisinya digerakkan GSAP; x/y awal (posisi kaki) dipakai saat render server.
	const props = withDefaults(
		defineProps<{
			walkerId: string
			spriteUrl: string
			x: number
			y: number
			scale?: number
			dir?: WalkDir
		}>(),
		{ scale: 1, dir: 'down' }
	)
</script>

<template>
	<div
		class="pixel-walker"
		:data-walker="props.walkerId"
		:style="{ transform: walkerTransform(props.x, props.y, props.scale), zIndex: 10 + Math.round(props.y) }"
	>
		<span class="pixel-walker__shadow" />
		<div class="pixel-walker__sprite relative" :style="avatarSpriteStyle(props.spriteUrl, props.scale, props.dir)" />
	</div>
</template>
