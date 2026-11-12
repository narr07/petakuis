<script setup lang="ts">
	import type { LegalSection } from '~/components/LegalPage.vue'

	useSeoMeta({
		title: 'Kebijakan Privasi',
		description: 'Data apa yang dikumpulkan Petakuis, untuk apa, dan bagaimana menghapusnya.'
	})

	const sections: LegalSection[] = [
		{
			title: 'Data yang kami simpan',
			items: [
				'Akun guru dan siswa: nama, alamat email, peran (Guru atau Siswa), dan kata sandi dalam bentuk hash (kata sandi asli tidak pernah disimpan).',
				'Login dengan Google: nama, alamat email, dan foto profil dari akun Google. Kami tidak meminta akses ke Gmail, Drive, kontak, atau data Google lainnya.',
				'Sesi login: cookie sesi, alamat IP, dan jenis browser, untuk menjaga akun tetap masuk dan mendeteksi penyalahgunaan.',
				'Kuis buatan guru: judul, soal, kunci jawaban, dan peta yang dipilih.',
				'Permainan: nama panggilan yang diketik siswa, jawaban, skor, dan waktu menjawab dalam satu sesi kuis. Siswa bisa bermain dengan PIN tanpa membuat akun.'
			]
		},
		{
			title: 'Untuk apa data dipakai',
			items: [
				'Masuk ke akun dan memisahkan kuis milik masing-masing guru.',
				'Menjalankan sesi kuis langsung, menghitung skor, dan menampilkan laporan nilai kepada guru yang membuat sesi.',
				'Mengirim email konfirmasi akun dan tautan atur ulang kata sandi.'
			],
			paragraphs: ['Petakuis tidak menampilkan iklan, tidak menjual data, dan tidak membagikan data kepada pihak lain untuk pemasaran.']
		},
		{
			title: 'Layanan pihak ketiga',
			items: [
				'Google: hanya bila kamu memilih "Masuk dengan Google".',
				'Resend: pengiriman email konfirmasi dan atur ulang kata sandi.',
				'Cloudflare: jaringan dan perlindungan situs; lalu lintas melewati Cloudflare sebelum sampai ke server kami.',
				'Google Gemini: hanya bila guru memakai fitur buat soal dengan AI. Teks topik yang diketik guru dikirim ke Gemini. Kunci API pribadi yang dimasukkan guru dipakai untuk permintaan itu saja dan tidak disimpan di server.'
			]
		},
		{
			title: 'Penyimpanan di browser',
			paragraphs: ['Petakuis memakai cookie sesi untuk login dan penyimpanan lokal browser untuk menyambung kembali ke permainan serta kontrol host milik guru. Tidak ada cookie pelacak atau analitik pihak ketiga.']
		},
		{
			title: 'Penyimpanan dan keamanan',
			paragraphs: ['Data disimpan di server Petakuis dan dikirim melalui HTTPS. Akses kontrol sesi dilindungi token khusus guru, dan kunci jawaban tidak dikirim ke browser siswa.']
		},
		{
			title: 'Hak kamu',
			paragraphs: ['Kamu bisa meminta salinan, perbaikan, atau penghapusan akun beserta kuis dan laporan milikmu kapan saja melalui kontak di bawah; langkah lengkapnya ada di halaman Hapus Akun (petakuis.permadi.dev/hapus-akun). Login Google juga bisa dicabut dari halaman keamanan akun Google (myaccount.google.com/permissions).']
		},
		{
			title: 'Pengguna di bawah umur',
			paragraphs: ['Petakuis dipakai di kelas di bawah arahan guru. Siswa cukup memakai nama panggilan untuk bermain; guru dan sekolah bertanggung jawab memastikan pemakaian oleh siswa sesuai aturan sekolah dan izin orang tua.']
		},
		{
			title: 'Perubahan kebijakan',
			paragraphs: ['Bila kebijakan ini berubah, tanggal di bagian atas halaman akan diperbarui.']
		}
	]
</script>

<template>
	<LegalPage
		title="Kebijakan Privasi"
		description="Ringkas dan jujur: data apa yang disimpan Petakuis, untuk apa, dan cara menghapusnya."
		updated="11 November 2026"
		:sections="sections"
	/>
</template>
