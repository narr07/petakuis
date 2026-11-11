export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const query = getQuery(event)
	const code = String(query.code || '').trim()

	assertPinAttemptAllowed(event)
	if (!/^\d{6}$/.test(code)) {
		recordPinFailure(event)
		throw createError({
			statusCode: 400,
			statusMessage: 'Masukkan kode ruangan 6 digit.'
		})
	}

	try {
		const resp = await fetch(
			`${config.gameServerInternalUrl}/rooms/${encodeURIComponent(code)}`
		)
		if (!resp.ok) {
			recordPinFailure(event)
			throw createError({
				statusCode: 404,
				statusMessage: 'Kode ruangan tidak ditemukan atau sesi sudah berakhir.'
			})
		}
		return await resp.json()
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'statusCode' in err) throw err
		throw createError({
			statusCode: 503,
			statusMessage: 'Game server belum aktif.'
		})
	}
})
