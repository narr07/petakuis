import { createConsola } from 'consola'

export interface GameLogEntry {
	id: string
	timestamp: string
	service: 'game-server'
	level: 'info' | 'success' | 'warn' | 'error'
	tag: string
	message: string
	meta?: Record<string, unknown>
}

const MAX_LOGS = 200
const gameLogs: GameLogEntry[] = []

export const gameConsola = createConsola({
	level: 4
}).withTag('petakuis:game-server')

export function logGameEvent(
	level: GameLogEntry['level'],
	tag: string,
	message: string,
	meta?: Record<string, unknown>
) {
	const entry: GameLogEntry = {
		id: `glog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
		timestamp: new Date().toISOString(),
		service: 'game-server',
		level,
		tag,
		message,
		meta
	}

	gameLogs.unshift(entry)
	if (gameLogs.length > MAX_LOGS) {
		gameLogs.length = MAX_LOGS
	}

	const tagged = gameConsola.withTag(tag)
	if (meta) {
		tagged[level](message, meta)
	} else {
		tagged[level](message)
	}
}

export function getGameLogs(): GameLogEntry[] {
	return gameLogs
}
