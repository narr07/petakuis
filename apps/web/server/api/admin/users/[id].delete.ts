/** Admin menghapus akun. Akun sendiri tidak bisa dihapus dari sini. */
export default defineEventHandler(async (event) => {
	const current = await requireUser(event, ['admin'])
	const id = getRouterParam(event, 'id') || ''
	if (id === current.id) {
		throw createError({ statusCode: 400, statusMessage: 'Akunmu sendiri tidak bisa dihapus dari sini.' })
	}
	if (!(await deleteUserAccount(id))) {
		throw createError({ statusCode: 404, statusMessage: 'Akun tidak ditemukan.' })
	}
	return { ok: true }
})
