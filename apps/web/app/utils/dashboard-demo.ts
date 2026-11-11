/** Konstanta tampilan dashboard dan daftar room demo. */

/** Room demo yang otomatis aktif saat game server menyala (lihat apps/game-server/src/index.ts). */
export const DEMO_ROOMS = [
	{ code: '123456', mapId: 'map-pesisir-karang' },
	{ code: '222222', mapId: 'map-desa-sunnyside' },
	{ code: '333333', mapId: 'map-kampus-modern' },
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
