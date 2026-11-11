import { defineConfig } from 'drizzle-kit'

// Hanya untuk membuat berkas migrasi (`bun run db:generate`); aplikasi menjalankan
// migrasinya sendiri saat server menyala (server/plugins/database.ts).
export default defineConfig({
	dialect: 'sqlite',
	schema: './server/db/schema.ts',
	out: './server/db/migrations'
})
