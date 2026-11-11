export default defineNuxtConfig({
	compatibilityDate: '2026-06-30',
	devtools: { enabled: false },
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
		databaseUrl: process.env.DATABASE_URL || '',
		redisUrl: process.env.REDIS_URL || '',
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
