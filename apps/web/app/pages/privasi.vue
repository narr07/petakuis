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
				'Akun guru: nama, alamat email, peran, dan kata sandi dalam bentuk hash (kata sandi asli tidak pernah disimpan). Akun hanya untuk guru; siswa tidak membuat akun.',
				'Login dengan Google: nama, alamat email, dan foto profil dari akun Google. Kami tidak meminta akses ke Gmail, Drive, kontak, atau data Google lainnya.',
				'Sesi login: cookie sesi, alamat IP, dan jenis browser, untuk menjaga akun tetap masuk dan mendeteksi penyalahgunaan.',
				'Kuis buatan guru: judul, soal, kunci jawaban, dan peta yang dipilih.',
				'Permainan: nama panggilan yang diketik siswa, jawaban, skor, dan waktu menjawab dalam satu sesi kuis. Siswa bermain dengan PIN tanpa akun dan tanpa email. Laporan sesi hanya bisa dibuka guru yang membuka sesi itu dan admin.'
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
				'Layanan AI (ChatGPT, Gemini, dan lainnya): Petakuis tidak mengirim data apa pun ke layanan AI. Pada fitur buat soal dengan AI, guru sendiri yang menyalin prompt ke layanan pilihannya, dan berlaku ketentuan layanan tersebut.'
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
			paragraphs: [
				'Petakuis dipakai di kelas di bawah arahan guru. Kami tidak membuat akun untuk siswa dan tidak meminta email, nomor telepon, atau tanggal lahir anak. Siswa cukup memakai nama panggilan; sebaiknya nama panggilan, bukan nama lengkap.',
				'Bila siswa tidak sengaja mendaftar dengan akun Google, pendaftaran itu bisa dibatalkan di langkah konfirmasi dan akunnya langsung dihapus. Akun siswa yang dibuat sebelum pendaftaran siswa ditutup bisa dihapus lewat halaman Hapus Akun.'
			]
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
		updated="17 November 2026"
		:sections="sections"
	/>
</template>
