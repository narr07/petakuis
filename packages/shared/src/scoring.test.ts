import { describe, expect, test } from 'bun:test'
import {
	findTilePathBFS,
	isFootBoxWalkable,
	isTileWalkable,
	slideMovePlayer
} from './collision'
import { MAP_CATALOG } from './maps'
import {
	calculateScore,
	evaluateAnswer,
	normalizeSubjectiveText
} from './scoring'
import type { QuizQuestion } from './types'

describe('Petakuis Authoritative Scoring & Evaluation', () => {
	test('normalizes subjective text with ignoreSpaces', () => {
		expect(normalizeSubjectiveText('  Danau   Toba ', true)).toBe('danautoba')
		expect(normalizeSubjectiveText('  Danau   Toba ', false)).toBe('danau toba')
	})

	test('evaluates multiple choice, ox, and subjective answers accurately', () => {
		const subjectiveQ: QuizQuestion = {
			id: 'q1',
			type: 'subjective',
			prompt: 'Danau terbesar di Indonesia?',
			options: [],
			answer: ['danau toba', 'toba'],
			ignoreSpaces: true,
			timeLimitS: 30,
			points: 100,
			order: 1
		}

		expect(evaluateAnswer(subjectiveQ, ['DANAU TOBA'])).toBe(true)
		expect(evaluateAnswer(subjectiveQ, ['d a n a u   t o b a'])).toBe(true)
		expect(evaluateAnswer(subjectiveQ, ['danau singkarak'])).toBe(false)
	})

	test('calculates speed-weighted score and top-3 speed bonus', () => {
		const instantFirst = calculateScore({
			basePoints: 100,
			timeLimitS: 30,
			elapsedMs: 0,
			isCorrect: true,
			correctOrderRank: 1
		})
		expect(instantFirst.pointsEarned).toBe(110)
		expect(instantFirst.speedBonus).toBe(10)
		expect(instantFirst.speedRank).toBe(1)

		const halfTimeFourth = calculateScore({
			basePoints: 100,
			timeLimitS: 30,
			elapsedMs: 15000,
			isCorrect: true,
			correctOrderRank: 4
		})
		expect(halfTimeFourth.pointsEarned).toBe(75)
		expect(halfTimeFourth.speedBonus).toBe(0)
		expect(halfTimeFourth.speedRank).toBeNull()

		const wrongAnswer = calculateScore({
			basePoints: 100,
			timeLimitS: 30,
			elapsedMs: 3000,
			isCorrect: false,
			correctOrderRank: 0
		})
		expect(wrongAnswer.pointsEarned).toBe(0)
	})

	test('blocks player from walking onto houses, roofs, trees, or water and validates all spawns', () => {
		for (const map of MAP_CATALOG) {
			const tilePx = map.tileSizePx * map.renderScale
			const spawnX = map.playerSpawn.tileX * tilePx + tilePx / 2
			const spawnY = map.playerSpawn.tileY * tilePx + tilePx / 2
			expect(isFootBoxWalkable(map, spawnX, spawnY)).toBe(true)

			for (const sp of map.spawnPoints) {
				const sx = sp.tileX * tilePx + tilePx / 2
				const sy = sp.tileY * tilePx + tilePx / 2
				expect(isFootBoxWalkable(map, sx, sy)).toBe(true)
			}

			for (const obs of map.obstacles) {
				for (let ty = obs.tileY; ty < obs.tileY + obs.height; ty++) {
					for (let tx = obs.tileX; tx < obs.tileX + obs.width; tx++) {
						expect(isTileWalkable(map, tx, ty)).toBe(false)
					}
				}
			}
		}

		// Berjalan lurus ke atas dari jalan ke rumah merah di Kota Pasar (tile 23..27, baris 13..18;
		// baris 18 adalah bayangan yang boleh diinjak, dinding mulai baris 17).
		const town = MAP_CATALOG.find(m => m.id === 'map-kota-pasar')!
		const tilePx = town.tileSizePx * town.renderScale
		let px = 25 * tilePx + tilePx / 2
		let py = 19 * tilePx + tilePx / 2 // jalan tepat di depan pintu
		expect(isFootBoxWalkable(town, px, py)).toBe(true)

		for (let i = 0; i < 30; i++) {
			const slid = slideMovePlayer(town, px, py, 0, -12)
			px = slid.x
			py = slid.y
		}
		// Pemain boleh sampai baris bayangan (18) tetapi tidak pernah masuk dinding (baris 17).
		expect(Math.floor(py / tilePx)).toBe(18)
		expect(isFootBoxWalkable(town, px, py)).toBe(true)

		// Pencarian jalan dari titik mulai ke pos soal terakhir di kota.
		const lastTownSpot = town.spawnPoints[town.spawnPoints.length - 1]!
		const townPath = findTilePathBFS(
			town,
			spawnX(town),
			spawnY(town),
			lastTownSpot.tileX * tilePx + 24,
			lastTownSpot.tileY * tilePx + 24
		)
		expect(townPath.length).toBeGreaterThan(0)
		for (const wp of townPath) {
			expect(isFootBoxWalkable(town, wp.x, wp.y)).toBe(true)
		}

		// Pencarian jalan antar pos soal di semua peta.
		for (const regionalMap of MAP_CATALOG) {
			const firstSp = regionalMap.spawnPoints[0]!
			const lastSp = regionalMap.spawnPoints[regionalMap.spawnPoints.length - 1]!
			const routePath = findTilePathBFS(
				regionalMap,
				firstSp.tileX * tilePx + 24,
				firstSp.tileY * tilePx + 24,
				lastSp.tileX * tilePx + 24,
				lastSp.tileY * tilePx + 24
			)
			expect(routePath.length).toBeGreaterThan(0)
		}
	})
})

function spawnX(m: (typeof MAP_CATALOG)[number]) {
	const t = m.tileSizePx * m.renderScale
	return m.playerSpawn.tileX * t + t / 2
}
function spawnY(m: (typeof MAP_CATALOG)[number]) {
	const t = m.tileSizePx * m.renderScale
	return m.playerSpawn.tileY * t + t / 2
}
