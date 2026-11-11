import { SELECTABLE_ROLES, type SelectableRole } from '../../../utils/auth'

/** Admin mengubah peran tersimpan akun (Guru/Siswa). Admin tetap ditentukan dari daftar email. */
export default defineEventHandler(async (event) => {
	await requireUser(event, ['admin'])
	const id = getRouterParam(event, 'id') || ''
	const { role } = await readBody<{ role?: string }>(event)
	if (!SELECTABLE_ROLES.includes(role as SelectableRole)) {
		throw createError({ statusCode: 400, statusMessage: 'Peran harus Guru atau Siswa.' })
	}
	if (!(await setUserRole(id, role as SelectableRole))) {
		throw createError({ statusCode: 404, statusMessage: 'Akun tidak ditemukan.' })
	}
	return { ok: true }
})
