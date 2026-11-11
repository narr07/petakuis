/** Profil sekolah untuk dashboard (guru dan admin). */
export default defineEventHandler(async (event) => {
	await requireUser(event, ['teacher', 'admin'])
	return { school: await getSchoolProfile() }
})
