<script setup lang="ts">
	import type { MapTemplate } from '@petakuis/shared'

	defineProps<{
		map: MapTemplate
	}>()
</script>

<template>
	<UBlogPost
		:title="map.name"
		:description="map.description"
		:image="{ src: map.mapImageUrl, alt: map.name, loading: 'lazy' }"
		:badge="{ label: `Mode ${modeLabel(map.defaultMode)}`, color: 'neutral', variant: 'solid' }"
		:ui="{
			image: '[image-rendering:pixelated]',
			description: 'line-clamp-3'
		}"
	>
		<template #footer>
			<div class="flex flex-wrap items-center justify-between gap-3 pt-2">
				<div class="flex flex-wrap gap-1.5">
					<UBadge
						color="success"
						variant="subtle"
						size="sm"
						icon="i-lucide-flag"
						:label="`${map.spawnPoints.length} pos soal`"
					/>
					<UBadge
						color="neutral"
						variant="subtle"
						size="sm"
						icon="i-lucide-grid-3x3"
						:label="`${map.widthTiles}×${map.heightTiles} tile`"
					/>
				</div>
				<UButton
					:to="`/build?mapId=${map.id}`"
					size="md"
					icon="i-lucide-map-pin"
					label="Pakai Peta"
				/>
			</div>
		</template>
	</UBlogPost>
</template>
