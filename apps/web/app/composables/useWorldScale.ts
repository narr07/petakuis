/**
 * Skala "dunia" piksel supaya potongan peta selebar `worldWidth` px selalu memenuhi lebar elemen.
 * Memakai ResizeObserver langsung; `fallback` dipakai saat render server.
 */
export function useWorldScale(el: Ref<HTMLElement | null>, worldWidth: number, fallback: number) {
	const scale = ref(fallback)
	let observer: ResizeObserver | null = null

	onMounted(() => {
		if (!el.value) return
		const update = () => {
			const w = el.value?.clientWidth ?? 0
			if (w > 0) scale.value = w / worldWidth
		}
		update()
		observer = new ResizeObserver(update)
		observer.observe(el.value)
	})

	onBeforeUnmount(() => {
		observer?.disconnect()
		observer = null
	})

	return scale
}
