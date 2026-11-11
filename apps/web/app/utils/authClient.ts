import { createAuthClient } from 'better-auth/vue'
import { inferAdditionalFields } from 'better-auth/client/plugins'

function makeClient() {
	return createAuthClient({
		baseURL: window.location.origin,
		plugins: [
			// Supaya `role` (Guru/Siswa) bisa dikirim saat daftar; tetap disaring di server.
			inferAdditionalFields({
				user: { role: { type: 'string', required: false } }
			})
		]
	})
}

let client: ReturnType<typeof makeClient> | null = null

/** Klien Better Auth; hanya dipakai di browser (dalam event handler, bukan saat SSR). */
export function useAuthClient() {
	if (!client) client = makeClient()
	return client
}

/** Pesan galat Better Auth dalam bahasa Indonesia. */
export function authErrorMessage(error: { code?: string, message?: string, status?: number } | null | undefined): string {
	switch (error?.code) {
		case 'INVALID_EMAIL_OR_PASSWORD':
			return 'Email atau kata sandi salah.'
		case 'EMAIL_NOT_VERIFIED':
			return 'Email belum dikonfirmasi. Buka tautan yang kami kirim ke emailmu.'
		case 'USER_ALREADY_EXISTS':
		case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
			return 'Email ini sudah terdaftar. Silakan masuk atau gunakan "Lupa kata sandi".'
		case 'PASSWORD_TOO_SHORT':
			return 'Kata sandi minimal 8 karakter.'
		case 'INVALID_TOKEN':
			return 'Tautan sudah kedaluwarsa atau tidak valid. Minta tautan baru.'
	}
	if (error?.status === 429) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
	return error?.message || 'Terjadi kesalahan. Coba lagi.'
}
