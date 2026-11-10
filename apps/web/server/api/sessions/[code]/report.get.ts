export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const code = getRouterParam(event, 'code') || ''

	const resp = await fetch(
		`${config.gameServerInternalUrl}/rooms/${encodeURIComponent(code)}/report`
	)

	if (!resp.ok) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Laporan sesi tidak ditemukan.'
		})
	}

	return await resp.json()
})
