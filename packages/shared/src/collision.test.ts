import { describe, expect, test } from 'bun:test'
import { isTileWalkable, slideMovePlayer } from './collision'
import { MAP_CATALOG } from './maps'

describe('Grid tabrakan setengah tile', () => {
	const fineMaps = MAP_CATALOG.filter(m => m.collisionFineRows?.length)

	test('peta hasil Godot punya grid halus berukuran dua kali grid tile', () => {
		expect(fineMaps.length).toBeGreaterThanOrEqual(4)
		for (const map of fineMaps) {
			const fine = map.collisionFineRows!
			expect(fine.length).toBe(map.heightTiles * 2)
			for (const row of fine) {
				expect(row.length).toBe(map.widthTiles * 2)
			}
		}
	})

	test('sel tile terhalang bila salah satu sel kecilnya terhalang, dan sebaliknya', () => {
		for (const map of fineMaps) {
			const fine = map.collisionFineRows!
			for (let y = 0; y < map.heightTiles; y++) {
				for (let x = 0; x < map.widthTiles; x++) {
					const anyFine
						= fine[y * 2]![x * 2] === '#'
							|| fine[y * 2]![x * 2 + 1] === '#'
							|| fine[y * 2 + 1]![x * 2] === '#'
							|| fine[y * 2 + 1]![x * 2 + 1] === '#'
					if (anyFine !== !isTileWalkable(map, x, y)) {
						throw new Error(`${map.id}: tile (${x}, ${y}) tidak selaras dengan grid halus`)
					}
				}
			}
		}
	})

	test('pemain bisa merapat sampai tepi gambar kios di Kota Pasar', () => {
		const map = MAP_CATALOG.find(m => m.id === 'map-kota-pasar')!
		const tilePx = map.tileSizePx * map.renderScale
		// Kios timur laut menempati tile 25..28 (gambarnya kira-kira 25,8..28,2) di baris 22..23.
		// Pemain mulai di kanan kios lalu berjalan ke kiri sampai mentok.
		for (const row of [22.5, 23.5]) {
			let x = 31.5 * tilePx
			const y = row * tilePx
			for (let i = 0; i < 80; i++) {
				x = slideMovePlayer(map, x, y, -4, 0).x
			}
			// Dulu berhenti di 29,27 tile karena seluruh kolom 28 dianggap tembok. Sekarang tepi
			// kaki pemain (lebar setengah ±0,27 tile) berhenti di sel setengah tile berisi tiang kios.
			expect(x / tilePx).toBeLessThan(28.9)
			expect(x / tilePx).toBeGreaterThan(28.2)
		}
	})
})
