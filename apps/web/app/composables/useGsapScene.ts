import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

export interface GsapSceneContext {
	gsap: typeof gsap
	ScrollTrigger: typeof ScrollTrigger
	/** true bila pengguna meminta animasi dikurangi; adegan cukup tampil diam. */
	reduced: boolean
}

/**
 * Menjalankan animasi GSAP setelah komponen terpasang di browser, dibatasi pada elemen `scope`.
 * Semua tween dan ScrollTrigger di dalamnya dibersihkan otomatis saat komponen dilepas,
 * dan dibuat ulang bila preferensi "kurangi gerakan" berubah.
 */
export function useGsapScene(
	scope: Ref<HTMLElement | null | undefined>,
	/** Boleh mengembalikan fungsi pembersih (misalnya untuk melepas ticker). */
	setup: (ctx: GsapSceneContext) => unknown
) {
	let mm: gsap.MatchMedia | null = null

	onMounted(() => {
		if (!scope.value) return
		if (!registered) {
			gsap.registerPlugin(ScrollTrigger)
			registered = true
		}
		mm = gsap.matchMedia(scope.value)
		mm.add(
			{ reduced: '(prefers-reduced-motion: reduce)', full: '(prefers-reduced-motion: no-preference)' },
			(ctx) => {
				const cleanup = setup({ gsap, ScrollTrigger, reduced: Boolean(ctx.conditions?.reduced) })
				return typeof cleanup === 'function' ? (cleanup as () => void) : undefined
			}
		)
	})

	onBeforeUnmount(() => {
		mm?.revert()
		mm = null
	})
}
