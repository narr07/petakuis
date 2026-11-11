import { count, desc, eq, isNotNull } from 'drizzle-orm'
import { gameSessions, quizzes, schoolSettings, user } from '../db/schema'
import { effectiveRole, type SelectableRole, type UserRole } from './auth'

export interface AdminUserRow {
	id: string
	name: string
	email: string
	image: string | null
	emailVerified: boolean
	/** Peran efektif (admin dari daftar email server). */
	role: UserRole | null
	/** Peran tersimpan (Guru/Siswa) yang bisa diubah admin. */
	storedRole: SelectableRole | null
	quizCount: number
	sessionCount: number
	createdAt: string
}

/** Semua akun beserta jumlah kuis dan sesi live yang dibuatnya. */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
	const db = await useDb()
	const [users, quizCounts, sessionCounts] = await Promise.all([
		db.select().from(user).orderBy(desc(user.createdAt)),
		db.select({ ownerId: quizzes.ownerId, n: count() }).from(quizzes).where(isNotNull(quizzes.ownerId)).groupBy(quizzes.ownerId),
		db.select({ ownerId: gameSessions.ownerId, n: count() }).from(gameSessions).where(isNotNull(gameSessions.ownerId)).groupBy(gameSessions.ownerId)
	])
	const quizMap = new Map(quizCounts.map(r => [r.ownerId, r.n]))
	const sessionMap = new Map(sessionCounts.map(r => [r.ownerId, r.n]))

	return users.map(u => ({
		id: u.id,
		name: u.name,
		email: u.email,
		image: u.image,
		emailVerified: u.emailVerified,
		role: effectiveRole(u),
		storedRole: u.role ?? null,
		quizCount: quizMap.get(u.id) ?? 0,
		sessionCount: sessionMap.get(u.id) ?? 0,
		createdAt: u.createdAt.toISOString()
	}))
}

export async function setUserRole(id: string, role: SelectableRole): Promise<boolean> {
	const db = await useDb()
	const result = await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, id))
	return result.rowsAffected > 0
}

/** Menghapus akun (sesi dan tautan login ikut terhapus). Kuis dan laporannya tetap ada. */
export async function deleteUserAccount(id: string): Promise<boolean> {
	const db = await useDb()
	const result = await db.delete(user).where(eq(user.id, id))
	return result.rowsAffected > 0
}

// ---------------------------------------------------------------- profil sekolah

export interface SchoolProfile {
	name: string
	npsn: string
	city: string
}

const DEFAULT_SCHOOL: SchoolProfile = { name: 'Sekolah Petakuis', npsn: '', city: '' }

export async function getSchoolProfile(): Promise<SchoolProfile> {
	const db = await useDb()
	const [row] = await db.select().from(schoolSettings).where(eq(schoolSettings.id, 'default')).limit(1)
	return row ? { name: row.name, npsn: row.npsn, city: row.city } : DEFAULT_SCHOOL
}

export async function saveSchoolProfile(profile: SchoolProfile): Promise<SchoolProfile> {
	const db = await useDb()
	const values = { id: 'default', ...profile, updatedAt: new Date().toISOString() }
	await db.insert(schoolSettings).values(values).onConflictDoUpdate({
		target: schoolSettings.id,
		set: { name: values.name, npsn: values.npsn, city: values.city, updatedAt: values.updatedAt }
	})
	return profile
}

/** Angka ringkas untuk halaman pengaturan. */
export async function schoolStats() {
	const db = await useDb()
	const [[users], [quizTotal], [sessionTotal]] = await Promise.all([
		db.select({ n: count() }).from(user),
		db.select({ n: count() }).from(quizzes),
		db.select({ n: count() }).from(gameSessions)
	])
	return { users: users?.n ?? 0, quizzes: quizTotal?.n ?? 0, sessions: sessionTotal?.n ?? 0 }
}
