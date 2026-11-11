import { cpSync, existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * libSQL memilih binari native (@libsql/<platform>) saat berjalan lewat require dinamis,
 * jadi penelusur dependensi Nitro tidak mengikutkannya ke .output. Fungsi ini mencari
 * binari yang terpasang untuk platform mesin build (win32 di laptop, linux-musl di
 * Docker Alpine) supaya dipaksa ikut. Tanpa ini server produksi gagal membuka database.
 */
function libsqlNativeFiles(): string[] {
	// Paket-paket ini tidak mengekspor package.json, jadi dilacak lewat berkas utamanya.
	const fromClient = createRequire(createRequire(import.meta.url).resolve('@libsql/client'))
	const libsqlMain = fromClient.resolve('libsql')
	const fromLibsql = createRequire(libsqlMain)
	const pkg = JSON.parse(readFileSync(join(dirname(libsqlMain), 'package.json'), 'utf8')) as {
		optionalDependencies?: Record<string, string>
	}
	const files: string[] = []
	for (const name of Object.keys(pkg.optionalDependencies ?? {})) {
		try {
			const binary = fromLibsql.resolve(name) // "main" paket native = index.node
			const manifest = join(dirname(binary), 'package.json')
			if (existsSync(manifest)) files.push(manifest, binary)
		} catch {
			// Binari untuk platform lain memang tidak terpasang.
		}
	}
	if (files.length === 0) {
		// Lebih baik gagal saat build daripada server produksi tidak bisa membuka database.
		throw new Error('Binari native libSQL untuk platform ini tidak ditemukan. Jalankan `bun install`.')
	}
	return files
}

/**
 * @libsql/isomorphic-ws meng-import `ws`. Di build Linux (struktur folder Bun) penelusur
 * Nitro tidak menyalinnya walaupun disebut di traceInclude, sehingga server gagal dengan
 * "Cannot find package 'ws'". Setelah build, paket `ws` versi yang dipakai libSQL disalin
 * ke .output bila belum ada (di build Windows sudah ikut dengan sendirinya).
 */
function copyLibsqlWs(serverDir: string): void {
	const target = join(serverDir, 'node_modules', 'ws')
	if (existsSync(join(target, 'package.json'))) return
	const fromClient = createRequire(createRequire(import.meta.url).resolve('@libsql/client'))
	const isoWs = realpathSync(createRequire(fromClient.resolve('@libsql/hrana-client')).resolve('@libsql/isomorphic-ws'))
	// Jangan pakai require.resolve('ws'): Bun punya modul `ws` bawaan, jadi hasilnya bukan
	// lokasi paket. Cari folder node_modules/ws terdekat secara manual seperti Node.
	let wsDir: string | null = null
	for (let dir = dirname(isoWs); ; dir = dirname(dir)) {
		const manifest = join(dir, 'node_modules', 'ws', 'package.json')
		if (existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).name === 'ws') {
			wsDir = realpathSync(dirname(manifest))
			break
		}
		if (dirname(dir) === dir) break
	}
	if (!wsDir || serverDir.startsWith(wsDir)) {
		throw new Error(`Paket ws untuk libSQL tidak ditemukan dari ${isoWs}. Jalankan \`bun install\`.`)
	}
	cpSync(wsDir, target, { recursive: true, dereference: true })
	console.info(`[petakuis] paket ws disalin ke ${target}`)
}

export default defineNuxtConfig({
	compatibilityDate: '2026-06-30',
	devtools: { enabled: false },
	nitro: {
		externals: {
			traceInclude: libsqlNativeFiles()
		},
		hooks: {
			compiled(nitro) {
				copyLibsqlWs(nitro.options.output.serverDir)
			}
		}
	},
	future: {
		compatibilityVersion: 4
	},
	modules: [
		'@nuxt/eslint',
		'@nuxt/ui',
		'@pinia/nuxt',
		'@vueuse/nuxt'
	],
	css: ['~/assets/css/main.css'],
	colorMode: {
		preference: 'light',
		fallback: 'light'
	},
	runtimeConfig: {
		// Berkas SQLite (libSQL). Di produksi: NUXT_DATABASE_URL=file:/data/petakuis.db
		databaseUrl: 'file:.data/petakuis.db',
		// Folder migrasi Drizzle, relatif ke folder kerja. Di image Docker: NUXT_MIGRATIONS_DIR=/app/migrations
		migrationsDir: 'server/db/migrations',
		gameServerInternalUrl:
			process.env.GAME_SERVER_INTERNAL_URL || 'http://localhost:3001',
		internalSecret: process.env.INTERNAL_SECRET || 'petakuis_internal_secret',
		geminiApiKey: process.env.GEMINI_API_KEY || '',
		// ---- login (Better Auth). Diisi lewat NUXT_AUTH_SECRET, NUXT_GOOGLE_CLIENT_ID, dst.
		/** Rahasia penandatangan sesi; wajib acak di produksi (openssl rand -hex 32). */
		authSecret: '',
		googleClientId: '',
		googleClientSecret: '',
		/** Email yang otomatis berperan admin, dipisah koma. Jangan ditulis di kode (repo publik). */
		adminEmails: '',
		/** Pengirim email reset kata sandi lewat Resend. Tanpa kunci, tautan hanya dicatat di log. */
		resendApiKey: '',
		mailFrom: 'Petakuis <noreply@permadi.dev>',
		public: {
			gameServerUrl:
				process.env.NUXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001',
			/** Alamat publik situs, dipakai untuk tautan login Google dan email. */
			siteUrl: 'http://localhost:3000',
			/** Tombol "Masuk dengan Google" hanya tampil bila diisi. */
			googleLoginEnabled: false,
			/** Email kontak di halaman privasi/ketentuan (NUXT_PUBLIC_CONTACT_EMAIL). */
			contactEmail: ''
		}
	},
	app: {
		head: {
			htmlAttrs: {
				lang: 'id'
			},
			meta: [
				{
					name: 'description',
					content:
						'Platform kuis kelas berbasis eksplorasi peta pixel art 2D. 100% gratis untuk guru dan siswa SD, SMP, SMA di Indonesia.'
				},
				{
					name: 'viewport',
					content: 'width=device-width, initial-scale=1, maximum-scale=1'
				}
			],
			link: [
				{
					rel: 'preconnect',
					href: 'https://fonts.googleapis.com'
				},
				{
					rel: 'preconnect',
					href: 'https://fonts.gstatic.com',
					crossorigin: ''
				},
				{
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;500;600;700;800&family=Funnel+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap'
				}
			]
		}
	}
})
