import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { H3Event } from 'h3'
import { account, session, user, verification } from '../db/schema'
import type { Database } from './db'

export type UserRole = 'admin' | 'teacher' | 'student'
export type SelectableRole = Exclude<UserRole, 'admin'>
export const SELECTABLE_ROLES: SelectableRole[] = ['teacher', 'student']

const DEV_AUTH_SECRET = 'petakuis-dev-auth-secret-hanya-untuk-lokal'

function adminEmailSet(): Set<string> {
	return new Set(
		useRuntimeConfig().adminEmails
			.split(',')
			.map(e => e.trim().toLowerCase())
			.filter(Boolean)
	)
}

/**
 * Peran efektif. Admin ditentukan dari NUXT_ADMIN_EMAILS, bukan dari database, dan hanya
 * untuk email yang sudah terverifikasi (Google, atau tautan verifikasi). Dengan begitu orang
 * yang mendaftar memakai email admin tanpa memegang kotak masuknya tidak menjadi admin.
 */
export function effectiveRole(u: { email: string, emailVerified: boolean, role?: string | null }): UserRole | null {
	if (u.emailVerified && adminEmailSet().has(u.email.toLowerCase())) return 'admin'
	return SELECTABLE_ROLES.includes(u.role as SelectableRole) ? (u.role as SelectableRole) : null
}

function createAuth(db: Database) {
	const config = useRuntimeConfig()
	if (!config.authSecret && process.env.NODE_ENV === 'production') {
		throw new Error('NUXT_AUTH_SECRET wajib diisi di produksi (openssl rand -hex 32).')
	}
	const siteUrl = config.public.siteUrl

	return betterAuth({
		appName: 'Petakuis',
		baseURL: siteUrl,
		secret: config.authSecret || DEV_AUTH_SECRET,
		trustedOrigins: [siteUrl],
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: { user, session, account, verification }
		}),
		telemetry: { enabled: false },
		advanced: {
			// Di produksi situs hanya bisa diakses lewat Cloudflare Tunnel (port terikat ke 127.0.0.1),
			// jadi cf-connecting-ip selalu diisi Cloudflare dan tidak bisa dipalsukan pengunjung.
			ipAddress: { ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] }
		},
		rateLimit: {
			// Bawaan 3 percobaan masuk/daftar per 10 detik per IP terlalu ketat untuk satu kelas
			// yang keluar lewat satu IP sekolah. Kirim email (reset, verifikasi) tetap 3 per menit.
			customRules: {
				'/sign-in/email': { window: 60, max: 30 },
				'/sign-in/social': { window: 60, max: 30 },
				'/sign-up/email': { window: 60, max: 20 }
			}
		},
		user: {
			additionalFields: {
				// Boleh dikirim saat daftar (Guru/Siswa); disaring di databaseHooks di bawah.
				role: { type: 'string', required: false, input: true }
			}
		},
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 8,
			maxPasswordLength: 128,
			// Wajib verifikasi: mencegah orang mendaftar memakai email milik orang lain.
			requireEmailVerification: true,
			revokeSessionsOnPasswordReset: true,
			resetPasswordTokenExpiresIn: 60 * 60,
			sendResetPassword: async ({ user: u, url }) => {
				await sendEmail({ to: u.email, ...resetPasswordEmail(u.name, url) })
			}
		},
		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			expiresIn: 60 * 60 * 24,
			sendVerificationEmail: async ({ user: u, url }) => {
				await sendEmail({ to: u.email, ...verifyEmailMessage(u.name, url) })
			}
		},
		socialProviders: config.googleClientId && config.googleClientSecret
			? {
					google: {
						clientId: config.googleClientId,
						clientSecret: config.googleClientSecret,
						prompt: 'select_account'
					}
				}
			: {},
		account: {
			// Login Google dengan email yang sama digabung ke akun yang sudah ada (satu orang, satu akun).
			accountLinking: { enabled: true, trustedProviders: ['google'] }
		},
		databaseHooks: {
			user: {
				create: {
					before: async (data) => {
						const role = SELECTABLE_ROLES.includes(data.role as SelectableRole) ? data.role : null
						return { data: { ...data, role } }
					}
				},
				update: {
					// Peran tidak boleh diubah lewat API Better Auth (update-user); pemilihan peran
					// memakai /api/me/role yang menulis langsung ke database. Better Auth menggabungkan
					// data hasil hook dengan data asli, jadi membuang `role` saja tidak cukup:
					// pembaruan yang membawa `role` dibatalkan seluruhnya.
					before: async (data) => {
						if ((data as Record<string, unknown>).role !== undefined) return false
						return { data }
					}
				}
			}
		}
	})
}

let instance: Promise<ReturnType<typeof createAuth>> | null = null

/** Instance Better Auth; dibuat sekali setelah database siap. */
export function useAuth() {
	if (!instance) {
		instance = useDb().then(createAuth).catch((err) => {
			instance = null
			throw err
		})
	}
	return instance
}

export interface CurrentUser {
	id: string
	name: string
	email: string
	image: string | null
	role: UserRole | null
}

/** Pengguna yang sedang masuk, atau null. */
export async function getCurrentUser(event: H3Event): Promise<CurrentUser | null> {
	const auth = await useAuth()
	const result = await auth.api.getSession({ headers: event.headers })
	if (!result) return null
	const u = result.user as typeof result.user & { role?: string | null }
	return {
		id: u.id,
		name: u.name,
		email: u.email,
		image: u.image ?? null,
		role: effectiveRole(u)
	}
}

/** Wajib masuk (dan, bila diberikan, salah satu peran). Melempar 401/403 bila tidak. */
export async function requireUser(event: H3Event, roles?: UserRole[]): Promise<CurrentUser> {
	const current = await getCurrentUser(event)
	if (!current) {
		throw createError({ statusCode: 401, statusMessage: 'Silakan masuk terlebih dahulu.' })
	}
	if (roles && (!current.role || !roles.includes(current.role))) {
		throw createError({ statusCode: 403, statusMessage: 'Akunmu tidak punya akses ke fitur ini.' })
	}
	return current
}
