/**
 * Mengirim email lewat API Resend. Tanpa NUXT_RESEND_API_KEY (misalnya saat pengembangan),
 * isi email dicatat di log server sehingga tautan reset tetap bisa diuji.
 */
export async function sendEmail(message: { to: string, subject: string, html: string, text: string }): Promise<void> {
	const config = useRuntimeConfig()
	if (!config.resendApiKey) {
		recordWebLog('warn', 'email', `NUXT_RESEND_API_KEY kosong; email ke ${message.to} tidak dikirim. Isi: ${message.text}`)
		return
	}
	const resp = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${config.resendApiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: config.mailFrom,
			to: [message.to],
			subject: message.subject,
			html: message.html,
			text: message.text
		})
	})
	if (!resp.ok) {
		const detail = await resp.text().catch(() => '')
		recordWebLog('error', 'email', `Gagal mengirim email ke ${message.to} (status ${resp.status}) ${detail.slice(0, 200)}`)
		throw new Error('Email gagal dikirim')
	}
	recordWebLog('success', 'email', `Email "${message.subject}" terkirim ke ${message.to}`)
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[c]!)

export function verifyEmailMessage(name: string, url: string) {
	const safeName = escapeHtml(name || 'Guru')
	const safeUrl = escapeHtml(url)
	return {
		subject: 'Konfirmasi email akun Petakuis',
		text: `Halo ${name || 'Guru'}, buka tautan ini untuk mengaktifkan akun Petakuis-mu (berlaku 24 jam): ${url}\n\nAbaikan email ini bila kamu tidak mendaftar.`,
		html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.6;color:#18181b">
	<h2 style="margin:0 0 12px">Aktifkan akunmu</h2>
	<p>Halo ${safeName},</p>
	<p>Terima kasih sudah mendaftar di Petakuis. Tekan tombol di bawah untuk mengonfirmasi email dan langsung masuk. Tautan berlaku 24 jam.</p>
	<p style="margin:24px 0"><a href="${safeUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Konfirmasi email</a></p>
	<p style="font-size:13px;color:#71717a">Abaikan email ini bila kamu tidak mendaftar.</p>
</div>`
	}
}

export function resetPasswordEmail(name: string, url: string) {
	const safeName = escapeHtml(name || 'Guru')
	const safeUrl = escapeHtml(url)
	return {
		subject: 'Atur ulang kata sandi Petakuis',
		text: `Halo ${name || 'Guru'}, buka tautan ini untuk membuat kata sandi baru (berlaku 1 jam): ${url}\n\nAbaikan email ini bila kamu tidak memintanya.`,
		html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.6;color:#18181b">
	<h2 style="margin:0 0 12px">Atur ulang kata sandi</h2>
	<p>Halo ${safeName},</p>
	<p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Petakuis-mu. Tautan ini berlaku 1 jam.</p>
	<p style="margin:24px 0"><a href="${safeUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Buat kata sandi baru</a></p>
	<p style="font-size:13px;color:#71717a">Abaikan email ini bila kamu tidak memintanya; kata sandimu tidak berubah.</p>
</div>`
	}
}
