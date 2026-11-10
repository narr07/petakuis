import { isTileWalkable } from './collision'
import type { AssignedMapObject } from './events'
import type {
	MapTemplate,
	NpcCharacter,
	QuizDefinition,
	TilePosition
} from './types'

/** Karakter pemberi soal. Sprite dibuat oleh tools/godot-maps/scripts/build_characters.gd. */
export const NPC_CHARACTERS: NpcCharacter[] = [
	{ id: 'rambut-kuncir', label: 'Kak Kuncir', spriteUrl: '/characters/rambut-kuncir.png', frames: 9 },
	{ id: 'rambut-cepak', label: 'Bang Cepak', spriteUrl: '/characters/rambut-cepak.png', frames: 9 },
	{ id: 'rambut-keriting', label: 'Bu Keriting', spriteUrl: '/characters/rambut-keriting.png', frames: 9 },
	{ id: 'rambut-jabrik', label: 'Si Jabrik', spriteUrl: '/characters/rambut-jabrik.png', frames: 9 },
	{ id: 'rambut-mangkuk', label: 'Dik Poni', spriteUrl: '/characters/rambut-mangkuk.png', frames: 9 },
	{ id: 'rambut-jambul', label: 'Mas Jambul', spriteUrl: '/characters/rambut-jambul.png', frames: 9 },
	{ id: 'pak-botak', label: 'Pak Botak', spriteUrl: '/characters/pak-botak.png', frames: 9 },
	{ id: 'goblin', label: 'Goblin Usil', spriteUrl: '/characters/goblin.png', frames: 9 },
	{ id: 'tengkorak', label: 'Tengkorak Ramah', spriteUrl: '/characters/tengkorak.png', frames: 6 }
]

export function getNpcCharacter(id: string | undefined): NpcCharacter {
	return NPC_CHARACTERS.find((c) => c.id === id) ?? NPC_CHARACTERS[0]!
}

/** Posisi pilihan guru hanya berlaku di peta tempat kuis itu disusun. */
export function isValidPlacement(
	map: MapTemplate,
	placement: TilePosition | undefined
): placement is TilePosition {
	return (
		!!placement &&
		Number.isInteger(placement.tileX) &&
		Number.isInteger(placement.tileY) &&
		isTileWalkable(map, placement.tileX, placement.tileY)
	)
}

/**
 * Menentukan karakter dan posisi tiap soal untuk satu pemain.
 *
 * Soal yang posisinya dipilih guru selalu berdiri di posisi itu. Sisanya
 * memakai pos bawaan peta: berurutan pada mode linear, diacak per pemain pada
 * mode bebas (`shuffleSeed` membuat acakan stabil untuk pemain yang sama).
 */
export function buildAssignedObjects(
	quiz: Pick<QuizDefinition, 'questions' | 'mode' | 'mapId'>,
	map: MapTemplate,
	shuffleSeed: string
): AssignedMapObject[] {
	const questions = [...quiz.questions].sort((a, b) => a.order - b.order)
	const honorPlacements = quiz.mapId === map.id

	const taken = new Set<string>()
	for (const q of questions) {
		if (honorPlacements && isValidPlacement(map, q.placement)) {
			taken.add(`${q.placement.tileX},${q.placement.tileY}`)
		}
	}

	const pool = map.spawnPoints.filter(
		(sp) => !taken.has(`${sp.tileX},${sp.tileY}`)
	)
	if (quiz.mode === 'free') {
		let seed = 0
		for (let i = 0; i < shuffleSeed.length; i++) {
			seed = (seed * 31 + shuffleSeed.charCodeAt(i)) >>> 0
		}
		for (let i = pool.length - 1; i > 0; i--) {
			seed = (seed * 1664525 + 1013904223) >>> 0
			const j = seed % (i + 1)
			const temp = pool[i]!
			pool[i] = pool[j]!
			pool[j] = temp
		}
	}

	let poolIndex = 0
	return questions.map((q, idx) => {
		let position: TilePosition
		if (honorPlacements && isValidPlacement(map, q.placement)) {
			position = q.placement
		} else if (pool.length > 0) {
			position = pool[poolIndex % pool.length]!
			poolIndex++
		} else {
			position = map.playerSpawn
		}
		const npc = NPC_CHARACTERS.some((c) => c.id === q.npcId)
			? q.npcId!
			: NPC_CHARACTERS[idx % NPC_CHARACTERS.length]!.id
		return {
			objectId: `npc__${q.id}`,
			questionId: q.id,
			orderIndex: idx + 1,
			tileX: position.tileX,
			tileY: position.tileY,
			objectKind: 'npc',
			npcId: npc,
			answered: false
		}
	})
}
