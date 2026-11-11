import { GAME_CONSTANTS, isNicknameOffensive, tidyNickname } from '@petakuis/shared'

/** Nama panggilan rapi; nama yang mengandung kata kasar diganti nama netral. */
export function sanitizeNickname(raw: unknown): string {
	const cleaned = tidyNickname(typeof raw === 'string' ? raw : '')
	if (!cleaned) return 'Petualang'
	if (isNicknameOffensive(cleaned)) {
		return 'Siswa-' + Math.floor(100 + Math.random() * 899)
	}
	return cleaned
}

export function isWithinInteractionDistance(
	playerX: number,
	playerY: number,
	objectTileX: number,
	objectTileY: number,
	effectiveTilePx: number
): boolean {
	const objCenterX = objectTileX * effectiveTilePx + effectiveTilePx / 2
	const objCenterY = objectTileY * effectiveTilePx + effectiveTilePx / 2
	const dx = playerX - objCenterX
	const dy = playerY - objCenterY
	const dist = Math.hypot(dx, dy)
	return dist <= GAME_CONSTANTS.INTERACTION_RADIUS_PX * 1.4
}

export function clampMovementStep(
	prevX: number,
	prevY: number,
	targetX: number,
	targetY: number,
	maxMapWidthPx: number,
	maxMapHeightPx: number
): { x: number; y: number } {
	const dx = targetX - prevX
	const dy = targetY - prevY
	const dist = Math.hypot(dx, dy)
	const maxStepPx = 96

	let nextX = targetX
	let nextY = targetY

	if (dist > maxStepPx && dist > 0) {
		const ratio = maxStepPx / dist
		nextX = prevX + dx * ratio
		nextY = prevY + dy * ratio
	}

	const margin = 24
	return {
		x: Math.round(Math.max(margin, Math.min(maxMapWidthPx - margin, nextX))),
		y: Math.round(Math.max(margin, Math.min(maxMapHeightPx - margin, nextY)))
	}
}
