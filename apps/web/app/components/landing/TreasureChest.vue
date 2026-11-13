<script setup lang="ts">
	import { AVATAR_COLORWAYS } from '@petakuis/shared'

	/**
	 * Panggung CTA: peti harta di atas petak rumput 16x16, diapit dua avatar.
	 * Saat terlihat, peti bergoyang, terbuka, menyemburkan koin, dan kedua avatar melompat senang.
	 * Peti bisa diklik untuk diulang.
	 */
	const SCALE = 6
	const AVATAR_SCALE = 4
	const grass = pixelDataUri('grassTile')
	const cheerers = [
		{ id: 'cta-kiri', sprite: AVATAR_COLORWAYS.find(c => c.id === 'toska-laut')!.spriteUrl, dir: 'right' as const },
		{ id: 'cta-kanan', sprite: AVATAR_COLORWAYS.find(c => c.id === 'pramuka')!.spriteUrl, dir: 'left' as const }
	]

	const root = ref<HTMLElement | null>(null)
	const opened = ref(true)

	let play: (() => void) | null = null

	useGsapScene(root, ({ gsap, ScrollTrigger, reduced }) => {
		const el = root.value!
		if (reduced) return

		const chest = el.querySelector('[data-chest]')
		const coins = el.querySelectorAll('[data-coin]')
		const jumpers = el.querySelectorAll('[data-cheer]')

		gsap.to(el.querySelectorAll('[data-sparkle]'), {
			keyframes: [{ scale: 1, opacity: 1 }, { scale: 0.5, opacity: 0.7 }, { scale: 0, opacity: 0 }],
			duration: 1,
			ease: 'steps(3)',
			repeat: -1,
			repeatDelay: 0.6,
			stagger: 0.35
		})

		play = () => {
			opened.value = false
			gsap.timeline()
				.to(chest, { keyframes: [{ rotate: -6 }, { rotate: 6 }, { rotate: -4 }, { rotate: 0 }], duration: 0.5, ease: 'steps(4)' })
				.call(() => {
					opened.value = true
				})
				.fromTo(
					coins,
					{ x: 0, y: 0, opacity: 1, scale: 1 },
					{
						x: i => (i - (coins.length - 1) / 2) * 24,
						y: i => -80 - (i % 3) * 20,
						opacity: 0,
						scale: 0.6,
						duration: 1.1,
						ease: 'steps(9)',
						stagger: 0.04
					}
				)
				.to(jumpers, { y: -20, duration: 0.18, ease: 'steps(3)', yoyo: true, repeat: 3, stagger: 0.12 }, '<')
		}

		opened.value = false
		ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: () => play?.() })
		return () => {
			play = null
		}
	})
</script>

<template>
	<div ref="root" class="relative mx-auto w-full max-w-md select-none">
		<div class="relative z-10 flex h-64 items-end justify-center gap-6 pb-8">
			<span data-sparkle class="absolute left-[18%] top-6"><PixelArt name="sparkle" :scale="4" /></span>
			<span data-sparkle class="absolute right-[20%] top-2"><PixelArt name="sparkle" :scale="3" /></span>
			<span data-sparkle class="absolute right-[12%] top-24"><PixelArt name="sparkle" :scale="4" /></span>

			<div data-cheer class="relative">
				<span class="pixel-walker__shadow" />
				<div class="pixel-walker__sprite relative" :style="avatarSpriteStyle(cheerers[0]!.sprite, AVATAR_SCALE, cheerers[0]!.dir)" />
			</div>

			<div class="relative">
				<span
					v-for="n in 7"
					:key="n"
					data-coin
					class="absolute left-1/2 top-4 -ml-[15px] opacity-0"
				>
					<PixelArt name="coin" :scale="3" />
				</span>
				<!-- Elemen klik native: Nuxt UI tidak punya tombol tanpa gaya untuk ilustrasi -->
				<button
					type="button"
					data-chest
					class="relative block cursor-pointer"
					aria-label="Buka peti harta"
					@click="play?.()"
				>
					<PixelArt :name="opened ? 'chestOpen' : 'chestClosed'" :scale="SCALE" />
				</button>
			</div>

			<div data-cheer class="relative">
				<span class="pixel-walker__shadow" />
				<div class="pixel-walker__sprite relative" :style="avatarSpriteStyle(cheerers[1]!.sprite, AVATAR_SCALE, cheerers[1]!.dir)" />
			</div>
		</div>

		<!-- Petak rumput tempat peti berdiri -->
		<div
			class="pixel-shadow absolute inset-x-4 bottom-0 h-12 border-4 border-[#3b2412]/70"
			:style="{ backgroundImage: grass, backgroundSize: '48px 48px' }"
			aria-hidden="true"
		/>
	</div>
</template>
