// Alternatif arah B (huruf P dari petak peta). Hitam dulu.
import { writeFileSync } from 'node:fs'

const tiles = (cells, x0, y0 = 10) => cells
	.map(([c, r]) => `<rect x="${x0 + c * 48}" y="${y0 + r * 48}" width="44" height="44"/>`)
	.join('')
const diamond = (cx, cy, r) => `<path d="M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z"/>`

const P3 = [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [0, 4]]
const P4 = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [0, 4]]

const marks = {
	// B1: asli, titik bulat sebagai pos soal
	b1: `${tiles(P3, 58)}<circle cx="128" cy="80" r="15"/>`,
	// B2: pos soal berbentuk wajik (penanda di peta game)
	b2: `${tiles(P3, 58)}${diamond(128, 80, 19)}`,
	// B3: petak terbawah lepas menjadi titik, sehingga P juga terbaca sebagai tanda tanya
	b3: `${tiles(P3.slice(0, 9), 58)}<circle cx="80" cy="224" r="22"/>`,
	// B4: P lebih lebar (4 kolom), wajik di lubang yang lapang
	b4: `${tiles(P4, 34)}${diamond(128, 80, 19)}`
}

for (const [k, g] of Object.entries(marks)) {
	writeFileSync(`alt-${k}-symbol.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Petakuis alternatif ${k}</title><g fill="#000">${g}</g></svg>\n`)
	writeFileSync(`alt-${k}-lockup.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 256"><title>Petakuis alternatif ${k} lockup</title><g fill="#000">${g}<text x="290" y="178" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="150" letter-spacing="-4">Petakuis</text></g></svg>\n`)
}
console.log('ok')
