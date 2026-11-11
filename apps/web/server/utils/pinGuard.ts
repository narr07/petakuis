import type { H3Event } from 'h3'
import { createFailureLimiter, describeWait } from '@petakuis/shared'

/** 40 PIN salah per 10 menit per IP (satu kelas bisa memakai satu IP sekolah). */
const pinFailures = createFailureLimiter({ max: 40, windowMs: 10 * 60_000 })

/** IP pengunjung. Di produksi diisi Cloudflare (port aplikasi hanya terikat ke 127.0.0.1). */
export function clientIp(event: H3Event): string {
	return getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

/** Melempar 429 bila IP ini terlalu sering salah memasukkan PIN. */
export function assertPinAttemptAllowed(event: H3Event): void {
	const wait = pinFailures.retryAfterMs(clientIp(event))
	if (wait > 0) {
		setHeader(event, 'Retry-After', Math.ceil(wait / 1000))
		throw createError({
			statusCode: 429,
			statusMessage: `Terlalu banyak PIN salah. Coba lagi dalam ${describeWait(wait)}.`
		})
	}
}

export function recordPinFailure(event: H3Event): void {
	pinFailures.fail(clientIp(event))
}
