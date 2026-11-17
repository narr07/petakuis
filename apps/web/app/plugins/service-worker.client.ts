/**
 * Mendaftarkan service worker (public/sw.js) yang hanya menampilkan halaman offline saat
 * Petakuis tidak bisa dihubungi, termasuk di aplikasi Android (TWA). Tidak aktif di mode dev.
 */
export default defineNuxtPlugin(() => {
	if (import.meta.dev || !('serviceWorker' in navigator)) return

	const register = () => {
		navigator.serviceWorker.register('/sw.js').catch(() => {
			// Browser menolak (mis. mode privat): situs tetap jalan tanpa halaman offline.
		})
	}

	if (document.readyState === 'complete') register()
	else window.addEventListener('load', register, { once: true })
})
