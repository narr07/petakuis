import { timingSafeEqual } from 'node:crypto'
import type { SessionReportData } from '@petakuis/shared'
import { saveSessionReport } from '../../../../utils/store'

/**
 * Dipanggil game server saat sesi berakhir untuk menyimpan laporan akhir.
 * Hanya menerima permintaan yang membawa INTERNAL_SECRET.
 */
export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const secret = getHeader(event, 'x-internal-secret') || ''
	const expected = Buffer.from(config.internalSecret)
	const given = Buffer.from(secret)
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
		throw createError({ statusCode: 401, statusMessage: 'Tidak diizinkan' })
	}

	const code = getRouterParam(event, 'code') || ''
	const report = await readBody<SessionReportData>(event)
	if (!report || report.code !== code || !Array.isArray(report.players)) {
		throw createError({ statusCode: 400, statusMessage: 'Laporan tidak valid' })
	}

	const saved = await saveSessionReport(code, report)
	recordWebLog(saved ? 'success' : 'warn', 'sessions', saved
		? `Laporan sesi ${code} tersimpan (${report.totalPlayers} siswa)`
		: `Laporan sesi ${code} diterima tetapi tidak ada sesi aktif yang cocok`)
	return { ok: true, saved }
})
