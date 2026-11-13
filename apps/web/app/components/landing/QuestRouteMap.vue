<script setup lang="ts">
	import { AVATAR_COLORWAYS } from '@petakuis/shared'

	/**
	 * Peta rute "Cara kerja": saat halaman digulir, avatar berjalan melewati empat bendera
	 * (satu per langkah) lalu membuka peti harta. Langkah di daftar UPageSection induknya
	 * ikut menyala sesuai bendera yang sudah dilewati.
	 */
	const MAP_SRC = '/maps/lembah-sunnyside.png'
	const CROP = { x: 128, y: 336, w: 384, h: 288 }

	const ROUTE: [number, number][] = [[32, 36], [32, 112], [352, 112], [352, 272], [192, 272]]
	/** Jarak tempuh (px peta) saat tiap langkah tercapai. */
	const STEP_AT = [0, 236, 488, 716]
	const FLAGS = [
		{ x: 42, y: 40 },
		{ x: 192, y: 102 },
		{ x: 362, y: 206 }
	]
	const CHEST = { x: 166, y: 262 }
	const routePoints = ROUTE.map(p => p.join(',')).join(' ')
	const playerSprite = AVATAR_COLORWAYS.find(c => c.id === 'batik-biru')?.spriteUrl ?? AVATAR_COLORWAYS[0]!.spriteUrl

	const root = ref<HTMLElement | null>(null)
	const worldScale = useWorldScale(root, CROP.w, 1.45)

	const reached = ref(STEP_AT.length)
	const opened = computed(() => reached.value >= STEP_AT.length)

	useGsapScene(root, ({ gsap, ScrollTrigger, reduced }) => {
		const el = root.value!
		const walker = findWalker(el, 'route', 1)
		const progress = el.querySelector<SVGPolylineElement>('[data-route-progress]')
		const section = el.closest<HTMLElement>('.quest-steps') ?? el
		const items = Array.from(section.querySelectorAll<HTMLElement>('[data-slot="features"] > li'))
		if (!walker || !progress) return

		const total = STEP_AT[STEP_AT.length - 1]!
		const markReached = (count: number) => {
			items.forEach((li, i) => li.classList.toggle('is-reached', i < count))
			el.querySelectorAll<HTMLElement>('[data-flag]').forEach((f, i) => f.classList.toggle('grayscale', i >= count))
		}

		if (reduced) {
			placeWalker(walker, ROUTE[ROUTE.length - 1]![0], ROUTE[ROUTE.length - 1]![1])
			paintWalker(walker.sprite, 'left', 0, false, 1)
			progress.style.strokeDasharray = `${total} 9999`
			reached.value = STEP_AT.length
			markReached(STEP_AT.length)
			return
		}

		section.classList.add('is-scrubbing')
		reached.value = 1
		markReached(1)

		const burst = () => {
			gsap.fromTo(
				el.querySelectorAll('[data-chest-coin]'),
				{ x: 0, y: 0, opacity: 1 },
				{
					x: i => (i - 2) * 9,
					y: i => -22 - (i % 2) * 8,
					opacity: 0,
					duration: 0.9,
					ease: 'steps(7)',
					stagger: 0.04
				}
			)
		}

		const onMove = (d: number) => {
			progress.style.strokeDasharray = `${Math.round(d)} 9999`
			const count = STEP_AT.filter(at => d >= at - 1).length
			if (count !== reached.value) {
				const wasOpen = reached.value >= STEP_AT.length
				reached.value = count
				markReached(count)
				if (!wasOpen && count >= STEP_AT.length) burst()
			}
		}

		const tl = gsap.timeline({ paused: true })
		addWalkRoute(tl, walker, ROUTE[0]!, ROUTE.slice(1).map(to => ({ to })), { speed: 60, stepPx: 6, onMove })

		ScrollTrigger.create({
			trigger: section,
			start: 'top 65%',
			end: 'bottom 75%',
			scrub: 0.5,
			animation: tl
		})

		gsap.to(el.querySelectorAll('[data-flag]'), { skewX: -8, duration: 0.4, ease: 'steps(2)', repeat: -1, yoyo: true, stagger: 0.2 })

		return () => {
			section.classList.remove('is-scrubbing')
			items.forEach(li => li.classList.remove('is-reached'))
		}
	})
</script>

<template>
	<div
		ref="root"
		class="relative aspect-[4/3] w-full select-none overflow-hidden bg-[#62c64f]"
		role="img"
		aria-label="Rute misi di peta: empat bendera untuk empat langkah, berakhir di peti harta"
	>
		<div
			class="absolute left-0 top-0 origin-top-left"
			:style="{ width: `${CROP.w}px`, height: `${CROP.h}px`, transform: `scale(${worldScale})` }"
		>
			<img
				:src="MAP_SRC"
				alt=""
				draggable="false"
				loading="lazy"
				class="pixelated absolute max-w-none"
				:style="{ left: `${-CROP.x}px`, top: `${-CROP.y}px`, width: '1024px', height: '768px' }"
			>

			<svg class="absolute inset-0 z-[5]" :viewBox="`0 0 ${CROP.w} ${CROP.h}`" :width="CROP.w" :height="CROP.h" shape-rendering="crispEdges">
				<polyline :points="routePoints" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="3 5" />
				<polyline data-route-progress :points="routePoints" fill="none" stroke="#facc15" stroke-width="3" stroke-dasharray="716 9999" />
			</svg>

			<span
				v-for="(f, i) in FLAGS"
				:key="i"
				data-flag
				class="absolute origin-bottom-left transition-[filter] duration-200"
				:style="{ left: `${f.x}px`, top: `${f.y - 14}px`, zIndex: 10 + f.y }"
			>
				<PixelArt name="flag" :scale="1" />
				<span class="absolute -top-3 left-2.5 font-mono text-[10px] font-bold leading-none text-white [text-shadow:1px_1px_0_#18181b]">{{ i + 1 }}</span>
			</span>

			<div class="absolute" :style="{ left: `${CHEST.x}px`, top: `${CHEST.y}px`, zIndex: 10 + CHEST.y + 13 }">
				<PixelArt :name="opened ? 'chestOpen' : 'chestClosed'" :scale="1" />
				<span
					v-for="n in 5"
					:key="n"
					data-chest-coin
					class="absolute left-1 top-0 opacity-0"
				>
					<PixelArt name="coin" :scale="0.8" />
				</span>
			</div>

			<PixelWalker walker-id="route" :sprite-url="playerSprite" :x="ROUTE[ROUTE.length - 1]![0]" :y="ROUTE[ROUTE.length - 1]![1]" dir="left" />
		</div>

		<div class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-black/45 px-2.5 py-1 font-pixel text-xs text-white">
			<span>RUTE MISI</span>
			<span class="text-yellow-300">LANGKAH {{ Math.min(reached, STEP_AT.length) }}/{{ STEP_AT.length }}</span>
		</div>
	</div>
</template>
