/**
 * Uji beban game server: N bot Socket.IO masuk ke satu room lalu berjalan acak.
 *
 *   bun scripts/load-test.ts --url http://localhost:3001 --code 555555 --bots 200 --seconds 60
 *
 * Mengukur keberhasilan join, waktu join, latensi update posisi (`state`, selisih waktu server
 * dan waktu terima; akurat bila bot dan server di mesin yang sama), dan laju update per bot.
 * Jalankan terhadap server lokal/staging, bukan produksi yang dipakai kelas.
 */
import { io, type Socket } from 'socket.io-client'

function arg(name: string, fallback: string): string {
	const i = process.argv.indexOf(`--${name}`)
	return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback
}

const URL = arg('url', 'http://localhost:3001')
const CODE = arg('code', '555555')
const BOTS = Number(arg('bots', '200'))
const SECONDS = Number(arg('seconds', '60'))
const MOVE_INTERVAL_MS = 200
const STEP_PX = 30

interface Bot {
	socket: Socket
	joinedAt?: number
	joinMs?: number
	x: number
	y: number
	states: number
	latencies: number[]
	errors: string[]
}

const percentile = (values: number[], p: number) => {
	if (!values.length) return 0
	const sorted = [...values].sort((a, b) => a - b)
	return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!
}

const bots: Bot[] = []
const started = Date.now()
const dirs = ['up', 'down', 'left', 'right'] as const

console.log(`Uji beban: ${BOTS} bot -> ${URL} room ${CODE}, ${SECONDS} detik`)

for (let i = 0; i < BOTS; i++) {
	const socket = io(URL, { transports: ['websocket'], forceNew: true, reconnection: false })
	const bot: Bot = { socket, x: 0, y: 0, states: 0, latencies: [], errors: [] }
	bots.push(bot)
	const t0 = Date.now()

	socket.on('connect', () => {
		socket.emit('join', { code: CODE, nickname: `Bot ${i + 1}`, colorway: 'merah-putih' })
	})
	socket.on('joined', (res: { spawnX: number, spawnY: number }) => {
		bot.joinedAt = Date.now()
		bot.joinMs = bot.joinedAt - t0
		bot.x = res.spawnX
		bot.y = res.spawnY
	})
	socket.on('state', (st: { t: number }) => {
		bot.states++
		bot.latencies.push(Date.now() - st.t)
	})
	socket.on('room:error', (e: { message: string }) => bot.errors.push(e.message))
	socket.on('connect_error', (e: Error) => bot.errors.push(`connect_error: ${e.message}`))

	// Masuk bertahap (seperti satu kelas yang memindai QR dalam beberapa detik).
	await new Promise(r => setTimeout(r, 15))
}

// Jalan acak.
let tick = 0
const mover = setInterval(() => {
	tick++
	for (const bot of bots) {
		if (!bot.joinedAt) continue
		const dir = dirs[(tick + bot.x) % 4 | 0] ?? 'down'
		const dx = dir === 'left' ? -STEP_PX : dir === 'right' ? STEP_PX : 0
		const dy = dir === 'up' ? -STEP_PX : dir === 'down' ? STEP_PX : 0
		bot.x += dx
		bot.y += dy
		bot.socket.emit('move', [bot.x, bot.y, dir])
	}
}, MOVE_INTERVAL_MS)

await new Promise(r => setTimeout(r, SECONDS * 1000))
clearInterval(mover)

const elapsedS = (Date.now() - started) / 1000
const joined = bots.filter(b => b.joinedAt)
const joinTimes = joined.map(b => b.joinMs!)
const latencies = joined.flatMap(b => b.latencies.slice(Math.floor(b.latencies.length * 0.1)))
const rates = joined.map(b => b.states / ((Date.now() - b.joinedAt!) / 1000))
const errors = bots.flatMap(b => b.errors)

console.log(`\nSelesai setelah ${elapsedS.toFixed(0)} detik`)
console.log(`Join berhasil      : ${joined.length}/${BOTS}`)
console.log(`Waktu join (ms)    : p50 ${percentile(joinTimes, 50)} · p95 ${percentile(joinTimes, 95)} · maks ${Math.max(0, ...joinTimes)}`)
console.log(`Latensi state (ms) : p50 ${percentile(latencies, 50)} · p95 ${percentile(latencies, 95)} · p99 ${percentile(latencies, 99)} · maks ${Math.max(0, ...latencies)}`)
console.log(`Update per bot/dtk : p5 ${percentile(rates, 5).toFixed(1)} · p50 ${percentile(rates, 50).toFixed(1)} (target 15)`)
console.log(`Error              : ${errors.length}${errors.length ? ` (contoh: ${[...new Set(errors)].slice(0, 3).join(' | ')})` : ''}`)

for (const bot of bots) bot.socket.close()
process.exit(0)
