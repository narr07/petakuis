<script setup lang="ts">
	import { AVATAR_COLORWAYS } from '@petakuis/shared'

	/**
	 * Pita jalan tanah dari ubin 16x16 (diperbesar 3x) tempat kedelapan avatar berbaris
	 * berjalan tanpa henti. Posisi dihitung dari waktu pada ticker GSAP, frame langkah dari jarak.
	 */
	const SCALE = 3
	const TILE = 16 * SCALE
	const FOOT_Y = 92
	const GAP = 150
	const SPEED = 46

	const avatars = AVATAR_COLORWAYS.map((c, i) => ({ id: c.id, label: c.label, sprite: c.spriteUrl, offset: i * GAP }))
	const loopLength = avatars.length * GAP

	const coins = [12, 31, 55, 78, 93]
	const grass = pixelDataUri('grassTile')
	const dirt = pixelDataUri('dirtTile')

	const root = ref<HTMLElement | null>(null)

	useGsapScene(root, ({ gsap, ScrollTrigger, reduced }) => {
		const el = root.value!
		const handles = avatars
			.map(a => findWalker(el, a.id, SCALE))
			.filter((h): h is WalkerHandle => Boolean(h))

		if (reduced) return

		gsap.to('[data-parade-coin]', { scaleX: 0.2, duration: 0.6, ease: 'steps(3)', repeat: -1, yoyo: true, stagger: 0.15 })

		let elapsed = 0
		let active = true
		const tick = (_time: number, deltaMs: number) => {
			if (!active) return
			elapsed += Math.min(deltaMs, 100) / 1000
			const width = el.clientWidth
			// Satu putaran selebar layar (minimal panjang barisan); avatar dibagi rata di sepanjang putaran.
			const span = Math.max(width + 2 * TILE, loopLength)
			handles.forEach((h, i) => {
				const travelled = elapsed * SPEED + (i / handles.length) * span
				const x = (travelled % span) - TILE
				placeWalker(h, x, FOOT_Y)
				paintWalker(h.sprite, 'right', Math.floor(travelled / 14), true, SCALE)
			})
		}
		gsap.ticker.add(tick)

		// Sesekali satu avatar melompat kecil.
		const hop = gsap.delayedCall(1.6, function jump() {
			const target = el.querySelectorAll('[data-hop]')[Math.floor(Math.random() * avatars.length)]
			if (target) gsap.to(target, { y: -18, duration: 0.18, ease: 'steps(3)', yoyo: true, repeat: 1 })
			hop.restart(true)
		})

		ScrollTrigger.create({
			trigger: el,
			start: 'top bottom',
			end: 'bottom top',
			onToggle: (self) => {
				active = self.isActive
			}
		})

		return () => gsap.ticker.remove(tick)
	})
</script>

<template>
	<div
		ref="root"
		class="relative h-28 w-full select-none overflow-hidden border-y-4 border-[#3b2412]/70"
		:style="{ backgroundImage: grass, backgroundSize: `${TILE}px ${TILE}px` }"
		role="img"
		aria-label="Barisan delapan avatar siswa berjalan di jalan setapak piksel"
	>
		<div
			class="absolute inset-x-0 top-[44px] h-[52px] border-y-2 border-[#9a5f39]/60"
			:style="{ backgroundImage: dirt, backgroundSize: `${TILE}px ${TILE}px` }"
		/>

		<span
			v-for="(left, i) in coins"
			:key="i"
			data-parade-coin
			class="absolute top-2.5"
			:style="{ left: `${left}%` }"
		>
			<PixelArt name="coin" :scale="2.5" />
		</span>

		<div
			v-for="(a, i) in avatars"
			:key="a.id"
			class="pixel-walker"
			:data-walker="a.id"
			:title="a.label"
			:style="{ transform: walkerTransform(i * GAP - TILE + TILE, FOOT_Y, SCALE), zIndex: 10 }"
		>
			<span class="pixel-walker__shadow" />
			<div data-hop class="relative">
				<div class="pixel-walker__sprite relative" :style="avatarSpriteStyle(a.sprite, SCALE, 'right')" />
			</div>
		</div>
	</div>
</template>
