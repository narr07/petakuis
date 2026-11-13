<script setup lang="ts">
	import { AVATAR_COLORWAYS } from '@petakuis/shared'

	/**
	 * Jendela game mini di hero: potongan peta Lembah Sunnyside (ukuran asli, ubin 16px)
	 * dengan avatar yang berjalan ke NPC penjaga pos soal lalu mendapat poin.
	 * Semua koordinat memakai piksel peta di dalam potongan ini; seluruh dunia diperbesar
	 * dengan satu transform sehingga sprite dan peta tetap sejajar di grid 16px.
	 */
	const MAP_SRC = '/maps/lembah-sunnyside.png'
	const CROP = { x: 320, y: 300, w: 320, h: 240 }

	const sprite = (id: string) => AVATAR_COLORWAYS.find(c => c.id === id)?.spriteUrl ?? AVATAR_COLORWAYS[0]!.spriteUrl

	// Posisi kaki di dalam potongan peta.
	const NPCS = [
		{ key: 'kiri', npcId: 'rambut-kuncir', x: 78, y: 140, flip: false },
		{ key: 'kanan', npcId: 'pak-botak', x: 228, y: 140, flip: true }
	] as const

	const WALKERS = {
		player: { sprite: sprite('merah-putih'), start: [160, 256] as [number, number] },
		passerby: { sprite: sprite('hijau-rimba'), start: [-20, 152] as [number, number] },
		visitor: { sprite: sprite('kuning-emas'), start: [160, -6] as [number, number] }
	}

	const root = ref<HTMLElement | null>(null)
	const worldScale = useWorldScale(root, CROP.w, 1.75)

	const score = ref(0)
	const posCleared = ref(0)
	const TOTAL_POS = 6
	const scoreLabel = computed(() => String(score.value).padStart(6, '0'))

	useGsapScene(root, ({ gsap, ScrollTrigger, reduced }) => {
		const el = root.value!
		const player = findWalker(el, 'player', 1)
		const passerby = findWalker(el, 'passerby', 1)
		const visitor = findWalker(el, 'visitor', 1)
		if (!player || !passerby || !visitor) return

		if (reduced) {
			placeWalker(player, 84, 170)
			paintWalker(player.sprite, 'up', 0, false, 1)
			placeWalker(passerby, 250, 152)
			placeWalker(visitor, 160, 78)
			return
		}

		// Gelembung "!" di atas NPC naik-turun patah-patah seperti sprite game.
		gsap.to('[data-bubble]', { y: -3, duration: 0.5, ease: 'steps(2)', repeat: -1, yoyo: true })
		gsap.to('[data-twinkle]', {
			keyframes: [{ scale: 1, opacity: 1 }, { scale: 0.4, opacity: 0.6 }, { scale: 0, opacity: 0 }],
			duration: 1.2,
			ease: 'steps(3)',
			repeat: -1,
			repeatDelay: 0.8,
			stagger: 0.7
		})

		const reward = (npcKey: string) => {
			score.value += 100
			posCleared.value = posCleared.value >= TOTAL_POS ? 1 : posCleared.value + 1
			const bubble = el.querySelector(`[data-bubble="${npcKey}"]`)
			const fx = el.querySelectorAll(`[data-reward="${npcKey}"]`)
			gsap.timeline()
				.to(bubble, { scale: 0, duration: 0.2, ease: 'steps(2)' })
				.fromTo(fx, { y: 0, opacity: 1 }, { y: -26, opacity: 0, duration: 1.1, ease: 'steps(8)', stagger: 0.08 }, '<')
				.to(bubble, { scale: 1, duration: 0.2, ease: 'steps(2)' }, '+=2.2')
			gsap.fromTo(el.querySelector('[data-score]'), { scale: 1.25 }, { scale: 1, duration: 0.3, ease: 'steps(3)' })
		}

		const playerTl = gsap.timeline({ repeat: -1, delay: 0.6 })
		addWalkRoute(playerTl, player, WALKERS.player.start, [
			{ to: [160, 170] },
			{ to: [84, 170] },
			{ wait: 1.4, face: 'up', call: () => reward('kiri') },
			{ to: [228, 170] },
			{ wait: 1.4, face: 'up', call: () => reward('kanan') },
			{ to: [160, 170] },
			{ to: [160, 256] },
			{ wait: 1.2 }
		], { speed: 34 })

		const passerbyTl = gsap.timeline({ repeat: -1, delay: 2 })
		addWalkRoute(passerbyTl, passerby, WALKERS.passerby.start, [
			{ to: [340, 152] },
			{ wait: 2.5 },
			{ to: [-20, 152] },
			{ wait: 3 }
		], { speed: 26 })

		const visitorTl = gsap.timeline({ repeat: -1, delay: 4 })
		addWalkRoute(visitorTl, visitor, WALKERS.visitor.start, [
			{ to: [160, 78] },
			{ wait: 2.2, face: 'down' },
			{ to: [160, -6] },
			{ wait: 5 }
		], { speed: 24 })

		// Hemat baterai: adegan berhenti saat jendela game tidak terlihat.
		const timelines = [playerTl, passerbyTl, visitorTl]
		ScrollTrigger.create({
			trigger: el,
			start: 'top bottom',
			end: 'bottom top',
			onToggle: self => timelines.forEach(t => (self.isActive ? t.resume() : t.pause()))
		})
	})
</script>

<template>
	<div
		ref="root"
		class="relative aspect-[4/3] w-full select-none overflow-hidden bg-[#62c64f]"
		role="img"
		aria-label="Cuplikan permainan: avatar siswa berjalan di peta piksel menuju pos soal dan mendapat poin"
	>
		<div
			class="absolute left-0 top-0 origin-top-left"
			:style="{ width: `${CROP.w}px`, height: `${CROP.h}px`, transform: `scale(${worldScale})` }"
		>
			<!-- Nuxt UI tidak punya komponen gambar biasa; peta adalah gambar dekoratif -->
			<img
				:src="MAP_SRC"
				alt=""
				draggable="false"
				class="pixelated absolute max-w-none"
				:style="{ left: `${-CROP.x}px`, top: `${-CROP.y}px`, width: '1024px', height: '768px' }"
			>

			<span data-twinkle class="absolute left-[156px] top-[88px] z-[500]">
				<PixelArt name="sparkle" :scale="1" />
			</span>
			<span data-twinkle class="absolute left-[244px] top-[84px] z-[500]">
				<PixelArt name="sparkle" :scale="1" />
			</span>

			<template v-for="npc in NPCS" :key="npc.key">
				<PixelNpc :npc-id="npc.npcId" :x="npc.x" :y="npc.y" :flip="npc.flip" />
				<span
					:data-bubble="npc.key"
					class="absolute z-[400] origin-bottom"
					:style="{ left: `${npc.x - 5}px`, top: `${npc.y - 32}px` }"
				>
					<PixelArt name="bubble" :scale="1" />
				</span>
				<span
					:data-reward="npc.key"
					class="absolute z-[401] opacity-0"
					:style="{ left: `${npc.x - 5}px`, top: `${npc.y - 30}px` }"
				>
					<PixelArt name="coin" :scale="1" />
				</span>
				<span
					:data-reward="npc.key"
					class="absolute z-[401] whitespace-nowrap font-pixel text-[9px] font-bold leading-none text-yellow-300 opacity-0 [text-shadow:1px_1px_0_#422006]"
					:style="{ left: `${npc.x + 7}px`, top: `${npc.y - 28}px` }"
				>+100</span>
			</template>

			<PixelWalker walker-id="visitor" :sprite-url="WALKERS.visitor.sprite" :x="WALKERS.visitor.start[0]" :y="WALKERS.visitor.start[1]" />
			<PixelWalker walker-id="passerby" :sprite-url="WALKERS.passerby.sprite" :x="WALKERS.passerby.start[0]" :y="WALKERS.passerby.start[1]" dir="right" />
			<PixelWalker walker-id="player" :sprite-url="WALKERS.player.sprite" :x="WALKERS.player.start[0]" :y="WALKERS.player.start[1]" dir="up" />
		</div>

		<!-- HUD ala game -->
		<div class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-black/45 px-3 py-2 font-pixel text-white">
			<div class="flex items-center gap-1">
				<PixelArt v-for="n in 3" :key="n" name="heart" :scale="2" />
			</div>
			<div class="flex items-center gap-3 text-sm sm:text-base">
				<span class="inline-flex items-center gap-1.5">
					<PixelArt name="flag" :scale="1.25" />
					POS {{ posCleared }}/{{ TOTAL_POS }}
				</span>
				<span data-score class="inline-flex items-center gap-1.5 text-yellow-300">
					<PixelArt name="coin" :scale="1.6" />
					{{ scoreLabel }}
				</span>
			</div>
		</div>
	</div>
</template>
