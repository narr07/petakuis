/** Profil sekolah beserta statistik, untuk halaman Pengaturan Sekolah. */
export default defineEventHandler(async (event) => {
	await requireUser(event, ['admin'])
	const [school, stats] = await Promise.all([getSchoolProfile(), schoolStats()])
	return { school, stats }
})
