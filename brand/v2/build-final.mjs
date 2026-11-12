// Logo final Petakuis: huruf P dari 9 petak peta (3 kolom x 4 baris), satu warna.
import { writeFileSync } from 'node:fs'
const BLUE = '#2563EB'
const CELLS = [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3]]
function tiles(t, g, box = 256, ox = 0, oy = 0) {
	const p = t + g, x0 = ox + (box - (3 * p - g)) / 2, y0 = oy + (box - (4 * p - g)) / 2
	return CELLS.map(([c, r]) => `<rect x="${x0 + c * p}" y="${y0 + r * p}" width="${t}" height="${t}"/>`).join('')
}
const svg = (title, body, vb = '0 0 256 256') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><title>${title}</title>${body}</svg>\n`
// Master: petak 48, celah 14 (perbandingan sama dengan konsep terpilih 40:12).
writeFileSync('petakuis-symbol.svg', svg('Petakuis', `<g fill="${BLUE}">${tiles(48, 14)}</g>`))
// Ukuran kecil (favicon): celah dirapatkan agar petak tidak menyatu di 16 px.
writeFileSync('petakuis-symbol-small.svg', svg('Petakuis', `<g fill="${BLUE}">${tiles(52, 10)}</g>`))
// Ubin persegi (avatar, ikon): P putih di atas biru, sudut tegas mengikuti tampilan situs.
writeFileSync('petakuis-tile.svg', svg('Petakuis', `<rect width="256" height="256" fill="${BLUE}"/><g fill="#fff">${tiles(38, 11)}</g>`))
console.log('ok')
