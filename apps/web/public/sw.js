/**
 * Service worker Petakuis: hanya menampilkan halaman offline saat Petakuis tidak bisa dihubungi
 * (internet putus, atau Cloudflare membalas galat gateway karena server mati).
 * Sengaja tidak menyimpan halaman atau aset lain ke cache, supaya tampilan tidak basi setelah deploy.
 * Ganti CACHE bila offline.html diubah.
 */
const CACHE = 'petakuis-offline-v1'
const OFFLINE_URL = '/offline.html'
// Galat gateway dari Cloudflare/proxy: server di belakangnya tidak bisa dijangkau.
const GATEWAY_ERRORS = new Set([502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530])

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE)
			.then(cache => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
			.then(() => self.skipWaiting())
	)
})

self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		const keys = await caches.keys()
		await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
		// Navigation preload: permintaan halaman tidak menunggu service worker menyala.
		if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
		await self.clients.claim()
	})())
})

async function offlinePage() {
	return (await caches.match(OFFLINE_URL)) || Response.error()
}

self.addEventListener('fetch', (event) => {
	if (event.request.mode !== 'navigate') return
	event.respondWith((async () => {
		try {
			const response = (await event.preloadResponse) || (await fetch(event.request))
			return GATEWAY_ERRORS.has(response.status) ? offlinePage() : response
		} catch {
			return offlinePage()
		}
	})())
})
