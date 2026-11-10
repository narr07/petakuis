import { createConsola } from 'consola'

export interface StructuredLogEntry {
	id: string
	timestamp: string
	service: 'web' | 'game-server'
	level: 'info' | 'success' | 'warn' | 'error'
	tag: string
	message: string
	meta?: Record<string, unknown>
}

const MAX_LOG_BUFFER = 200
const logBuffer: StructuredLogEntry[] = []

export const webLogger = createConsola({
	level: 4
}).withTag('petakuis:web')

export function recordWebLog(
	level: StructuredLogEntry['level'],
	tag: string,
	message: string,
	meta?: Record<string, unknown>
) {
	const entry: StructuredLogEntry = {
		id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
		timestamp: new Date().toISOString(),
		service: 'web',
		level,
		tag,
		message,
		meta
	}

	logBuffer.unshift(entry)
	if (logBuffer.length > MAX_LOG_BUFFER) {
		logBuffer.length = MAX_LOG_BUFFER
	}

	const loggerWithTag = webLogger.withTag(tag)
	if (meta) {
		loggerWithTag[level](message, meta)
	} else {
		loggerWithTag[level](message)
	}
}

export function getWebLogs(): StructuredLogEntry[] {
	return logBuffer
}
