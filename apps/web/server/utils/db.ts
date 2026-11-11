import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'
import { count } from 'drizzle-orm'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { STARTER_QUIZZES } from '@petakuis/shared'
import * as schema from '../db/schema'

export type Database = LibSQLDatabase<typeof schema>

let ready: Promise<Database> | null = null

/**
 * Koneksi database (SQLite lewat libSQL). Saat pertama dipakai: membuat folder berkas,
 * menyalakan mode WAL, menjalankan migrasi, lalu mengisi kuis contoh bila tabel masih kosong.
 * Semua pemanggil menunggu proses ini selesai, jadi tidak ada query sebelum tabel siap.
 */
export function useDb(): Promise<Database> {
	if (!ready) {
		ready = openDatabase().catch((err) => {
			ready = null // coba lagi pada permintaan berikutnya
			throw err
		})
	}
	return ready
}

async function openDatabase(): Promise<Database> {
	const config = useRuntimeConfig()
	const url = config.databaseUrl

	if (url.startsWith('file:')) {
		const filePath = url.startsWith('file://') ? fileURLToPath(url) : url.slice('file:'.length)
		mkdirSync(dirname(resolve(filePath)), { recursive: true })
	}

	const client = createClient({ url })
	// WAL: pembaca tidak terhalang penulis; busy_timeout: tunggu sebentar alih-alih langsung gagal.
	await client.execute('PRAGMA journal_mode = WAL')
	await client.execute('PRAGMA busy_timeout = 5000')
	await client.execute('PRAGMA foreign_keys = ON')

	const db = drizzle(client, { schema })
	const migrationsFolder = isAbsolute(config.migrationsDir)
		? config.migrationsDir
		: resolve(process.cwd(), config.migrationsDir)
	await migrate(db, { migrationsFolder })
	await seedStarterQuizzes(db)
	recordWebLog('success', 'db', `Database siap (${url})`)
	return db
}

async function seedStarterQuizzes(db: Database): Promise<void> {
	const [row] = await db.select({ total: count() }).from(schema.quizzes)
	if ((row?.total ?? 0) > 0) return
	await db.insert(schema.quizzes).values(
		STARTER_QUIZZES.map(q => ({
			id: q.id,
			ownerName: q.ownerName,
			title: q.title,
			description: q.description,
			schoolLevel: q.schoolLevel,
			gradeLabel: q.gradeLabel,
			subject: q.subject,
			visibility: q.visibility,
			mapId: q.mapId,
			mode: q.mode,
			settings: q.settings,
			questions: q.questions,
			createdAt: q.createdAt,
			updatedAt: q.updatedAt
		}))
	)
	recordWebLog('info', 'db', `${STARTER_QUIZZES.length} kuis contoh ditambahkan`)
}
