import { listGameSessions } from '../../utils/store'

/** Riwayat sesi live terbaru (sementara untuk semua guru, sampai login guru aktif). */
export default defineEventHandler(async () => {
	return { sessions: await listGameSessions(50) }
})
