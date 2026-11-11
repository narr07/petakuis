<script setup lang="ts">
	import {
		getNpcCharacter,
		type AnswerResultPayload,
		type PublicQuestionPayload
	} from '@petakuis/shared'

	const props = defineProps<{
		question: PublicQuestionPayload
		result: AnswerResultPayload | null
	}>()

	const emit = defineEmits<{
		submit: [value: string[]]
		close: []
	}>()

	const selectedOption = ref('')
	const subjectiveInput = ref('')
	const showHint = ref(false)
	const remainingS = ref(props.question.remainingTimeS)

	const open = computed({
		get: () => true,
		set: (value: boolean) => {
			if (!value) emit('close')
		}
	})

	let timer: ReturnType<typeof setInterval> | null = null

	watch(
		() => props.question.questionId,
		() => {
			selectedOption.value = ''
			subjectiveInput.value = ''
			showHint.value = false
			remainingS.value = props.question.remainingTimeS
		}
	)

	function handleSubmit() {
		if (props.result) {
			emit('close')
			return
		}
		if (props.question.type === 'subjective') {
			if (!subjectiveInput.value.trim()) return
			emit('submit', [subjectiveInput.value.trim()])
			return
		}
		if (!selectedOption.value) return
		emit('submit', [selectedOption.value])
	}

	function selectAndSubmit(optionId: string) {
		if (props.result) return
		selectedOption.value = optionId
		emit('submit', [optionId])
	}

	// Esc ditangani UModal; tombol 1-4 memilih jawaban pilihan ganda.
	function handleKeydown(e: KeyboardEvent) {
		if (!props.result && props.question.type === 'multiple') {
			const idx = ['1', '2', '3', '4'].indexOf(e.key)
			if (idx !== -1 && props.question.options[idx]) {
				selectAndSubmit(props.question.options[idx]!.id)
			}
		}
	}

	onMounted(() => {
		window.addEventListener('keydown', handleKeydown)
		timer = setInterval(() => {
			if (!props.result && remainingS.value > 0) {
				remainingS.value -= 1
			}
		}, 1000)
	})

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', handleKeydown)
		if (timer) clearInterval(timer)
	})
</script>

<template>
	<!-- z-index tinggi: jendela soal harus di atas HUD dan sprite peta -->
	<UModal
		v-model:open="open"
		:ui="{ overlay: 'z-[99998]', content: 'z-[99999] sm:max-w-xl' }"
		:close="false"
	>
		<template #header>
			<div class="flex w-full flex-wrap items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<GameNpcSprite :npc-id="question.npcId" :scale="2" />
					<span class="text-sm font-semibold text-highlighted">
						{{ getNpcCharacter(question.npcId).label }}
					</span>
					<UBadge :label="`Pos #${question.orderIndex}/${question.totalQuestions}`" color="neutral" variant="solid" />
					<UBadge :label="`+${question.points} poin`" color="success" variant="subtle" />
				</div>
				<div class="flex items-center gap-2">
					<UBadge
						:label="`${remainingS} detik`"
						icon="i-lucide-timer"
						:color="remainingS <= 7 ? 'error' : 'warning'"
						variant="subtle"
						class="font-mono"
					/>
					<UButton
						label="Batal (Esc)"
						color="neutral"
						variant="outline"
						size="xs"
						@click="emit('close')"
					/>
				</div>
			</div>
		</template>

		<template #body>
			<div class="space-y-4">
				<div class="space-y-3">
					<h2 id="question-modal-title" class="text-base leading-relaxed font-bold text-highlighted sm:text-lg">
						{{ question.prompt }}
					</h2>
					<template v-if="question.hint">
						<UButton
							v-if="!showHint"
							label="Buka petunjuk"
							icon="i-lucide-lightbulb"
							color="success"
							variant="link"
							class="px-0"
							@click="showHint = true"
						/>
						<UAlert
							v-else
							icon="i-lucide-lightbulb"
							color="success"
							variant="subtle"
							:description="`Petunjuk: ${question.hint.value}`"
						/>
					</template>
				</div>

				<!-- Hasil jawaban -->
				<template v-if="result">
					<UAlert
						:icon="result.isCorrect ? 'i-lucide-party-popper' : 'i-lucide-circle-x'"
						:color="result.isCorrect ? 'success' : 'error'"
						variant="subtle"
						:title="result.isCorrect ? `Hebat! +${result.pointsEarned} poin` : 'Belum tepat (0 poin)'"
						:description="!result.isCorrect && result.correctAnswer
							? `Jawaban yang benar: ${result.correctAnswer.join(', ').toUpperCase()}`
							: undefined"
					>
						<template v-if="result.speedRank" #actions>
							<UBadge
								:label="`Tercepat #${result.speedRank} (+${result.speedBonus})`"
								icon="i-lucide-zap"
								color="warning"
								variant="solid"
							/>
						</template>
					</UAlert>
					<UButton
						label="Lanjutkan petualangan"
						trailing-icon="i-lucide-arrow-right"
						size="lg"
						block
						@click="emit('close')"
					/>
				</template>

				<!-- Pilihan jawaban -->
				<div
					v-else-if="question.type === 'multiple' || question.type === 'ox'"
					class="grid gap-2.5"
					:class="question.type === 'ox' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'"
				>
					<UButton
						v-for="(opt, idx) in question.options"
						:key="opt.id"
						color="neutral"
						variant="outline"
						size="lg"
						class="justify-start text-left whitespace-normal"
						@click="selectAndSubmit(opt.id)"
					>
						<UKbd :value="question.type === 'ox' ? opt.id.toUpperCase() : String(idx + 1)" />
						<span>{{ opt.text }}</span>
					</UButton>
				</div>

				<!-- Isian singkat -->
				<UForm v-else :state="{ subjectiveInput }" class="space-y-3" @submit="handleSubmit">
					<UFormField
						label="Jawaban singkat"
						description="Huruf besar/kecil dan spasi diabaikan."
						name="subjectiveInput"
					>
						<UInput
							v-model="subjectiveInput"
							autofocus
							size="xl"
							placeholder="Ketik jawabanmu di sini..."
							class="w-full"
						/>
					</UFormField>
					<UButton
						type="submit"
						label="Kirim jawaban"
						icon="i-lucide-send"
						size="lg"
						block
						:disabled="!subjectiveInput.trim()"
					/>
				</UForm>
			</div>
		</template>
	</UModal>
</template>
