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

export type QuizRow = typeof quizzes.$inferSelect
export type GameSessionRow = typeof gameSessions.$inferSelect
