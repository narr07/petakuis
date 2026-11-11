/**
 * Pembatas percobaan gagal per kunci (misalnya IP), disimpan di memori proses.
 *
 * Dipakai untuk tebakan PIN: setelah `max` kegagalan dalam `windowMs`, kunci itu diblokir sampai
 * kegagalan tertua keluar dari jendela waktu. Batasnya longgar karena satu kelas biasanya keluar
 * lewat satu IP sekolah; ruang PIN 900.000 kode tetap tidak bisa ditebak dengan puluhan percobaan.
 */
export interface FailureLimiter {
	/** Sisa waktu blokir dalam milidetik; 0 bila tidak diblokir. */
	retryAfterMs(key: string, now?: number): number
	/** Catat satu kegagalan. */
	fail(key: string, now?: number): void
	/** Hapus catatan (misalnya setelah berhasil). */
	reset(key: string): void
}

export function createFailureLimiter(options: { max: number, windowMs: number, maxKeys?: number }): FailureLimiter {
	const { max, windowMs, maxKeys = 10_000 } = options
	const failures = new Map<string, number[]>()

	function recent(key: string, now: number): number[] {
		const list = (failures.get(key) ?? []).filter(t => now - t < windowMs)
		if (list.length) failures.set(key, list)
		else failures.delete(key)
		return list
	}

	return {
		retryAfterMs(key, now = Date.now()) {
			const list = recent(key, now)
			if (list.length < max) return 0
			return windowMs - (now - list[list.length - max]!)
		},
		fail(key, now = Date.now()) {
			const list = recent(key, now)
			list.push(now)
			failures.set(key, list)
			// Batasi pemakaian memori bila banyak IP berbeda mencoba.
			if (failures.size > maxKeys) {
				const oldest = failures.keys().next().value
				if (oldest !== undefined) failures.delete(oldest)
			}
		},
		reset(key) {
			failures.delete(key)
		}
	}
}

/** Teks "x menit" untuk pesan ke pengguna. */
export function describeWait(ms: number): string {
	const minutes = Math.max(1, Math.ceil(ms / 60_000))
	return `${minutes} menit`
}
