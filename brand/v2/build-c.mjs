// Arah terpilih: P dari petak, tanpa titik, celah antarpetak diperbesar (petak 40, celah 12).
import { writeFileSync } from 'node:fs'
const T = 40, G = 12, PITCH = T + G
const P = rows => [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], ...Array.from({ length: rows - 3 }, (_, i) => [0, 3 + i])]
const tiles = (cells, rows) => {
	const x0 = (256 - (3 * PITCH - G)) / 2, y0 = (256 - (rows * PITCH - G)) / 2
	return cells.map(([c, r]) => `<rect x="${x0 + c * PITCH}" y="${y0 + r * PITCH}" width="${T}" height="${T}"/>`).join('')
}
for (const [k, rows] of [['c1', 4], ['c2', 5]]) {
	const g = tiles(P(rows), rows)
	writeFileSync(`alt-${k}-symbol.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Petakuis ${k}</title><g fill="#000">${g}</g></svg>\n`)
	writeFileSync(`alt-${k}-lockup.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 256"><title>Petakuis ${k} lockup</title><g fill="#000">${g}<text x="290" y="178" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="150" letter-spacing="-4">Petakuis</text></g></svg>\n`)
}
console.log('ok')
