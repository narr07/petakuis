/**
 * Token host disimpan di browser guru yang membuat sesi, per kode sesi. Layar host
 * mengirimnya ke game server; tanpa token, layar host hanya bisa memantau room demo.
 */
const key = (code: string) => `petakuis_host_${code}`

export function rememberHostToken(code: string, token: string): void {
	try {
		localStorage.setItem(key(code), token)
	} catch {
		// Penyimpanan diblokir (mode privat): sesi tetap jalan, tetapi layar host di tab lain tidak bisa mengendalikan.
	}
}

export function readHostToken(code: string): string | undefined {
	try {
		return localStorage.getItem(key(code)) || undefined
	} catch {
		return undefined
	}
}
