/** Semua akun untuk halaman admin Guru dan Siswa (akun Siswa lama). */
export default defineEventHandler(async (event) => {
	await requireUser(event, ['admin'])
	return { users: await listUsersForAdmin() }
})
