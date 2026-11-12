/**
 * Screenshot HP untuk Play Store (1080x1920 = 360x640 @3x, layar sentuh) dari situs online.
 *   bun screenshots.ts [url-situs]
 */
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const WEB = process.argv[2] || 'https://petakuis.permadi.dev'
const OUT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const port = 9450
const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'petakuis-shots-'))}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
let wsUrl = ''
for (let i = 0; i < 60 && !wsUrl; i++) {
	try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t: { type: string }) => t.type === 'page')?.webSocketDebuggerUrl } catch {}
	if (!wsUrl) await new Promise(r => setTimeout(r, 300))
}
const ws = new WebSocket(wsUrl)
await new Promise(r => ws.addEventListener('open', r))
let id = 0
const pending = new Map<number, (v: unknown) => void>()
ws.addEventListener('message', (e) => { const m = JSON.parse(String(e.data)); if (m.id && pending.has(m.id)) { pending.get(m.id)!(m.result); pending.delete(m.id) } })
const cdp = (method: string, params: object = {}) => new Promise<any>((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const evalJs = async (expr: string) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value

await cdp('Page.enable'); await cdp('Runtime.enable')
await cdp('Emulation.setDeviceMetricsOverride', { width: 360, height: 640, deviceScaleFactor: 3, mobile: true })
await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })

async function shot(name: string) {
	const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
	writeFileSync(`${OUT}${name}.png`, Buffer.from(data, 'base64'))
	console.log('tersimpan', name)
}
async function go(path: string, ms: number) {
	await cdp('Page.navigate', { url: WEB + path })
	await wait(ms)
}
async function tap(x: number, y: number) {
	await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 7 }] })
	await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
/** Ketuk elemen (tombol/tautan/switch) yang teksnya atau aria-label-nya mengandung `text`. */
async function tapText(text: string) {
	const c = await evalJs(`(() => { const el = [...document.querySelectorAll('button,a,[role=switch]')].find(e => e.getBoundingClientRect().width > 0 && ((e.textContent || '').includes(${JSON.stringify(text)}) || (e.getAttribute('aria-label') || '').includes(${JSON.stringify(text)}))); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`)
	if (c) await tap(c[0], c[1])
	return Boolean(c)
}

// 1. Halaman masuk PIN + pilih karakter
await go('/join?code=123456', 6000)
await evalJs(`(() => { const el = document.querySelector('input[placeholder^="Contoh"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, 'Budi Kelas 5A'); el.dispatchEvent(new Event('input', { bubbles: true })) })()`)
await wait(500)
await shot('screenshot-1-masuk-pin')

// 2. Bermain di peta (joystick + HUD)
await go('/play/123456?nickname=Budi&colorway=merah-putih', 11000)
await shot('screenshot-2-peta')

// 3. Menu permainan
await tapText('Buka menu permainan'); await wait(1500)
await shot('screenshot-3-menu')

// 4. Jendela soal: aktifkan mode aksesibel dari menu, tutup menu, buka soal
{ const c = await evalJs("(() => { const r = document.querySelector('[role=dialog] [role=switch]')?.getBoundingClientRect(); return r ? [r.left + r.width / 2, r.top + r.height / 2] : null })()"); console.log('switch aksesibel:', Boolean(c)); if (c) await tap(c[0], c[1]); await wait(1500) }
await tapText('Lanjutkan bermain'); await wait(1200)
const opened = await tapText('Buka Soal #'); await wait(2500)
console.log('jendela soal dibuka:', opened)
await shot('screenshot-4-soal')

// 5. Jelajah kuis
await go('/explore', 6000)
await evalJs('window.scrollTo(0, 560)'); await wait(800)
await shot('screenshot-5-jelajah')

ws.close(); proc.kill(); process.exit(0)
