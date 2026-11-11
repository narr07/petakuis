/**
 * Membuka sesi kelas live untuk sebuah kuis lalu mengarahkan guru ke layar host.
 * Dipakai bersama oleh beranda, halaman jelajah, dan dashboard.
 */
export function useLaunchSession() {
	const router = useRouter()
	const toast = useToast()
	const launchingId = ref<string | null>(null)

	async function launch(quizId: string) {
		launchingId.value = quizId
		try {
			const res = await $fetch<{ ok: boolean, code: string }>('/api/sessions', {
				method: 'POST',
				body: { quizId, autoStart: true }
			})
			await router.push(`/host/${res.code}`)
		} catch {
			toast.add({
				title: 'Gagal membuka kelas',
				description: 'Game server belum aktif atau sedang sibuk. Coba lagi beberapa saat lagi.',
				color: 'error',
				icon: 'i-lucide-circle-alert'
			})
		} finally {
			launchingId.value = null
		}
	}

	return { launchingId, launch }
}
