import { isDemoRoomCode, type SessionReportData } from '@petakuis/shared'
import { getLatestSessionByCode } from '../../../utils/store'

/**
 * Laporan sesi: diambil langsung dari game server selama room masih ada; setelah room
 * hilang (server restart atau dibersihkan), diambil dari laporan yang tersimpan di database.
 *
 * Laporan berisi nama panggilan dan jawaban siswa, jadi hanya untuk guru pemilik sesi dan
 * admin. Room demo (tanpa pemilik, tidak disimpan) boleh dilihat guru mana pun. Selain itu
 * dibalas 404 seperti PIN yang tidak ada, dan dihitung sebagai PIN salah agar PIN orang lain
 * tidak bisa ditebak beruntun.
 */
export default defineEventHandler(async (event) => {
	const current = await requireUser(event, ['teacher', 'admin'])
	const config = useRuntimeConfig()
	const code = getRouterParam(event, 'code') || ''

	assertPinAttemptAllowed(event)

	const notFound = () => {
		recordPinFailure(event)
		return createError({
			statusCode: 404,
			statusMessage: 'Laporan sesi tidak ditemukan.'
		})
	}

	if (!/^\d{6}$/.test(code)) throw notFound()

	const session = await getLatestSessionByCode(code)
	const allowed = session
		? current.role === 'admin' || (session.ownerId !== null && session.ownerId === current.id)
		: isDemoRoomCode(code)
	if (!allowed) throw notFound()

	try {
		const resp = await fetch(
			`${config.gameServerInternalUrl}/rooms/${encodeURIComponent(code)}/report`
		)
		if (resp.ok) {
			return (await resp.json()) as SessionReportData
		}
	} catch {
		// Game server mati: lanjut ke laporan tersimpan.
	}

	if (session?.report) {
		return session.report
	}

	throw createError({
		statusCode: 404,
		statusMessage: 'Laporan sesi tidak ditemukan.'
	})
})
