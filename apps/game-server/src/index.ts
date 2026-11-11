import { createServer } from 'node:http'
import {
	STARTER_QUIZZES,
	type AnswerSubmitPayload,
	type Direction,
	type HostControlPayload,
	type JoinRoomPayload,
	type QuizDefinition
} from '@petakuis/shared'
import { Server } from 'socket.io'
import { getGameLogs, logGameEvent } from './logger'
import { QuizRoom } from './rooms/QuizRoom'

const PORT = Number(process.env.PORT || 3001)
const rooms = new Map<string, QuizRoom>()

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
			const room = new QuizRoom(io, cfg.code, roomQuiz, 'demo-host-token')
			room.status = 'active'
			room.startedAt = new Date().toISOString()
			rooms.set(cfg.code, room)
		}
	}
}

const httpServer = createServer(async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

	if (req.method === 'OPTIONS') {
		res.writeHead(204)
		res.end()
		return
	}

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
			const existing = rooms.get(parsed.code)
			if (existing) {
				existing.destroy()
			}
			const room = new QuizRoom(io, parsed.code, parsed.quiz, parsed.hostToken)
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
		origin: '*',
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
		room?.handleMapChange(String(data.mapId))
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
