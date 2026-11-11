export type DashboardRole = 'teacher' | 'admin'

/**
 * Peran aktif di dashboard. Login guru belum tersambung, jadi peran masih disimpan
 * di cookie sebagai mode pratinjau dan bisa diganti dari menu pengguna.
 */
export function useDashboardRole() {
	const role = useCookie<DashboardRole>('petakuis-demo-role', {
		default: () => 'teacher',
		sameSite: 'lax'
	})

	const isAdmin = computed(() => role.value === 'admin')
	const roleLabel = computed(() => (role.value === 'admin' ? 'Admin Sekolah' : 'Guru'))

	function setRole(next: DashboardRole) {
		role.value = next
	}

	return { role, isAdmin, roleLabel, setRole }
}
