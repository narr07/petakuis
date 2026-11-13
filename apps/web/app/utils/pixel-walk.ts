import type { gsap } from 'gsap'

/**
 * Menggerakkan sprite avatar 16x16 (paket Ninja Adventure, 9 frame mendatar) di sepanjang rute.
 * Urutan frame sama dengan GameCanvas: 0/1/2 diam (bawah/atas/samping), 3-4, 5-6, 7-8 berjalan.
 */
export type WalkDir = 'down' | 'up' | 'left' | 'right'

export const AVATAR_FRAME_PX = 16
const AVATAR_FRAME_COUNT = 9

const WALK_FRAMES: Record<WalkDir, readonly [number, number, number, number]> = {
	down: [0, 3, 0, 4],
	up: [1, 5, 1, 6],
	left: [2, 7, 2, 8],
	right: [2, 7, 2, 8]
}

export function avatarSpriteStyle(spriteUrl: string, scale: number, dir: WalkDir = 'down') {
	const idx = WALK_FRAMES[dir][0]
	return {
		width: `${AVATAR_FRAME_PX * scale}px`,
		height: `${AVATAR_FRAME_PX * scale}px`,
		backgroundImage: `url(${spriteUrl})`,
		backgroundSize: `${AVATAR_FRAME_COUNT * AVATAR_FRAME_PX * scale}px ${AVATAR_FRAME_PX * scale}px`,
		backgroundPosition: `${-idx * AVATAR_FRAME_PX * scale}px 0px`,
		'--flip': dir === 'right' ? '-1' : '1'
	}
}

export function paintWalker(sprite: HTMLElement, dir: WalkDir, step: number, moving: boolean, scale: number): void {
	const seq = WALK_FRAMES[dir]
	const idx = moving ? seq[step % 4]! : seq[0]
	sprite.style.backgroundPosition = `${-idx * AVATAR_FRAME_PX * scale}px 0px`
	sprite.style.setProperty('--flip', dir === 'right' ? '-1' : '1')
}

export interface WalkerHandle {
	wrapper: HTMLElement
	sprite: HTMLElement
	/** Skala sprite (1 = 16px). */
	scale: number
}

/** Titik (x, y) adalah posisi kaki: tengah bawah sprite. Urutan tumpuk mengikuti y. */
export function placeWalker(h: WalkerHandle, x: number, y: number): void {
	h.wrapper.style.transform = walkerTransform(x, y, h.scale)
	h.wrapper.style.zIndex = String(10 + Math.round(y))
}

export function walkerTransform(x: number, y: number, scale: number): string {
	const size = AVATAR_FRAME_PX * scale
	return `translate(${Math.round(x - size / 2)}px, ${Math.round(y - size)}px)`
}

/** Mengambil elemen avatar yang ditandai data-walker="<id>" di dalam root. */
export function findWalker(root: HTMLElement, id: string, scale: number): WalkerHandle | null {
	const wrapper = root.querySelector<HTMLElement>(`[data-walker="${id}"]`)
	const sprite = wrapper?.querySelector<HTMLElement>('.pixel-walker__sprite')
	return wrapper && sprite ? { wrapper, sprite, scale } : null
}

export type RouteStep =
	| { to: [number, number] }
	| { wait: number, face?: WalkDir, call?: () => void }

export function directionOf(dx: number, dy: number): WalkDir {
	if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
	return dy >= 0 ? 'down' : 'up'
}

/**
 * Menambahkan rute ke timeline GSAP. Frame langkah dihitung dari jarak tempuh, bukan waktu,
 * sehingga tetap benar saat timeline digulir maju-mundur oleh ScrollTrigger.
 */
export function addWalkRoute(
	tl: gsap.core.Timeline,
	h: WalkerHandle,
	start: [number, number],
	steps: RouteStep[],
	opts: { speed: number, stepPx?: number, onMove?: (distance: number) => void }
): { distance: number } {
	const stepPx = opts.stepPx ?? 5
	let cur: [number, number] = [...start]
	let lastDir: WalkDir = 'down'
	let cum = 0

	placeWalker(h, start[0], start[1])
	paintWalker(h.sprite, lastDir, 0, false, h.scale)

	for (const s of steps) {
		if ('to' in s) {
			const [fx, fy] = cur
			const [tx, ty] = s.to
			const len = Math.hypot(tx - fx, ty - fy)
			if (len === 0) continue
			const dir = directionOf(tx - fx, ty - fy)
			const base = cum
			const p = { t: 0 }
			tl.to(p, {
				t: 1,
				duration: len / opts.speed,
				ease: 'none',
				onUpdate: () => {
					placeWalker(h, fx + (tx - fx) * p.t, fy + (ty - fy) * p.t)
					const d = base + len * p.t
					paintWalker(h.sprite, dir, Math.floor(d / stepPx), p.t > 0 && p.t < 1, h.scale)
					opts.onMove?.(d)
				}
			})
			cum += len
			cur = [tx, ty]
			lastDir = dir
		} else {
			const at: [number, number] = [...cur]
			const face: WalkDir = s.face ?? lastDir
			tl.call(() => {
				placeWalker(h, at[0], at[1])
				paintWalker(h.sprite, face, 0, false, h.scale)
				s.call?.()
			})
			tl.to({}, { duration: s.wait })
			lastDir = face
		}
	}
	return { distance: cum }
}
