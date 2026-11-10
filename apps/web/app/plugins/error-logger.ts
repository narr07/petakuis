export default defineNuxtPlugin(() => {
	if (typeof window !== 'undefined') {
		if (
			typeof HTMLInputElement !== 'undefined' &&
			!('defaultValue' in HTMLInputElement.prototype)
		) {
			Object.defineProperty(HTMLInputElement.prototype, 'defaultValue', {
				get() {
					return this.getAttribute?.('value') || this.value || ''
				},
				set(v: unknown) {
					this.setAttribute?.('value', String(v ?? ''))
				}
			})
		}
		if (
			typeof HTMLTextAreaElement !== 'undefined' &&
			!('defaultValue' in HTMLTextAreaElement.prototype)
		) {
			Object.defineProperty(HTMLTextAreaElement.prototype, 'defaultValue', {
				get() {
					return this.textContent || this.value || ''
				},
				set(v: unknown) {
					this.textContent = String(v ?? '')
				}
			})
		}
	}
})
