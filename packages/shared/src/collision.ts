import type { MapTemplate } from './types'

export function isTileWalkable(
	map: MapTemplate,
	tileX: number,
	tileY: number
): boolean {
	if (
		tileX < 0 ||
		tileY < 0 ||
		tileX >= map.widthTiles ||
		tileY >= map.heightTiles
	) {
		return false
	}

	if (map.collisionRows && map.collisionRows.length > tileY) {
		const row = map.collisionRows[tileY]
		if (row && row[tileX] === '#') {
			return false
		}
	}

	for (const obs of map.obstacles) {
		if (
			tileX >= obs.tileX &&
			tileX < obs.tileX + obs.width &&
			tileY >= obs.tileY &&
			tileY < obs.tileY + obs.height
		) {
			return false
		}
	}

	return true
}

/**
 * Titik dunia (piksel) di grid setengah tile. Dipakai untuk gerak pemain bila peta
 * punya collisionFineRows; obstacles tetap diperiksa per tile.
 */
function isFinePointWalkable(map: MapTemplate, worldX: number, worldY: number, tilePx: number): boolean {
	const rows = map.collisionFineRows!
	const finePx = tilePx / 2
	const fx = Math.floor(worldX / finePx)
	const fy = Math.floor(worldY / finePx)
	const row = rows[fy]
	if (!row || fx < 0 || fx >= row.length || row[fx] === '#') {
		return false
	}

	const tx = Math.floor(worldX / tilePx)
	const ty = Math.floor(worldY / tilePx)
	for (const obs of map.obstacles) {
		if (tx >= obs.tileX && tx < obs.tileX + obs.width && ty >= obs.tileY && ty < obs.tileY + obs.height) {
			return false
		}
	}
	return true
}

export function isFootBoxWalkable(
	map: MapTemplate,
	worldX: number,
	worldY: number
): boolean {
	const tilePx = map.tileSizePx * map.renderScale
	const mapW = map.widthTiles * tilePx
	const mapH = map.heightTiles * tilePx

	const halfW = Math.round(tilePx * 0.28)
	const topOff = Math.round(tilePx * 0.42)
	const botOff = Math.round(tilePx * 0.24)

	const minX = worldX - halfW
	const maxX = worldX + halfW
	const minY = worldY - topOff
	const maxY = worldY + botOff

	if (minX < tilePx * 0.5 || maxX >= mapW - tilePx * 0.5) return false
	if (minY < tilePx * 0.5 || maxY >= mapH - tilePx * 0.5) return false

	const checkPoints: Array<[number, number]> = [
		[minX, minY],
		[maxX, minY],
		[minX, maxY],
		[maxX, maxY],
		[worldX, minY],
		[worldX, maxY],
		[minX, worldY],
		[maxX, worldY]
	]

	const useFine = Boolean(map.collisionFineRows?.length)
	for (const [px, py] of checkPoints) {
		if (useFine) {
			if (!isFinePointWalkable(map, px, py, tilePx)) {
				return false
			}
			continue
		}
		const tx = Math.floor(px / tilePx)
		const ty = Math.floor(py / tilePx)
		if (!isTileWalkable(map, tx, ty)) {
			return false
		}
	}

	return true
}

export function slideMovePlayer(
	map: MapTemplate,
	currX: number,
	currY: number,
	deltaX: number,
	deltaY: number
): { x: number; y: number; collided: boolean } {
	let nextX = currX
	let nextY = currY
	let collided = false

	if (deltaX !== 0) {
		const candidateX = currX + deltaX
		if (isFootBoxWalkable(map, candidateX, currY)) {
			nextX = candidateX
		} else {
			collided = true
			const step = Math.sign(deltaX) * 2
			let probe = currX
			const maxSteps = Math.min(24, Math.floor(Math.abs(deltaX) / 2))
			for (let i = 0; i < maxSteps; i++) {
				if (isFootBoxWalkable(map, probe + step, currY)) {
					probe += step
				} else {
					break
				}
			}
			nextX = probe
		}
	}

	if (deltaY !== 0) {
		const candidateY = currY + deltaY
		if (isFootBoxWalkable(map, nextX, candidateY)) {
			nextY = candidateY
		} else {
			collided = true
			const step = Math.sign(deltaY) * 2
			let probe = currY
			const maxSteps = Math.min(24, Math.floor(Math.abs(deltaY) / 2))
			for (let i = 0; i < maxSteps; i++) {
				if (isFootBoxWalkable(map, nextX, probe + step)) {
					probe += step
				} else {
					break
				}
			}
			nextY = probe
		}
	}

	return { x: nextX, y: nextY, collided }
}

export function snapToNearestWalkableTile(
	map: MapTemplate,
	targetTileX: number,
	targetTileY: number
): { tileX: number; tileY: number } {
	const clampedX = Math.max(1, Math.min(map.widthTiles - 2, targetTileX))
	const clampedY = Math.max(1, Math.min(map.heightTiles - 2, targetTileY))
	if (isTileWalkable(map, clampedX, clampedY)) {
		return { tileX: clampedX, tileY: clampedY }
	}

	const queue: Array<[number, number]> = [[clampedX, clampedY]]
	const visited = new Set<string>([`${clampedX},${clampedY}`])
	const dirs: Array<[number, number]> = [
		[0, 1],
		[0, -1],
		[1, 0],
		[-1, 0],
		[1, 1],
		[-1, 1],
		[1, -1],
		[-1, -1]
	]

	while (queue.length > 0) {
		const [cx, cy] = queue.shift()!
		if (isTileWalkable(map, cx, cy)) {
			return { tileX: cx, tileY: cy }
		}
		for (const [dx, dy] of dirs) {
			const nx = cx + dx
			const ny = cy + dy
			const key = `${nx},${ny}`
			if (
				nx >= 1 &&
				ny >= 1 &&
				nx < map.widthTiles - 1 &&
				ny < map.heightTiles - 1 &&
				!visited.has(key)
			) {
				visited.add(key)
				queue.push([nx, ny])
			}
		}
	}

	return map.playerSpawn
}

export function findTilePathBFS(
	map: MapTemplate,
	startWorldX: number,
	startWorldY: number,
	goalWorldX: number,
	goalWorldY: number
): Array<{ x: number; y: number }> {
	const tilePx = map.tileSizePx * map.renderScale
	const rawStartX = Math.floor(startWorldX / tilePx)
	const rawStartY = Math.floor(startWorldY / tilePx)
	const rawGoalX = Math.floor(goalWorldX / tilePx)
	const rawGoalY = Math.floor(goalWorldY / tilePx)

	const start = snapToNearestWalkableTile(map, rawStartX, rawStartY)
	const goal = snapToNearestWalkableTile(map, rawGoalX, rawGoalY)

	if (start.tileX === goal.tileX && start.tileY === goal.tileY) {
		const finalX = goal.tileX * tilePx + tilePx / 2
		const finalY = goal.tileY * tilePx + tilePx / 2
		return [{ x: finalX, y: finalY }]
	}

	const startKey = `${start.tileX},${start.tileY}`
	const goalKey = `${goal.tileX},${goal.tileY}`
	const queue: Array<[number, number]> = [[start.tileX, start.tileY]]
	const parentMap = new Map<string, string | null>([[startKey, null]])

	const dirs: Array<[number, number]> = [
		[0, 1],
		[0, -1],
		[1, 0],
		[-1, 0]
	]

	let found = false
	while (queue.length > 0) {
		const [cx, cy] = queue.shift()!
		const cKey = `${cx},${cy}`
		if (cKey === goalKey) {
			found = true
			break
		}
		for (const [dx, dy] of dirs) {
			const nx = cx + dx
			const ny = cy + dy
			const nKey = `${nx},${ny}`
			if (!parentMap.has(nKey) && isTileWalkable(map, nx, ny)) {
				parentMap.set(nKey, cKey)
				queue.push([nx, ny])
			}
		}
	}

	if (!found) {
		return []
	}

	const waypoints: Array<{ x: number; y: number }> = []
	let curr: string | null = goalKey
	while (curr && curr !== startKey) {
		const [txStr, tyStr] = curr.split(',')
		const tx = Number(txStr)
		const ty = Number(tyStr)
		waypoints.push({
			x: tx * tilePx + tilePx / 2,
			y: ty * tilePx + tilePx / 2
		})
		curr = parentMap.get(curr) || null
	}

	waypoints.reverse()
	return waypoints
}
