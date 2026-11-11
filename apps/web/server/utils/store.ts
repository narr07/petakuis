import { randomUUID } from 'node:crypto'
import { and, desc, eq, ne, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'
import {
	MAP_CATALOG,
	type MapTemplate,
	type QuizDefinition,
	type SessionReportData
} from '@petakuis/shared'
import { gameSessions, quizzes, type GameSessionRow, type QuizRow } from '../db/schema'

export function listAllMaps(): MapTemplate[] {
	return MAP_CATALOG
}

function toQuiz(row: QuizRow): QuizDefinition {
	return {
		id: row.id,
		ownerName: row.ownerName,
		title: row.title,
		description: row.description,
		schoolLevel: row.schoolLevel as QuizDefinition['schoolLevel'],
		gradeLabel: row.gradeLabel,
		subject: row.subject,
		visibility: row.visibility,
		mapId: row.mapId,
		mode: row.mode,
		settings: row.settings,
		questions: row.questions,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	}
}

/** LIKE (huruf besar/kecil sama) dengan % dan _ di kata kunci dicocokkan apa adanya. */
function contains(column: AnyColumn, term: string): SQL {
	const escaped = `%${term.replace(/[\\%_]/g, c => `\\${c}`)}%`
	return sql`${column} LIKE ${escaped} ESCAPE '\\'`
}

export async function listQuizzes(filters?: {
	schoolLevel?: string
	subject?: string
	search?: string
}): Promise<QuizDefinition[]> {
	const db = await useDb()
	const where: SQL[] = []
	if (filters?.schoolLevel && filters.schoolLevel !== 'all') {
		where.push(eq(quizzes.schoolLevel, filters.schoolLevel))
	}
	if (filters?.subject && filters.subject !== 'all') {
		where.push(eq(quizzes.subject, filters.subject))
	}
	if (filters?.search) {
		const term = filters.search.trim()
		where.push(or(
			contains(quizzes.title, term),
			contains(quizzes.description, term),
			contains(quizzes.subject, term)
		)!)
	}
	const rows = await db
		.select()
		.from(quizzes)
		.where(where.length ? and(...where) : undefined)
		.orderBy(desc(quizzes.updatedAt))
	return rows.map(toQuiz)
}

export async function getQuizById(id: string): Promise<QuizDefinition | undefined> {
	const db = await useDb()
	const [row] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1)
	return row ? toQuiz(row) : undefined
}

/** Menyimpan kuis baru. Mengedit kuis yang sudah ada menunggu login guru (cek pemilik). */
export async function createQuiz(quiz: QuizDefinition): Promise<QuizDefinition> {
	const db = await useDb()
	await db.insert(quizzes).values({
		id: quiz.id,
		ownerName: quiz.ownerName,
		title: quiz.title,
		description: quiz.description,
		schoolLevel: quiz.schoolLevel,
		gradeLabel: quiz.gradeLabel,
		subject: quiz.subject,
		visibility: quiz.visibility,
		mapId: quiz.mapId,
		mode: quiz.mode,
		settings: quiz.settings,
		questions: quiz.questions,
		createdAt: quiz.createdAt,
		updatedAt: quiz.updatedAt
	})
	return quiz
}

// ---------------------------------------------------------------- sesi live

export async function recordGameSession(input: {
	code: string
	quiz: QuizDefinition
	status: GameSessionRow['status']
}): Promise<void> {
	const db = await useDb()
	await db.insert(gameSessions).values({
		id: randomUUID(),
		code: input.code,
		quizId: input.quiz.id,
		quizTitle: input.quiz.title,
		mapId: input.quiz.mapId,
		mode: input.quiz.mode,
		status: input.status,
		createdAt: new Date().toISOString()
	})
}

/**
 * Menyimpan laporan akhir ke sesi terbaru dengan kode itu yang belum berakhir.
 * Mengembalikan false bila tidak ada sesi yang cocok (misalnya room demo).
 */
export async function saveSessionReport(code: string, report: SessionReportData): Promise<boolean> {
	const db = await useDb()
	const [row] = await db
		.select({ id: gameSessions.id })
		.from(gameSessions)
		.where(and(eq(gameSessions.code, code), ne(gameSessions.status, 'ended')))
		.orderBy(desc(gameSessions.createdAt))
		.limit(1)
	if (!row) return false
	await db
		.update(gameSessions)
		.set({
			status: 'ended',
			endedAt: report.endedAt || new Date().toISOString(),
			totalPlayers: report.totalPlayers,
			report
		})
		.where(eq(gameSessions.id, row.id))
	return true
}

/** Laporan tersimpan terbaru untuk kode sesi (dipakai setelah room hilang dari game server). */
export async function getSavedReport(code: string): Promise<SessionReportData | undefined> {
	const db = await useDb()
	const [row] = await db
		.select({ report: gameSessions.report })
		.from(gameSessions)
		.where(eq(gameSessions.code, code))
		.orderBy(desc(gameSessions.createdAt))
		.limit(1)
	return row?.report ?? undefined
}

export async function listGameSessions(limit = 50) {
	const db = await useDb()
	return db
		.select({
			id: gameSessions.id,
			code: gameSessions.code,
			quizTitle: gameSessions.quizTitle,
			mapId: gameSessions.mapId,
			status: gameSessions.status,
			createdAt: gameSessions.createdAt,
			endedAt: gameSessions.endedAt,
			totalPlayers: gameSessions.totalPlayers
		})
		.from(gameSessions)
		.orderBy(desc(gameSessions.createdAt))
		.limit(limit)
}
