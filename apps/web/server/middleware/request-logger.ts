import { recordWebLog } from '../utils/logger'

export default defineEventHandler((event) => {
	const path = event.path || ''
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
