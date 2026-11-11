import { getWebLogs } from '../utils/logger'

/** Log server langsung. Khusus admin: berisi alamat request dan aktivitas pemain. */
export default defineEventHandler(async (event) => {
	await requireUser(event, ['admin'])

	const config = useRuntimeConfig()
	let gameServerLogs: unknown[] = []

	try {
		const resp = await fetch(`${config.gameServerInternalUrl}/logs`)
		if (resp.ok) {
			const data = (await resp.json()) as { logs?: unknown[] }
			gameServerLogs = data.logs || []
		}
	} catch {
		// Ignore if game-server is offline
	}

	return {
		webLogs: getWebLogs(),
		gameServerLogs
	}
})
