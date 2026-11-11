<script setup lang="ts">
	import type { QuizDefinition } from '@petakuis/shared'

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
</script>

<template>
	<UPageCard
		:title="quiz.title"
		:description="quiz.description"
		variant="outline"
		:ui="{ container: 'h-full', wrapper: 'flex-1', footer: 'w-full' }"
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
			</div>
		</template>

		<template v-if="showSamples && samples.length" #body>
			<UCard variant="subtle" :ui="{ body: 'p-3 sm:p-3 space-y-2' }">
				<p class="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted">
					<UIcon name="i-lucide-list-checks" class="size-4 text-primary" />
					Contoh soal · {{ quiz.questions.length }} soal
				</p>
				<div
					v-for="q in samples"
					:key="q.id"
					class="flex items-center gap-2 text-sm"
				>
					<UBadge
						:color="questionTypeInfo(q.type).color"
						variant="subtle"
						size="sm"
						class="shrink-0"
						:label="questionTypeInfo(q.type).label"
					/>
					<span class="truncate text-highlighted">{{ q.prompt }}</span>
				</div>
			</UCard>
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
						size="md"
						icon="i-lucide-gamepad-2"
						label="Coba"
					/>
					<UButton
						size="md"
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
