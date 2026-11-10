export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const query = getQuery(event)
	const code = String(query.code || '').trim()

	if (!code) {
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
			throw createError({
				statusCode: 404,
				statusMessage: 'Kode ruangan tidak ditemukan atau sesi sudah berakhir.'
			})
		}
		return await resp.json()
	} catch (err: any) {
		if (err.statusCode) throw err
		throw createError({
			statusCode: 503,
			statusMessage: 'Game server belum aktif.'
		})
	}
})
