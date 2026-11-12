<script setup lang="ts">
	/**
	 * Joystick analog layar sentuh: geser ibu jari ke segala arah (termasuk serong).
	 * Mengirim vektor arah dengan panjang 0–1 (makin jauh digeser, makin cepat).
	 * Nuxt UI tidak punya komponen joystick, jadi ini elemen sendiri.
	 */
	const props = withDefaults(defineProps<{
		/** Jari-jari lingkaran dasar dalam piksel. */
		radius?: number
		/** Zona mati di tengah (0–1) agar sentuhan kecil tidak menggerakkan pemain. */
		deadZone?: number
		disabled?: boolean
	}>(), {
		radius: 56,
		deadZone: 0.15,
		disabled: false
	})

	const emit = defineEmits<{
		/** x, y: arah ternormalisasi dikali kekuatan (0 bila dilepas). */
		change: [x: number, y: number]
	}>()

	const baseEl = ref<HTMLDivElement | null>(null)
	const knobX = ref(0)
	const knobY = ref(0)
	const activePointer = ref<number | null>(null)

	function update(e: PointerEvent) {
		const el = baseEl.value
		if (!el) return
		const rect = el.getBoundingClientRect()
		let dx = e.clientX - (rect.left + rect.width / 2)
		let dy = e.clientY - (rect.top + rect.height / 2)
		const dist = Math.hypot(dx, dy)
		if (dist > props.radius) {
			dx = (dx / dist) * props.radius
			dy = (dy / dist) * props.radius
		}
		knobX.value = dx
		knobY.value = dy

		const strength = Math.min(1, dist / props.radius)
		if (strength < props.deadZone) {
			emit('change', 0, 0)
			return
		}
		// Kekuatan dipetakan ulang dari zona mati sampai tepi menjadi 0..1.
		const scaled = (strength - props.deadZone) / (1 - props.deadZone)
		const len = Math.hypot(dx, dy) || 1
		emit('change', (dx / len) * scaled, (dy / len) * scaled)
	}

	function onDown(e: PointerEvent) {
		if (props.disabled || activePointer.value !== null) return
		activePointer.value = e.pointerId
		baseEl.value?.setPointerCapture(e.pointerId)
		update(e)
	}

	function onMove(e: PointerEvent) {
		if (e.pointerId !== activePointer.value) return
		update(e)
	}

	function release(e?: PointerEvent) {
		if (e && e.pointerId !== activePointer.value) return
		activePointer.value = null
		knobX.value = 0
		knobY.value = 0
		emit('change', 0, 0)
	}

	watch(() => props.disabled, (off) => {
		if (off) release()
	})
</script>

<template>
	<div
		ref="baseEl"
		role="application"
		aria-label="Joystick gerak: geser ke segala arah"
		class="relative touch-none select-none rounded-full border-2 border-white/70 bg-black/25 shadow-lg backdrop-blur-sm"
		:class="disabled ? 'opacity-40' : ''"
		:style="{ width: `${radius * 2}px`, height: `${radius * 2}px` }"
		@pointerdown.stop.prevent="onDown"
		@pointermove="onMove"
		@pointerup="release"
		@pointercancel="release"
		@lostpointercapture="release"
	>
		<!-- Penanda arah -->
		<span class="pointer-events-none absolute inset-2 rounded-full border border-white/25" />
		<!-- Kenop -->
		<span
			class="pointer-events-none absolute left-1/2 top-1/2 size-12 rounded-full border-2 border-white bg-white/85 shadow-md"
			:class="activePointer !== null ? '' : 'transition-transform duration-150'"
			:style="{ transform: `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))` }"
		/>
	</div>
</template>
