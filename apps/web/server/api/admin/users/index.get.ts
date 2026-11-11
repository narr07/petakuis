/** Semua akun untuk halaman admin Guru dan Siswa. */
export default defineEventHandler(async (event) => {
	await requireUser(event, ['admin'])
	return { users: await listUsersForAdmin() }
})
