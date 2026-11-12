// Menulis tiga konsep logo Petakuis (hitam dulu) sebagai SVG simbol + lockup sementara.
import { writeFileSync } from 'node:fs'

const petak = [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [0, 4]]
	.map(([c, r]) => `<rect x="${58 + c * 48}" y="${10 + r * 48}" width="44" height="44"/>`)
	.join('')

const marks = {
	// A: cincin 3/4 + batang meruncing (tanda tanya = pin peta) + titik lokasi
	a: '<path fill-rule="evenodd" d="M64 96A64 64 0 1 1 128 160L128 124A28 28 0 1 0 100 96Z"/><path d="M110 124H146V176L128 207.2L110 176Z"/><circle cx="128" cy="232" r="16"/>',
	// B: huruf P dari petak peta, titik pos soal di lubang P
	b: `${petak}<circle cx="128" cy="80" r="15"/>`,
	// C: kepala rubah Kuispi berbentuk penanda lokasi
	c: '<path fill-rule="evenodd" d="M44 28L96 80H160L212 28V128L128 236L44 128ZM96 114A14 14 0 1 0 96 142A14 14 0 1 0 96 114ZM160 114A14 14 0 1 0 160 142A14 14 0 1 0 160 114Z"/>'
}

for (const [k, g] of Object.entries(marks)) {
	writeFileSync(`concept-${k}-symbol.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Petakuis konsep ${k}</title><g fill="#000">${g}</g></svg>\n`)
	// Teks masih <text> (sementara, untuk eksplorasi); wordmark final akan digambar sebagai path.
	writeFileSync(`concept-${k}-lockup.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 256"><title>Petakuis konsep ${k} lockup</title><g fill="#000">${g}<text x="290" y="178" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="150" letter-spacing="-4">Petakuis</text></g></svg>\n`)
}
console.log('ok')
