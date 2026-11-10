import type { QuizQuestion } from './types'

export function normalizeSubjectiveText(input: string, ignoreSpaces = true): string {
	const base = input.trim().toLowerCase()
	return ignoreSpaces ? base.replace(/\s+/g, '') : base.replace(/\s+/g, ' ')
}

export function evaluateAnswer(question: QuizQuestion, submittedValues: string[]): boolean {
	if (!submittedValues || submittedValues.length === 0) {
		return false
	}

	if (question.type === 'subjective') {
		const candidate = normalizeSubjectiveText(
			submittedValues[0] ?? '',
			question.ignoreSpaces ?? true
		)
		if (!candidate) return false
		return question.answer.some(
			(accepted) =>
				normalizeSubjectiveText(accepted, question.ignoreSpaces ?? true) === candidate
		)
	}

	if (question.type === 'ox') {
		return (
			submittedValues[0]?.toLowerCase() === (question.answer[0] ?? '').toLowerCase()
		)
	}

	if (question.isMultipleAnswer) {
		if (submittedValues.length !== question.answer.length) return false
		const expectedSet = new Set(question.answer)
		return submittedValues.every((val) => expectedSet.has(val))
	}

	return submittedValues[0] === question.answer[0]
}

export function calculateScore(params: {
	basePoints: number
	timeLimitS: number
	elapsedMs: number
	isCorrect: boolean
	correctOrderRank: number
}): {
	pointsEarned: number
	speedBonus: number
	speedRank: number | null
} {
	if (!params.isCorrect) {
		return {
			pointsEarned: 0,
			speedBonus: 0,
			speedRank: null
		}
	}

	const T = Math.max(5, params.timeLimitS)
	const t = Math.min(T, Math.max(0, params.elapsedMs / 1000))
	const rawScore = params.basePoints * (0.5 + 0.5 * ((T - t) / T))
	const baseEarned = Math.round(rawScore)

	const isTopThree = params.correctOrderRank >= 1 && params.correctOrderRank <= 3
	const speedBonus = isTopThree ? Math.round(params.basePoints * 0.1) : 0

	return {
		pointsEarned: baseEarned + speedBonus,
		speedBonus,
		speedRank: isTopThree ? params.correctOrderRank : null
	}
}
