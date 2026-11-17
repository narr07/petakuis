import { sql } from 'drizzle-orm'

/**
 * Status layanan untuk pemantau (GitHub Actions) dan halaman offline: web, database, dan game
 * server. 200 bila semua sehat, 503 bila ada yang mati. Tidak memuat data pengguna.
 */
export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const checks = { web: true, database: false, gameServer: false }

	try {
		const db = await useDb()
		await db.run(sql`select 1`)
		checks.database = true
	} catch {
		// Tetap false.
	}

	try {
		const resp = await fetch(`${config.gameServerInternalUrl}/health`, { signal: AbortSignal.timeout(3000) })
		checks.gameServer = resp.ok
	} catch {
		// Tetap false.
	}

	const ok = checks.database && checks.gameServer
	setResponseStatus(event, ok ? 200 : 503)
	setHeader(event, 'Cache-Control', 'no-store')
	return { ok, ...checks, timestamp: new Date().toISOString() }
})
