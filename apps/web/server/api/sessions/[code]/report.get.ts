import type { SessionReportData } from '@petakuis/shared'
import { getSavedReport } from '../../../utils/store'

/**
 * Laporan sesi: diambil langsung dari game server selama room masih ada; setelah room
 * hilang (server restart atau dibersihkan), diambil dari laporan yang tersimpan di database.
 */
export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const code = getRouterParam(event, 'code') || ''

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

	const saved = await getSavedReport(code)
	if (saved) {
		return saved
	}

	throw createError({
		statusCode: 404,
		statusMessage: 'Laporan sesi tidak ditemukan.'
	})
})
