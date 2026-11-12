/**
 * Digital Asset Links untuk aplikasi Android (TWA) Petakuis. Tanpa berkas ini, aplikasi
 * menampilkan bilah alamat browser. Sidik jari SHA-256 dibaca dari NUXT_TWA_SHA256_FINGERPRINTS
 * (dipisah koma): kunci upload lokal + kunci "App signing" dari Play Console.
 */
export default defineEventHandler((event) => {
	const config = useRuntimeConfig()
	const fingerprints = config.twaSha256Fingerprints
		.split(',')
		.map(f => f.trim().toUpperCase())
		.filter(f => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f))

	setHeader(event, 'Content-Type', 'application/json')
	setHeader(event, 'Cache-Control', 'public, max-age=3600')
	if (!fingerprints.length) return []
	return [{
		relation: ['delegate_permission/common.handle_all_urls'],
		target: {
			namespace: 'android_app',
			package_name: config.twaPackageName,
			sha256_cert_fingerprints: fingerprints
		}
	}]
})
