/** Peran pengguna yang sedang masuk, untuk tampilan dashboard. */
export function useDashboardRole() {
	const { role, isAdmin, roleLabel } = useCurrentUser()
	return { role, isAdmin, roleLabel }
}
