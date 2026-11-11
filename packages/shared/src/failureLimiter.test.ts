import { describe, expect, test } from 'bun:test'
import { createFailureLimiter } from './failureLimiter'

describe('createFailureLimiter', () => {
	test('memblokir setelah batas, lalu terbuka lagi setelah jendela waktu', () => {
		const limiter = createFailureLimiter({ max: 3, windowMs: 1000 })
		const ip = '1.2.3.4'
		limiter.fail(ip, 0)
		limiter.fail(ip, 100)
		expect(limiter.retryAfterMs(ip, 200)).toBe(0)
		limiter.fail(ip, 200)
		expect(limiter.retryAfterMs(ip, 300)).toBe(700)
		expect(limiter.retryAfterMs('5.6.7.8', 300)).toBe(0)
		expect(limiter.retryAfterMs(ip, 1001)).toBe(0)
	})

	test('reset menghapus catatan', () => {
		const limiter = createFailureLimiter({ max: 1, windowMs: 1000 })
		limiter.fail('a', 0)
		expect(limiter.retryAfterMs('a', 1)).toBeGreaterThan(0)
		limiter.reset('a')
		expect(limiter.retryAfterMs('a', 1)).toBe(0)
	})
})
