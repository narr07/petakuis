import { describe, expect, test } from 'bun:test'
import { findTilePathBFS, isTileWalkable } from './collision'
import { MAP_CATALOG, STARTER_QUIZZES } from './maps'
import { buildAssignedObjects, NPC_CHARACTERS } from './npcs'
import type { MapTemplate, QuizDefinition } from './types'

const sunnyside = MAP_CATALOG.find((m) => m.id === 'map-desa-sunnyside') as MapTemplate
const baseQuiz = STARTER_QUIZZES[1] as QuizDefinition

describe('peta Lembah Sunnyside hasil ekspor Godot', () => {
	test('ukuran data tabrakan cocok dengan ukuran peta', () => {
		expect(sunnyside.collisionRows).toHaveLength(sunnyside.heightTiles)
		for (const row of sunnyside.collisionRows ?? []) {
			expect(row).toHaveLength(sunnyside.widthTiles)
		}
	})

	test('titik mulai dan semua pos soal bisa dipijak dan saling terhubung', () => {
		const tilePx = sunnyside.tileSizePx * sunnyside.renderScale
		const center = (t: number) => t * tilePx + tilePx / 2
		const { playerSpawn } = sunnyside
		expect(isTileWalkable(sunnyside, playerSpawn.tileX, playerSpawn.tileY)).toBe(true)
		expect(sunnyside.spawnPoints).toHaveLength(24)
		for (const sp of sunnyside.spawnPoints) {
			expect(isTileWalkable(sunnyside, sp.tileX, sp.tileY)).toBe(true)
			const path = findTilePathBFS(
				sunnyside,
				center(playerSpawn.tileX),
				center(playerSpawn.tileY),
				center(sp.tileX),
				center(sp.tileY)
			)
			expect(path.length).toBeGreaterThan(0)
		}
	})
})

describe('buildAssignedObjects', () => {
	test('posisi dan karakter pilihan guru dipakai apa adanya', () => {
		const quiz: QuizDefinition = {
			...baseQuiz,
			mapId: sunnyside.id,
			mode: 'free',
			questions: baseQuiz.questions.map((q, idx) =>
				idx === 0
					? { ...q, npcId: 'goblin', placement: { tileX: 21, tileY: 26 } }
					: q
			)
		}
		const objects = buildAssignedObjects(quiz, sunnyside, 'p_abc')
		expect(objects).toHaveLength(quiz.questions.length)
		expect(objects[0]).toMatchObject({ tileX: 21, tileY: 26, npcId: 'goblin' })
		// Soal lain tidak boleh menumpuk di posisi yang sama.
		const cells = new Set(objects.map((o) => `${o.tileX},${o.tileY}`))
		expect(cells.size).toBe(objects.length)
		for (const o of objects) {
			expect(isTileWalkable(sunnyside, o.tileX, o.tileY)).toBe(true)
			expect(NPC_CHARACTERS.some((c) => c.id === o.npcId)).toBe(true)
		}
	})

	test('posisi di sel terhalang atau di peta lain diabaikan', () => {
		const blocked = { ...baseQuiz, mapId: sunnyside.id }
		blocked.questions = baseQuiz.questions.map((q) => ({
			...q,
			placement: { tileX: 0, tileY: 0 }
		}))
		for (const o of buildAssignedObjects(blocked, sunnyside, 'p1')) {
			expect(isTileWalkable(sunnyside, o.tileX, o.tileY)).toBe(true)
		}

		const otherMap = { ...blocked, mapId: 'map-kampus-modern' }
		otherMap.questions = baseQuiz.questions.map((q) => ({
			...q,
			placement: { tileX: 21, tileY: 26 }
		}))
		const objects = buildAssignedObjects(otherMap, sunnyside, 'p1')
		expect(objects.some((o) => o.tileX === 21 && o.tileY === 26)).toBe(false)
	})

	test('mode linear memakai pos bawaan secara berurutan untuk semua pemain', () => {
		const quiz = { ...baseQuiz, mapId: sunnyside.id, mode: 'linear' as const }
		const a = buildAssignedObjects(quiz, sunnyside, 'p1')
		const b = buildAssignedObjects(quiz, sunnyside, 'p2')
		expect(a.map((o) => [o.tileX, o.tileY])).toEqual(b.map((o) => [o.tileX, o.tileY]))
	})
})
