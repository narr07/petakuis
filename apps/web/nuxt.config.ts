import { existsSync, readFileSync } from 'node:fs'
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

	// @libsql/isomorphic-ws meng-import `ws`; di build Linux penelusur Nitro melewatkannya
	// (di Windows ikut), sehingga server gagal dengan "Cannot find package 'ws'".
	const hrana = fromClient.resolve('@libsql/hrana-client')
	const isoWs = createRequire(hrana).resolve('@libsql/isomorphic-ws')
	const wsMain = createRequire(isoWs).resolve('ws')
	const wsFiles = [wsMain, join(dirname(wsMain), 'wrapper.mjs'), join(dirname(wsMain), 'package.json')]
	files.push(...wsFiles.filter(f => existsSync(f)))
	return files
}

export default defineNuxtConfig({
	compatibilityDate: '2026-06-30',
	devtools: { enabled: false },
	nitro: {
		externals: {
			traceInclude: libsqlNativeFiles()
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
		public: {
			gameServerUrl:
				process.env.NUXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001'
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
