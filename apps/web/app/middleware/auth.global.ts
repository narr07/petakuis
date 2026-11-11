/**
 * Penjaga halaman:
 * - /dashboard dan /build: wajib masuk sebagai Guru atau Admin.
 * - Akun yang belum memilih peran diarahkan ke /auth/pilih-peran.
 * - Halaman login/daftar dilewati bila sudah masuk.
 */
export default defineNuxtRouteMiddleware(async (to) => {
	const { user, refresh } = useCurrentUser()
	if (user.value === undefined) {
		await refresh().catch(() => {
			user.value = null
		})
	}

	const teacherOnly = to.path.startsWith('/dashboard') || to.path.startsWith('/build')
	const guestOnly = ['/auth/login', '/auth/daftar', '/auth/lupa-sandi'].includes(to.path)
	const current = user.value

	if (guestOnly && current) {
		return navigateTo(homeForRole(current.role))
	}

	if (to.path === '/auth/pilih-peran') {
		if (!current) return navigateTo('/auth/login')
		if (current.role) return navigateTo(homeForRole(current.role))
		return
	}

	if (!teacherOnly) return

	if (!current) {
		return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } })
	}
	if (!current.role) {
		return navigateTo({ path: '/auth/pilih-peran', query: { redirect: to.fullPath } })
	}
	if (current.role === 'student') {
		return navigateTo({ path: '/join', query: { info: 'khusus-guru' } })
	}
})
