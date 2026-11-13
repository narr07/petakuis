<script setup lang="ts">
	const props = withDefaults(
		defineProps<{
			name: PixelSpriteName
			/** Ukuran satu piksel gambar dalam px layar. */
			scale?: number
		}>(),
		{ scale: 4 }
	)

	const sprite = computed(() => PIXEL_SPRITES[props.name])
	const size = computed(() => pixelSize(sprite.value))
	const rects = computed(() => pixelRects(sprite.value))
</script>

<template>
	<svg
		:viewBox="`0 0 ${size.w} ${size.h}`"
		:width="size.w * scale"
		:height="size.h * scale"
		shape-rendering="crispEdges"
		aria-hidden="true"
		class="block shrink-0"
	>
		<rect
			v-for="(r, i) in rects"
			:key="i"
			:x="r.x"
			:y="r.y"
			:width="r.w"
			height="1"
			:fill="r.fill"
		/>
	</svg>
</template>
