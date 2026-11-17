/** Konstanta tampilan dashboard dan daftar room demo. */

/** Room demo yang otomatis aktif saat game server menyala (daftarnya di @petakuis/shared). */
export { DEMO_ROOMS } from '@petakuis/shared'

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
