<script setup lang="ts">
	import { MAP_CATALOG, type QuizDefinition } from '@petakuis/shared'

	const props = withDefaults(defineProps<{
		quiz: QuizDefinition
		launching?: boolean
		showSamples?: boolean
	}>(), {
		launching: false,
		showSamples: false
	})

	defineEmits<{
		launch: [quizId: string]
	}>()

	const samples = computed(() => props.quiz.questions.slice(0, 3))
	// Nama pendek peta (bagian sebelum "·"), misalnya "Pesisir Karang".
	const mapName = computed(() => MAP_CATALOG.find(m => m.id === props.quiz.mapId)?.name.split('·')[0]?.trim() ?? 'Peta')
</script>

<template>
	<!--
		Urutan UPageCard: header → judul & deskripsi → footer. Contoh soal ditaruh di slot
		deskripsi (bukan #body, karena #body menggantikan judul dan deskripsi).
	-->
	<UPageCard
		:title="quiz.title"
		variant="outline"
		spotlight
		class="min-w-0"
		:ui="{
			container: 'h-full min-w-0',
			// items-stretch: bawaan items-start membuat isi kartu hanya selebar teksnya.
			wrapper: 'flex-1 min-w-0 w-full items-stretch',
			body: 'w-full min-w-0',
			title: 'line-clamp-2',
			description: 'min-w-0 w-full',
			footer: 'w-full mt-auto pt-4'
		}"
	>
		<template #header>
			<div class="flex flex-wrap items-center gap-1.5">
				<UBadge color="neutral" variant="solid" size="sm">
					{{ quiz.schoolLevel.toUpperCase() }} · {{ quiz.gradeLabel }}
				</UBadge>
				<UBadge color="primary" variant="subtle" size="sm" :label="quiz.subject" />
				<UBadge
					color="warning"
					variant="subtle"
					size="sm"
					:icon="quiz.mode === 'linear' ? 'i-lucide-list-ordered' : 'i-lucide-shuffle'"
					:label="`Mode ${modeLabel(quiz.mode)}`"
				/>
				<UBadge color="neutral" variant="outline" size="sm" icon="i-lucide-map" :label="mapName" />
			</div>
		</template>

		<template #description>
			<p class="line-clamp-2">
				{{ quiz.description }}
			</p>

			<div
				v-if="showSamples && samples.length"
				class="mt-3 block w-full min-w-0 space-y-2 overflow-hidden rounded-md border border-default bg-elevated/50 p-3"
			>
				<p class="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted">
					<UIcon name="i-lucide-list-checks" class="size-4 shrink-0 text-primary" />
					Contoh soal · {{ quiz.questions.length }} soal
				</p>
				<div
					v-for="q in samples"
					:key="q.id"
					class="flex min-w-0 items-center gap-2 text-sm"
				>
					<UBadge
						:color="questionTypeInfo(q.type).color"
						variant="subtle"
						size="sm"
						class="w-12 shrink-0 justify-center"
						:label="questionTypeInfo(q.type).label"
					/>
					<span class="min-w-0 truncate text-highlighted">{{ q.prompt }}</span>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex w-full flex-wrap items-center justify-between gap-3">
				<UUser
					:name="quiz.ownerName"
					:description="`${quiz.questions.length} soal`"
					:avatar="{ icon: 'i-lucide-graduation-cap' }"
					size="sm"
				/>
				<div class="flex flex-wrap gap-2">
					<UButton
						to="/play/123456?nickname=Siswa&colorway=batik-biru"
						color="neutral"
						variant="outline"
						icon="i-lucide-gamepad-2"
						label="Coba"
					/>
					<UButton
						icon="i-lucide-presentation"
						label="Buka Kelas Live"
						:loading="launching"
						@click="$emit('launch', quiz.id)"
					/>
				</div>
			</div>
		</template>
	</UPageCard>
</template>
