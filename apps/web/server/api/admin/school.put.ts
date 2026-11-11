/** Admin menyimpan profil sekolah. */
export default defineEventHandler(async (event) => {
	await requireUser(event, ['admin'])
	const body = await readBody<{ name?: unknown, npsn?: unknown, city?: unknown }>(event)
	const name = typeof body.name === 'string' ? body.name.trim() : ''
	const npsn = typeof body.npsn === 'string' ? body.npsn.trim() : ''
	const city = typeof body.city === 'string' ? body.city.trim() : ''
	if (name.length < 3 || name.length > 120) {
		throw createError({ statusCode: 400, statusMessage: 'Nama sekolah 3–120 karakter.' })
	}
	if (npsn && !/^\d{8}$/.test(npsn)) {
		throw createError({ statusCode: 400, statusMessage: 'NPSN terdiri dari 8 digit angka.' })
	}
	if (city.length > 120) {
		throw createError({ statusCode: 400, statusMessage: 'Nama kota terlalu panjang.' })
	}
	return { school: await saveSchoolProfile({ name, npsn, city }) }
})
