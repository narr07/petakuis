/**
 * Data contoh untuk dashboard selama database dan login guru belum tersambung.
 * Semua nama di sini fiktif. Ganti dengan data dari API setelah PostgreSQL aktif.
 */

export interface DemoTeacher {
	id: string
	name: string
	subject: string
	email: string
	quizzes: number
	sessions: number
	status: 'Aktif' | 'Undangan terkirim'
}

export interface DemoStudent {
	id: string
	nisn: string
	name: string
	grade: string
	quizzesJoined: number
	avgScore: number
}

export const DEMO_SCHOOL = {
	name: 'Sekolah Contoh Petakuis',
	city: 'Kota Bandung, Jawa Barat',
	npsn: '00000000',
	aiQuotaUsed: 48,
	aiQuotaLimit: 200
}

export const DEMO_USERS = {
	teacher: { name: 'Guru Contoh', email: 'guru@sekolah.sch.id' },
	admin: { name: 'Admin Sekolah', email: 'admin@sekolah.sch.id' }
} as const

export const DEMO_TEACHERS: DemoTeacher[] = [
	{ id: 't1', name: 'Hendra Saputra', subject: 'Matematika', email: 'hendra@sekolah.sch.id', quizzes: 8, sessions: 24, status: 'Aktif' },
	{ id: 't2', name: 'Ratna Dewi', subject: 'IPA', email: 'ratna@sekolah.sch.id', quizzes: 12, sessions: 38, status: 'Aktif' },
	{ id: 't3', name: 'Budi Prasetyo', subject: 'Informatika', email: 'budi@sekolah.sch.id', quizzes: 5, sessions: 14, status: 'Aktif' },
	{ id: 't4', name: 'Siti Rahmawati', subject: 'Bahasa Indonesia', email: 'siti@sekolah.sch.id', quizzes: 9, sessions: 29, status: 'Aktif' },
	{ id: 't5', name: 'Yusuf Hidayat', subject: 'IPS', email: 'yusuf@sekolah.sch.id', quizzes: 0, sessions: 0, status: 'Undangan terkirim' }
]

export const DEMO_STUDENTS: DemoStudent[] = [
	{ id: 's1', nisn: '0081294812', name: 'Ahmad Fauzan', grade: '7A', quizzesJoined: 14, avgScore: 88 },
	{ id: 's2', nisn: '0082739182', name: 'Aisyah Putri', grade: '7A', quizzesJoined: 16, avgScore: 94 },
	{ id: 's3', nisn: '0084928192', name: 'Bima Satria', grade: '7B', quizzesJoined: 12, avgScore: 78 },
	{ id: 's4', nisn: '0085819201', name: 'Citra Kirana', grade: '7B', quizzesJoined: 15, avgScore: 92 },
	{ id: 's5', nisn: '0071928391', name: 'Dimas Aditya', grade: '8A', quizzesJoined: 20, avgScore: 85 },
	{ id: 's6', nisn: '0072819203', name: 'Farhan Maulana', grade: '8A', quizzesJoined: 18, avgScore: 90 },
	{ id: 's7', nisn: '0073910294', name: 'Gita Nurhaliza', grade: '8B', quizzesJoined: 19, avgScore: 96 }
]

/** Room demo yang otomatis aktif saat game server menyala (lihat apps/game-server/src/index.ts). */
export const DEMO_ROOMS = [
	{ code: '123456', mapId: 'map-halaman-sekolah' },
	{ code: '222222', mapId: 'map-desa-sunnyside' },
	{ code: '333333', mapId: 'map-kampus-modern' },
	{ code: '444444', mapId: 'map-pesisir-karang' },
	{ code: '555555', mapId: 'map-dataran-angin' },
	{ code: '666666', mapId: 'map-kota-pasar' }
]

export const QUESTION_TYPE_LABELS: Record<string, { label: string, color: 'primary' | 'secondary' | 'warning' }> = {
	multiple: { label: 'PG', color: 'primary' },
	ox: { label: 'B/S', color: 'secondary' },
	subjective: { label: 'Isian', color: 'warning' }
}

export function questionTypeInfo(type: string) {
	return QUESTION_TYPE_LABELS[type] ?? { label: 'Isian', color: 'warning' as const }
}

export function modeLabel(mode: string) {
	return mode === 'linear' ? 'Berurutan' : 'Bebas'
}
