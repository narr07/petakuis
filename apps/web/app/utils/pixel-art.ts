/**
 * Gambar piksel kecil untuk dekorasi landing page, ditulis sebagai baris karakter.
 * Setiap karakter adalah satu piksel; '.' berarti transparan. Warna diambil dari palet.
 */
export interface PixelSprite {
	rows: string[]
	palette: Record<string, string>
}

const GOLD = { k: '#713f12', y: '#facc15', l: '#fef9c3', o: '#ca8a04' }

export const PIXEL_SPRITES = {
	coin: {
		palette: GOLD,
		rows: [
			'..kkkkkk..',
			'.kyyyyyyk.',
			'kyllyyyyok',
			'kylyyoyyok',
			'kyyyyoyyok',
			'kyyyyoyyok',
			'kyyyyoyyok',
			'kyyyyyyook',
			'.kyooooook',
			'..kkkkkk..'
		]
	},
	heart: {
		palette: { k: '#450a0a', w: '#fecaca', r: '#ef4444', d: '#991b1b' },
		rows: [
			'.kk...kk.',
			'kwrk.krrk',
			'kwrrkrrdk',
			'krrrrrrdk',
			'.krrrrdk.',
			'..krrdk..',
			'...kdk...',
			'....k....'
		]
	},
	sparkle: {
		palette: { w: '#ffffff', y: '#fde047' },
		rows: [
			'...w...',
			'...y...',
			'..yyy..',
			'wyywyyw',
			'..yyy..',
			'...y...',
			'...w...'
		]
	},
	cloud: {
		palette: { w: '#ffffff', s: '#dbeafe' },
		rows: [
			'......wwww......',
			'....wwwwwwww....',
			'..wwwwwwwwwwwww.',
			'.wwwwwwwwwwwwwww',
			'wwwwwwwwwwwwwwww',
			'wsswwwwsswwwwssw',
			'.ssssssssssssss.'
		]
	},
	flag: {
		palette: { k: '#3f3f46', f: '#ef4444', d: '#b91c1c', w: '#ffffff' },
		rows: [
			'kk........',
			'kffffff...',
			'kffwfffff.',
			'kfwwwffffd',
			'kffwffffd.',
			'kffffffdd.',
			'kdddd.....',
			'k.........',
			'k.........',
			'k.........',
			'k.........',
			'k.........',
			'k.........',
			'kkk.......'
		]
	},
	bubble: {
		palette: { k: '#18181b', w: '#ffffff', r: '#f59e0b' },
		rows: [
			'.kkkkkkkk.',
			'kwwwwwwwwk',
			'kwwwrrwwwk',
			'kwwwrrwwwk',
			'kwwwrrwwwk',
			'kwwwrrwwwk',
			'kwwwwwwwwk',
			'kwwwrrwwwk',
			'kwwwwwwwwk',
			'.kkkkwkkk.',
			'....kk....'
		]
	},
	chestClosed: {
		palette: { k: '#3b2412', b: '#a16207', B: '#713f12', g: '#facc15', G: '#ca8a04' },
		rows: [
			'..kkkkkkkkkkkk..',
			'.kbbbbbbbbbbbbk.',
			'kbbbbbbbbbbbbbbk',
			'kBBBBBBBBBBBBBBk',
			'kggggggkkggggggk',
			'kGGGGGkggkGGGGGk',
			'kbbbbbkgGkbbbbbk',
			'kbbbbbbkkbbbbbbk',
			'kbbbbbbbbbbbbbbk',
			'kggbbbbbbbbbbggk',
			'kBBBBBBBBBBBBBBk',
			'kGGBBBBBBBBBBGGk',
			'.kkkkkkkkkkkkkk.'
		]
	},
	chestOpen: {
		palette: { k: '#3b2412', b: '#a16207', B: '#713f12', g: '#facc15', G: '#ca8a04', y: '#fef08a' },
		rows: [
			'..kkkkkkkkkkkk..',
			'.kBBBBBBBBBBBBk.',
			'kBBBBBBBBBBBBBBk',
			'kbbbbbbbbbbbbbbk',
			'kggggggggggggggk',
			'kyyyyyyyyyyyyyyk',
			'kyygyyyygyyygyyk',
			'kbbbbbbkkbbbbbbk',
			'kbbbbbkgGkbbbbbk',
			'kggbbbbkkbbbbggk',
			'kBBBBBBBBBBBBBBk',
			'kGGBBBBBBBBBBGGk',
			'.kkkkkkkkkkkkkk.'
		]
	},
	grassTile: {
		palette: { g: '#62c64f', G: '#4fae3e', l: '#8ee06f' },
		rows: [
			'gggggggggggggggg',
			'ggggggGggggggggg',
			'gggggGlGgggggggg',
			'gggggggggggggggg',
			'gggggggggggggGgg',
			'ggGggggggggggggg',
			'gGlGgggggggggggg',
			'gggggggggggGgggg',
			'ggggggggggGlGggg',
			'gggggggggggggggg',
			'gggggggGgggggggg',
			'ggggggGlGggggggg',
			'gggggggggggggggg',
			'gggggggggggggGgg',
			'gGgggggggggggggg',
			'gggggggggggggggg'
		]
	},
	dirtTile: {
		palette: { d: '#d29468', D: '#b8774d', s: '#e4ad83' },
		rows: [
			'dddddddddddddddd',
			'ddddDddddddddddd',
			'dddddddddddsdddd',
			'dddddddddddddddd',
			'ddsdddddddddddDd',
			'dddddddddddddddd',
			'dddddddDdddddddd',
			'dddddddddddddddd',
			'ddddddddddddsddd',
			'dDdddddddddddddd',
			'dddddddddddddddd',
			'dddddsdddddddddd',
			'dddddddddddddDdd',
			'dddddddddddddddd',
			'ddDddddddsdddddd',
			'dddddddddddddddd'
		]
	}
} satisfies Record<string, PixelSprite>

export type PixelSpriteName = keyof typeof PIXEL_SPRITES

/** Persegi panjang per baris (piksel bertetangga yang sewarna digabung supaya SVG ringan). */
export function pixelRects(sprite: PixelSprite): Array<{ x: number, y: number, w: number, fill: string }> {
	const rects: Array<{ x: number, y: number, w: number, fill: string }> = []
	sprite.rows.forEach((row, y) => {
		let x = 0
		while (x < row.length) {
			const ch = row[x]!
			const fill = sprite.palette[ch as keyof typeof sprite.palette]
			if (!fill) {
				x++
				continue
			}
			let w = 1
			while (row[x + w] === ch) w++
			rects.push({ x, y, w, fill })
			x += w
		}
	})
	return rects
}

export function pixelSize(sprite: PixelSprite): { w: number, h: number } {
	return { w: Math.max(...sprite.rows.map(r => r.length)), h: sprite.rows.length }
}

/** Data URI SVG untuk dipakai sebagai background-image (misalnya ubin tanah 16x16). */
export function pixelDataUri(name: PixelSpriteName): string {
	const sprite = PIXEL_SPRITES[name]
	const { w, h } = pixelSize(sprite)
	const body = pixelRects(sprite)
		.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="1" fill="${r.fill}"/>`)
		.join('')
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
