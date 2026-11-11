import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { QuizQuestion, QuizSettings, SessionReportData } from '@petakuis/shared'

/**
 * Skema SQLite (libSQL) untuk Drizzle. Waktu disimpan sebagai teks ISO 8601 supaya
 * sama dengan tipe di @petakuis/shared. Tabel akun guru akan ditambahkan oleh Better Auth.
 *
 * Setelah mengubah berkas ini jalankan `bun run db:generate` di apps/web untuk membuat migrasi.
 */

export const quizzes = sqliteTable('quizzes', {
	id: text('id').primaryKey(),
	/** Diisi setelah login guru aktif; kosong untuk kuis lama dan kuis contoh. */
	ownerId: text('owner_id'),
	ownerName: text('owner_name').notNull(),
	title: text('title').notNull(),
	description: text('description').notNull().default(''),
	schoolLevel: text('school_level').notNull(),
	gradeLabel: text('grade_label').notNull(),
	subject: text('subject').notNull(),
	visibility: text('visibility', { enum: ['public', 'private'] }).notNull().default('public'),
	mapId: text('map_id').notNull(),
	mode: text('mode', { enum: ['free', 'linear'] }).notNull().default('free'),
	settings: text('settings', { mode: 'json' }).$type<QuizSettings>().notNull(),
	/** Soal disimpan utuh bersama kuisnya karena selalu dibaca dan disimpan sekaligus. */
	questions: text('questions', { mode: 'json' }).$type<QuizQuestion[]>().notNull(),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
}, table => [
	index('quizzes_visibility_idx').on(table.visibility),
	index('quizzes_owner_idx').on(table.ownerId)
])

export const gameSessions = sqliteTable('game_sessions', {
	id: text('id').primaryKey(),
	/** PIN 6 digit; bisa dipakai ulang oleh sesi lain setelah sesi ini berakhir. */
	code: text('code').notNull(),
	quizId: text('quiz_id').notNull(),
	quizTitle: text('quiz_title').notNull(),
	ownerId: text('owner_id'),
	mapId: text('map_id').notNull(),
	mode: text('mode', { enum: ['free', 'linear'] }).notNull(),
	status: text('status', { enum: ['lobby', 'active', 'paused', 'ended'] }).notNull(),
	createdAt: text('created_at').notNull(),
	endedAt: text('ended_at'),
	totalPlayers: integer('total_players').notNull().default(0),
	/** Laporan akhir dari game server, disimpan saat sesi berakhir. */
	report: text('report', { mode: 'json' }).$type<SessionReportData>()
}, table => [
	index('game_sessions_code_idx').on(table.code),
	index('game_sessions_owner_idx').on(table.ownerId)
])

// ---------------------------------------------------------------- akun (Better Auth)
// Nama properti mengikuti nama field Better Auth (user, session, account, verification).

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	/**
	 * Peran yang dipilih saat daftar: 'teacher' atau 'student'. Kosong untuk akun Google yang
	 * belum memilih (halaman /auth/pilih-peran). Admin tidak disimpan di sini: ditentukan dari
	 * daftar email ADMIN_EMAILS di server.
	 */
	role: text('role', { enum: ['teacher', 'student'] }),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
})

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
}, table => [index('session_user_idx').on(table.userId)])

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
	scope: text('scope'),
	/** Hash kata sandi (scrypt) untuk login email; kosong untuk akun Google. */
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
}, table => [index('account_user_idx').on(table.userId)])

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
}, table => [index('verification_identifier_idx').on(table.identifier)])

// ---------------------------------------------------------------- pengaturan sekolah

/** Profil sekolah (satu baris, id "default"), diubah admin dari dashboard. */
export const schoolSettings = sqliteTable('school_settings', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	npsn: text('npsn').notNull().default(''),
	city: text('city').notNull().default(''),
	updatedAt: text('updated_at').notNull()
})

export type QuizRow = typeof quizzes.$inferSelect
export type GameSessionRow = typeof gameSessions.$inferSelect
export type UserRow = typeof user.$inferSelect
