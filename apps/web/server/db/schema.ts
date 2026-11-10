import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar
} from 'drizzle-orm/pg-core'
import type {
	QuestionHint,
	QuestionOption,
	QuizSettings,
	SpawnPoint
} from '@petakuis/shared'

export const users = pgTable('users', {
	id: varchar('id', { length: 64 }).primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	name: varchar('name', { length: 120 }).notNull(),
	avatarUrl: text('avatar_url'),
	role: varchar('role', { length: 24 }).notNull().default('teacher'),
	schoolName: varchar('school_name', { length: 180 }),
	createdAt: timestamp('created_at').defaultNow().notNull()
})

export const maps = pgTable('maps', {
	id: varchar('id', { length: 64 }).primaryKey(),
	slug: varchar('slug', { length: 64 }).notNull().unique(),
	name: varchar('name', { length: 120 }).notNull(),
	description: text('description').notNull(),
	defaultMode: varchar('default_mode', { length: 24 }).notNull().default('free'),
	thumbnailUrl: text('thumbnail_url'),
	tiledJsonUrl: text('tiled_json_url'),
	spawnPoints: jsonb('spawn_points').$type<SpawnPoint[]>().notNull(),
	maxPlayers: integer('max_players').notNull().default(200)
})

export const quizzes = pgTable('quizzes', {
	id: varchar('id', { length: 64 }).primaryKey(),
	ownerId: varchar('owner_id', { length: 64 }).notNull(),
	ownerName: varchar('owner_name', { length: 120 }).notNull(),
	title: varchar('title', { length: 200 }).notNull(),
	description: text('description').notNull().default(''),
	schoolLevel: varchar('school_level', { length: 24 }).notNull(),
	gradeLabel: varchar('grade_label', { length: 48 }).notNull(),
	subject: varchar('subject', { length: 80 }).notNull(),
	visibility: varchar('visibility', { length: 16 }).notNull().default('public'),
	mapId: varchar('map_id', { length: 64 }).notNull(),
	mode: varchar('mode', { length: 24 }).notNull().default('free'),
	settings: jsonb('settings').$type<QuizSettings>().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const questions = pgTable('questions', {
	id: varchar('id', { length: 64 }).primaryKey(),
	quizId: varchar('quiz_id', { length: 64 }).notNull(),
	type: varchar('type', { length: 24 }).notNull(),
	prompt: text('prompt').notNull(),
	imageUrl: text('image_url'),
	hint: jsonb('hint').$type<QuestionHint>(),
	options: jsonb('options').$type<QuestionOption[]>().notNull(),
	answer: jsonb('answer').$type<string[]>().notNull(),
	isMultipleAnswer: boolean('is_multiple_answer').notNull().default(false),
	ignoreSpaces: boolean('ignore_spaces').notNull().default(true),
	timeLimitS: integer('time_limit_s').notNull().default(30),
	points: integer('points').notNull().default(100),
	order: integer('order').notNull().default(1)
})

export const sessions = pgTable('sessions', {
	id: varchar('id', { length: 64 }).primaryKey(),
	quizId: varchar('quiz_id', { length: 64 }).notNull(),
	hostId: varchar('host_id', { length: 64 }).notNull(),
	code: varchar('code', { length: 8 }).notNull(),
	mode: varchar('mode', { length: 24 }).notNull(),
	status: varchar('status', { length: 24 }).notNull().default('lobby'),
	startedAt: timestamp('started_at'),
	endedAt: timestamp('ended_at')
})
