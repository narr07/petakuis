export type UserRole = 'admin' | 'teacher' | 'student'

export interface CurrentUserInfo {
	id: string
	name: string
	email: string
	image: string | null
	/** null: akun Google baru yang belum memilih Guru/Siswa. */
	role: UserRole | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
	admin: 'Admin',
	teacher: 'Guru',
	student: 'Siswa'
}

/** Pengguna yang sedang masuk (dari /api/me). `undefined` = belum dimuat. */
export function useCurrentUser() {
	const user = useState<CurrentUserInfo | null | undefined>('current-user', () => undefined)
	const requestFetch = useRequestFetch()

	async function refresh() {
		const res = await requestFetch<{ user: CurrentUserInfo | null }>('/api/me')
		user.value = res.user
		return user.value
	}

	async function signOut() {
		await useAuthClient().signOut()
		user.value = null
		await navigateTo('/')
	}

	return {
		user,
		refresh,
		signOut,
		isLoggedIn: computed(() => Boolean(user.value)),
		role: computed(() => user.value?.role ?? null),
		isAdmin: computed(() => user.value?.role === 'admin'),
		roleLabel: computed(() => (user.value?.role ? ROLE_LABELS[user.value.role] : 'Belum memilih peran'))
	}
}

/** Tujuan setelah masuk sesuai peran: guru/admin ke dashboard, siswa ke halaman PIN. */
export function homeForRole(role: UserRole | null): string {
	if (!role) return '/auth/pilih-peran'
	return role === 'student' ? '/join' : '/dashboard'
}
