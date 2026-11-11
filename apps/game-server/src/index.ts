import { randomUUID, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import {
	STARTER_QUIZZES,
	type AnswerSubmitPayload,
	type Direction,
	type HostControlPayload,
	type JoinRoomPayload,
	type QuizDefinition,
	type SessionReportData
} from '@petakuis/shared'
import { Server } from 'socket.io'
import { getGameLogs, logGameEvent } from './logger'
import { QuizRoom } from './rooms/QuizRoom'

const PORT = Number(process.env.PORT || 3001)
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const DEV_INTERNAL_SECRET = 'petakuis_internal_secret'
/** Alamat web dari sisi game server, untuk mengirim laporan sesi yang berakhir. */
const WEB_INTERNAL_URL = process.env.WEB_INTERNAL_URL || 'http://localhost:3000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || DEV_INTERNAL_SECRET
/** Asal web yang boleh membuka koneksi Socket.IO, dipisah koma. */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
	.split(',')
	.map(o => o.trim())
	.filter(Boolean)

if (IS_PRODUCTION && INTERNAL_SECRET === DEV_INTERNAL_SECRET) {
	// Rahasia bawaan ada di repo publik; di produksi siapa pun bisa membuat room tanpa lewat web.
	throw new Error('INTERNAL_SECRET wajib diisi dengan nilai acak di produksi.')
}

const rooms = new Map<string, QuizRoom>()

/** Mengirim laporan akhir ke web untuk disimpan di database; dicoba ulang sampai 3 kali. */
async function persistReport(report: SessionReportData): Promise<void> {
	const url = `${WEB_INTERNAL_URL}/api/internal/sessions/${encodeURIComponent(report.code)}/results`
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const resp = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET },
				body: JSON.stringify(report)
			})
			if (resp.ok) {
				logGameEvent('success', `room:${report.code}`, 'Laporan sesi tersimpan di web')
				return
			}
			logGameEvent('warn', `room:${report.code}`, `Web menolak laporan (status ${resp.status})`)
			if (resp.status < 500) return
		} catch (err) {
			logGameEvent('warn', `room:${report.code}`, `Gagal mengirim laporan (percobaan ${attempt}): ${String(err)}`)
		}
		await new Promise(r => setTimeout(r, attempt * 2000))
	}
}

function hasInternalSecret(header: string | string[] | undefined): boolean {
	if (typeof header !== 'string') return false
	const a = Buffer.from(header)
	const b = Buffer.from(INTERNAL_SECRET)
	return a.length === b.length && timingSafeEqual(a, b)
}

function seedDemoRooms(): void {
	const demoConfigs: Array<{ code: string; mapId: string }> = [
		{ code: '123456', mapId: 'map-pesisir-karang' },
		{ code: '222222', mapId: 'map-desa-sunnyside' },
		{ code: '333333', mapId: 'map-kampus-modern' },
		{ code: '555555', mapId: 'map-dataran-angin' },
		{ code: '666666', mapId: 'map-kota-pasar' }
	]
	for (const cfg of demoConfigs) {
		if (!rooms.has(cfg.code)) {
			const baseQuiz = STARTER_QUIZZES[0]!
			const roomQuiz: QuizDefinition = {
				...baseQuiz,
				mapId: cfg.mapId
			}
			// Token acak yang tidak pernah dibagikan: layar host room demo hanya bisa memantau.
			const room = new QuizRoom(io, cfg.code, roomQuiz, randomUUID(), true)
			room.status = 'active'
			room.startedAt = new Date().toISOString()
			rooms.set(cfg.code, room)
		}
	}
}

// Endpoint HTTP hanya dipanggil server web (antarserver), jadi tidak perlu header CORS.
const httpServer = createServer(async (req, res) => {
	const url = new URL(req.url || '/', `http://localhost:${PORT}`)

	if (req.method === 'GET' && url.pathname === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json' })
		res.end(
			JSON.stringify({
				ok: true,
				activeRooms: rooms.size,
				timestamp: new Date().toISOString()
			})
		)
		return
	}

	if (req.method === 'GET' && url.pathname === '/logs') {
		res.writeHead(200, { 'Content-Type': 'application/json' })
		res.end(
			JSON.stringify({
				ok: true,
				logs: getGameLogs()
			})
		)
		return
	}

	if (req.method === 'POST' && url.pathname === '/rooms') {
		if (!hasInternalSecret(req.headers['x-internal-secret'])) {
			res.writeHead(401, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ ok: false, error: 'Tidak diizinkan' }))
			return
		}
		let body = ''
		for await (const chunk of req) {
			body += chunk
		}
		try {
			const parsed = JSON.parse(body) as {
				code: string
				quiz: QuizDefinition
				hostToken: string
				autoStart?: boolean
			}
			if (!/^\d{6}$/.test(String(parsed.code)) || typeof parsed.hostToken !== 'string' || parsed.hostToken.length < 16) {
				res.writeHead(400, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ ok: false, error: 'Kode atau token host tidak valid' }))
				return
			}
			// Kode yang sedang dipakai tidak boleh ditimpa; web akan mencoba kode lain.
			if (rooms.has(parsed.code)) {
				res.writeHead(409, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ ok: false, error: 'Kode sudah dipakai' }))
				return
			}
			const room = new QuizRoom(io, parsed.code, parsed.quiz, parsed.hostToken)
			room.onEnd = (report) => {
				void persistReport(report)
			}
			if (parsed.autoStart) {
				room.status = 'active'
				room.startedAt = new Date().toISOString()
			}
			rooms.set(parsed.code, room)

			res.writeHead(201, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ ok: true, code: parsed.code }))
		} catch (err) {
			res.writeHead(400, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ ok: false, error: String(err) }))
		}
		return
	}

	if (req.method === 'GET' && url.pathname.startsWith('/rooms/')) {
		const parts = url.pathname.split('/').filter(Boolean)
		const code = parts[1] || ''
		const sub = parts[2] || ''
		const room = rooms.get(code)

		if (!room) {
			res.writeHead(404, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ ok: false, error: 'Kode sesi tidak ditemukan' }))
			return
		}

		if (sub === 'report') {
			res.writeHead(200, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify(room.getReportData()))
			return
		}

		res.writeHead(200, { 'Content-Type': 'application/json' })
		res.end(
			JSON.stringify({
				ok: true,
				code: room.code,
				status: room.status,
				quizTitle: room.quiz.title,
				subject: room.quiz.subject,
				schoolLevel: room.quiz.schoolLevel,
				gradeLabel: room.quiz.gradeLabel,
				mode: room.quiz.mode,
				mapName: room.mapConfig.name,
				totalQuestions: room.quiz.questions.length,
				playerCount: room.getLeaderboard().length
			})
		)
		return
	}

	res.writeHead(404, { 'Content-Type': 'application/json' })
	res.end(JSON.stringify({ error: 'Not Found' }))
})

const io = new Server(httpServer, {
	cors: {
		origin: ALLOWED_ORIGINS,
		methods: ['GET', 'POST']
	},
	transports: ['websocket', 'polling']
})

io.on('connection', (socket) => {
	let activeRoomCode: string | null = null

	socket.on('join', (payload: JoinRoomPayload) => {
		const code = String(payload?.code || '').trim()
		const room = rooms.get(code)
		if (!room) {
			socket.emit('room:error', {
				message: `Kode ruangan "${code}" tidak ditemukan. Pastikan kode 6 digit benar.`
			})
			return
		}
		activeRoomCode = code
		room.handleJoin(socket, payload)
	})

	socket.on('move', (tuple: [number, number, Direction]) => {
		if (!activeRoomCode) return
		const room = rooms.get(activeRoomCode)
		room?.handleMove(socket, tuple)
	})

	socket.on('question:open', (data: { objectId: string }) => {
		if (!activeRoomCode) return
		const room = rooms.get(activeRoomCode)
		room?.handleQuestionOpen(socket, data)
	})

	socket.on('answer:submit', (payload: AnswerSubmitPayload) => {
		if (!activeRoomCode) return
		const room = rooms.get(activeRoomCode)
		room?.handleAnswerSubmit(socket, payload)
	})

	socket.on('accessible:toggle', (data: { enabled: boolean }) => {
		if (!activeRoomCode) return
		const room = rooms.get(activeRoomCode)
		room?.handleToggleAccessibleMode(socket, Boolean(data?.enabled))
	})

	socket.on('host:control', (payload: HostControlPayload) => {
		if (!activeRoomCode) return
		const room = rooms.get(activeRoomCode)
		room?.handleHostControl(socket, payload)
	})

	socket.on('map:change', (data: { mapId: string }) => {
		if (!activeRoomCode || !data?.mapId) return
		const room = rooms.get(activeRoomCode)
		room?.handleMapChange(socket, String(data.mapId))
	})

	socket.on('disconnect', () => {
		if (!activeRoomCode) return
		const room = rooms.get(activeRoomCode)
		room?.handleDisconnect(socket)
	})
})

seedDemoRooms()

httpServer.listen(PORT, () => {
	logGameEvent('success', 'boot', `Realtime server listening on http://localhost:${PORT}`)
	logGameEvent('info', 'seed', 'Demo active room ready with PIN: 123456')
})
