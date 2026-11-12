/**
 * Memotret halaman (berkas lokal atau URL) dengan Edge headless lewat CDP.
 *   bun capture.ts <url|berkas.html> <lebar> <tinggi> <keluaran.png> [dpr] [layar-sentuh: 0/1] [tunggu-ms]
 * Dipakai untuk feature graphic dan screenshot Play Store.
 */
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [src, w, h, out, dpr = '1', touch = '0', waitMs = '4000'] = process.argv.slice(2)
if (!src || !w || !h || !out) throw new Error('pakai: bun capture.ts <url|berkas> <lebar> <tinggi> <keluaran.png> [dpr] [sentuh] [tunggu]')
const url = /^https?:/.test(src) ? src : pathToFileURL(resolve(src)).href

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const port = 9400 + Math.floor(Math.random() * 400)
const profile = mkdtempSync(join(tmpdir(), 'petakuis-capture-'))
const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' })
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

await cdp('Page.enable')
await cdp('Emulation.setDeviceMetricsOverride', { width: Number(w), height: Number(h), deviceScaleFactor: Number(dpr), mobile: touch === '1' })
if (touch === '1') await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await cdp('Page.navigate', { url })
await new Promise(r => setTimeout(r, Number(waitMs)))
const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
writeFileSync(out, Buffer.from(data, 'base64'))
console.log(`tersimpan ${out} (${Number(w) * Number(dpr)}x${Number(h) * Number(dpr)})`)
ws.close(); proc.kill(); process.exit(0)
