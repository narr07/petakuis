export interface AdminUser {
	id: string
	name: string
	email: string
	image: string | null
	emailVerified: boolean
	role: 'admin' | 'teacher' | 'student' | null
	storedRole: 'teacher' | 'student' | null
	quizCount: number
	sessionCount: number
	createdAt: string
}

const ROLE_BADGES = {
	admin: { label: 'Admin', color: 'primary' },
	teacher: { label: 'Guru', color: 'success' },
	student: { label: 'Siswa', color: 'info' },
	none: { label: 'Belum memilih peran', color: 'neutral' }
} as const

export function roleBadge(role: AdminUser['role']) {
	return ROLE_BADGES[role ?? 'none']
}

const joinDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
export function formatJoinDate(iso: string) {
	return joinDate.format(new Date(iso))
}

/** Target hapus akun, dibagi antara halaman dan DashboardDeleteUserModal. */
export function useDeleteUserTarget() {
	return useState<AdminUser | null>('admin-delete-user', () => null)
}

/** Data akun untuk halaman admin Guru dan Siswa, beserta aksi-aksinya. */
export async function useAdminUsers() {
	// Composable Nuxt harus dipanggil sebelum `await` pertama.
	const toast = useToast()
	const deleteTarget = useDeleteUserTarget()
	const { data, status, refresh } = await useFetch<{ users: AdminUser[] }>('/api/admin/users', {
		key: 'admin-users'
	})
	const users = computed(() => data.value?.users ?? [])

	function fail(title: string, err: unknown) {
		const e = err as { data?: { statusMessage?: string } }
		toast.add({ title, description: e?.data?.statusMessage || 'Coba lagi sebentar lagi.', icon: 'i-lucide-circle-alert', color: 'error' })
	}

	async function copyText(text: string, title: string) {
		try {
			await navigator.clipboard.writeText(text)
			toast.add({ title, description: text, icon: 'i-lucide-copy-check' })
		} catch {
			toast.add({ title: 'Gagal menyalin', color: 'error', icon: 'i-lucide-circle-alert' })
		}
	}

	const copyEmail = (email: string) => copyText(email, 'Email disalin')
	const copySignupLink = () => copyText(`${window.location.origin}/auth/daftar`, 'Tautan daftar disalin')

	async function changeRole(u: AdminUser, role: 'teacher' | 'student') {
		try {
			await $fetch(`/api/admin/users/${encodeURIComponent(u.id)}`, { method: 'PATCH', body: { role } })
			toast.add({
				title: `${u.name} sekarang ${role === 'teacher' ? 'Guru' : 'Siswa'}`,
				description: u.role === 'admin' ? 'Akun ini tetap Admin karena emailnya ada di daftar admin server.' : undefined,
				icon: 'i-lucide-user-check'
			})
			await refresh()
		} catch (err) {
			fail('Peran belum berubah', err)
		}
	}

	function askDelete(u: AdminUser) {
		deleteTarget.value = u
	}

	return { users, status, refresh, copyEmail, copySignupLink, changeRole, askDelete }
}
