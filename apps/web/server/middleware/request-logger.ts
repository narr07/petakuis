import { recordWebLog } from '../utils/logger'

/**
 * Path yang aman dicatat: tanpa query string (token verifikasi email, kode OAuth) dan tanpa
 * token di path reset kata sandi (`/api/auth/reset-password/<token>`).
 */
function safePath(rawPath: string): string {
	const path = rawPath.split('?')[0] || ''
	return path.replace(/^(\/api\/auth\/reset-password)\/.+$/, '$1/[token]')
}

export default defineEventHandler((event) => {
	const path = safePath(event.path || '')
	if (!path.startsWith('/api/') || path === '/api/logs') {
		return
	}

	const start = performance.now()
	const method = event.method

	event.node.res.on('finish', () => {
		const durationMs = Math.round((performance.now() - start) * 10) / 10
		const statusCode = event.node.res.statusCode
		recordWebLog(
			statusCode >= 400 ? 'warn' : 'info',
			'http',
			`${method} ${path} -> ${statusCode} (${durationMs}ms)`,
			{ method, path, statusCode, durationMs }
		)
	})
})
