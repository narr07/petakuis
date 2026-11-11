import { and, eq, isNull } from 'drizzle-orm'
import { user } from '../../db/schema'

/**
 * Memilih peran Guru atau Siswa, hanya sekali (untuk akun Google yang baru dibuat).
 * Admin tidak bisa dipilih; peran yang sudah terisi tidak bisa diganti dari sini.
 */
export default defineEventHandler(async (event) => {
	const current = await requireUser(event)
	const body = await readBody<{ role?: string }>(event)
	const role = body?.role
	if (!SELECTABLE_ROLES.includes(role as SelectableRole)) {
		throw createError({ statusCode: 400, statusMessage: 'Pilih Guru atau Siswa.' })
	}

	const db = await useDb()
	const result = await db
		.update(user)
		.set({ role: role as SelectableRole, updatedAt: new Date() })
		.where(and(eq(user.id, current.id), isNull(user.role)))
	if (result.rowsAffected === 0) {
		throw createError({ statusCode: 409, statusMessage: 'Peran akun ini sudah dipilih sebelumnya.' })
	}
	return { user: await getCurrentUser(event) }
})
