import { ASSIGNABLE_ROLES, type SelectableRole } from '../../../utils/auth'

/**
 * Admin mengubah peran tersimpan akun. Hanya bisa dijadikan Guru (mis. akun Siswa lama milik
 * guru); akun Siswa baru tidak lagi dibuat. Admin tetap ditentukan dari daftar email.
 */
export default defineEventHandler(async (event) => {
	await requireUser(event, ['admin'])
	const id = getRouterParam(event, 'id') || ''
	const { role } = await readBody<{ role?: string }>(event)
	if (!ASSIGNABLE_ROLES.includes(role as SelectableRole)) {
		throw createError({ statusCode: 400, statusMessage: 'Akun hanya bisa dijadikan Guru.' })
	}
	if (!(await setUserRole(id, role as SelectableRole))) {
		throw createError({ statusCode: 404, statusMessage: 'Akun tidak ditemukan.' })
	}
	return { ok: true }
})
