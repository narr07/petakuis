/**
 * Room demo yang otomatis aktif saat game server menyala. Dipakai game server (membuat room),
 * dashboard (daftar room demo), dan server web (izin melihat laporan room demo).
 */
export const DEMO_ROOMS: ReadonlyArray<{ code: string, mapId: string }> = [
	{ code: '123456', mapId: 'map-pesisir-karang' },
	{ code: '222222', mapId: 'map-desa-sunnyside' },
	{ code: '333333', mapId: 'map-kampus-modern' },
	{ code: '555555', mapId: 'map-dataran-angin' },
	{ code: '666666', mapId: 'map-kota-pasar' }
]

export function isDemoRoomCode(code: string): boolean {
	return DEMO_ROOMS.some(room => room.code === code)
}
