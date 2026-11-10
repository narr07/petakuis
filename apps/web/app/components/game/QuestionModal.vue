<script setup lang="ts">
	import type {
		AnswerResultPayload,
		PublicQuestionPayload
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			emit('close')
		}
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
	<div
		class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
		style="z-index: 2000"
		role="dialog"
		aria-modal="true"
		aria-labelledby="question-modal-title"
	>
		<!-- Classic GBA Pokémon Double-Border Dialogue Window -->
		<div
			class="w-full max-w-xl rounded-2xl border-4 border-[#283040] bg-[#f8f8f8] p-1.5 shadow-[6px_6px_0px_#16211b]"
		>
			<div class="rounded-xl border-2 border-[#6888a8] bg-[#f8f8f0] p-5 text-[#202830]">
				<!-- GBA Battle Header Bar -->
				<div class="flex items-center justify-between border-b-2 border-[#283040] pb-3">
					<div class="flex items-center gap-2.5">
						<img
							src="/gba/sprites/item_ball.png"
							alt=""
							class="h-6 w-6"
							style="image-rendering: pixelated"
						/>
						<span
							class="rounded bg-[#283040] px-2.5 py-1 font-pixel text-[10px] text-[#f8d030]"
						>
							POS #{{ question.orderIndex }}/{{ question.totalQuestions }}
						</span>
						<span
							class="rounded border border-[#283040] bg-[#e0f0e8] px-2 py-0.5 text-xs font-extrabold text-[#14532d]"
						>
							+{{ question.points }} EXP
						</span>
					</div>

					<div class="flex items-center gap-2.5">
						<span
							class="font-mono-num rounded border-2 border-[#283040] px-2.5 py-1 text-xs font-extrabold"
							:class="
								remainingS <= 7
									? 'bg-[#fee2e2] text-[#991b1b]'
									: 'bg-[#fef08a] text-[#16211b]'
							"
						>
							⏱ {{ remainingS }}s
						</span>
						<button
							type="button"
							class="rounded border-2 border-[#283040] bg-white px-2.5 py-1 text-xs font-extrabold hover:bg-[#e6decb]"
							@click="emit('close')"
						>
							Batal (Esc)
						</button>
					</div>
				</div>

				<!-- Prompt Box -->
				<div class="mt-4 rounded-xl border-2 border-[#283040] bg-white p-4">
					<h2
						id="question-modal-title"
						class="text-base font-extrabold leading-relaxed sm:text-lg"
					>
						{{ question.prompt }}
					</h2>

					<div
						v-if="question.hint"
						class="mt-3"
					>
						<button
							v-if="!showHint"
							type="button"
							class="text-xs font-extrabold text-[#15803d] underline"
							@click="showHint = true"
						>
							▶ Buka Petunjuk Pokédex (Hint)
						</button>
						<p
							v-else
							class="rounded-lg border border-[#15803d] bg-[#dcfce7] px-3 py-2 text-xs font-bold text-[#14532d]"
						>
							Pokédex: {{ question.hint.value }}
						</p>
					</div>
				</div>

				<!-- Answer Result Banner -->
				<div
					v-if="result"
					class="mt-4 rounded-xl border-2 border-[#283040] p-4"
					:class="result.isCorrect ? 'bg-[#dcfce7]' : 'bg-[#fee2e2]'"
				>
					<div class="flex items-center justify-between">
						<p
							class="text-base font-extrabold"
							:class="result.isCorrect ? 'text-[#14532d]' : 'text-[#991b1b]'"
						>
							{{
								result.isCorrect
									? `Super Effective! +${result.pointsEarned} Poin`
									: 'Belum Tepat! (0 Poin)'
							}}
						</p>
						<span
							v-if="result.speedRank"
							class="rounded border border-[#283040] bg-[#fef08a] px-2 py-0.5 text-xs font-extrabold text-[#16211b]"
						>
							Tercepat #{{ result.speedRank }} (+{{ result.speedBonus }})
						</span>
					</div>
					<p
						v-if="!result.isCorrect && result.correctAnswer"
						class="mt-1 text-xs font-bold text-[#7f1d1d]"
					>
						Jawaban yang benar: {{ result.correctAnswer.join(', ').toUpperCase() }}
					</p>
					<button
						type="button"
						class="pixel-btn mt-4 w-full rounded-xl bg-[#15803d] py-2.5 text-sm font-extrabold text-white"
						@click="emit('close')"
					>
						▶ Lanjutkan Petualangan
					</button>
				</div>

				<!-- Interactive GBA Command Menu Choices -->
				<div
					v-else
					class="mt-4"
				>
					<div
						v-if="question.type === 'multiple' || question.type === 'ox'"
						class="grid gap-2.5"
						:class="question.type === 'ox' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'"
					>
						<button
							v-for="(opt, idx) in question.options"
							:key="opt.id"
							type="button"
							class="pixel-btn group flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-left text-sm font-extrabold text-[#16211b] hover:bg-[#fef08a]"
							@click="selectAndSubmit(opt.id)"
						>
							<span class="font-pixel text-[10px] text-[#dc2626]">▶</span>
							<span
								class="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[#283040] bg-[#f8f8f0] font-mono-num text-xs font-extrabold uppercase"
							>
								{{ question.type === 'ox' ? opt.id.toUpperCase() : idx + 1 }}
							</span>
							<span>{{ opt.text }}</span>
						</button>
					</div>

					<form
						v-else
						class="space-y-3"
						@submit.prevent="handleSubmit"
					>
						<label
							for="subjective-answer-input"
							class="block text-xs font-extrabold uppercase tracking-wider text-[#435249]"
						>
							Ketik Jawaban Singkat (Huruf besar/kecil & spasi diabaikan)
						</label>
						<input
							id="subjective-answer-input"
							v-model="subjectiveInput"
							type="text"
							autofocus
							placeholder="Ketik jawabanmu di sini..."
							class="w-full rounded-xl border-2 border-[#283040] bg-white px-4 py-3 text-base font-bold text-[#16211b]"
						/>
						<button
							type="submit"
							class="pixel-btn w-full rounded-xl bg-[#dc2626] py-3 text-sm font-extrabold text-white"
						>
							▶ Kirim Jawaban
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>
