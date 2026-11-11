import { listGameSessions } from '../../utils/store'

/** Riwayat sesi live: guru melihat sesinya sendiri, admin melihat semua. */
export default defineEventHandler(async (event) => {
	const current = await requireUser(event, ['teacher', 'admin'])
	return { sessions: await listGameSessions(50, current.role === 'admin' ? undefined : current.id) }
})
