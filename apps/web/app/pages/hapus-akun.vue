<script setup lang="ts">
	import type { LegalSection } from '~/components/LegalPage.vue'

	useSeoMeta({
		title: 'Hapus Akun',
		description: 'Cara meminta penghapusan akun Petakuis beserta data yang dihapus dan masa simpannya.'
	})

	const contactEmail = useRuntimeConfig().public.contactEmail || 'email dukungan Petakuis'

	const sections: LegalSection[] = [
		{
			title: 'Cara meminta penghapusan akun',
			items: [
				`Kirim email ke ${contactEmail} dengan judul "Hapus akun Petakuis".`,
				'Kirim dari alamat email yang terdaftar di akun Petakuis-mu (termasuk akun yang masuk dengan Google), supaya kami bisa memastikan akun itu milikmu.',
				'Tulis nama akun dan peranmu (Guru atau Siswa). Bila hanya ingin menghapus sebagian data, sebutkan data mana.',
				'Kami membalas untuk konfirmasi, lalu menghapus akun paling lambat 14 hari setelah permintaan diterima.'
			]
		},
		{
			title: 'Data yang dihapus',
			items: [
				'Akun: nama, alamat email, peran, kata sandi (hash), dan foto profil dari Google.',
				'Semua sesi login, termasuk alamat IP dan jenis browser yang tercatat.',
				'Kuis buatan guru beserta soal dan kunci jawabannya.',
				'Laporan sesi kuis yang dibuka guru, termasuk nama panggilan, jawaban, dan skor siswa di sesi tersebut.'
			]
		},
		{
			title: 'Data yang disimpan dan masa simpannya',
			items: [
				'Cadangan basis data otomatis disimpan paling lama 30 hari, lalu terhapus dengan sendirinya. Data di dalam cadangan tidak dipakai untuk keperluan lain.',
				'Tidak ada data akun yang disimpan setelah masa cadangan itu berakhir.'
			]
		},
		{
			title: 'Menghapus sebagian data tanpa menghapus akun',
			items: [
				'Guru bisa langsung menghapus kuis miliknya dari dasbor Petakuis.',
				'Untuk menghapus laporan sesi tertentu, atau data siswa di laporan itu, kirim email seperti di atas dan sebutkan PIN sesi serta nama panggilannya.',
				'Siswa yang bermain tanpa akun hanya meninggalkan nama panggilan, jawaban, dan skor di laporan guru. Minta guru yang membuka sesi, atau hubungi kami, untuk menghapusnya.'
			]
		}
	]
</script>

<template>
	<LegalPage
		title="Hapus Akun Petakuis"
		description="Langkah meminta penghapusan akun aplikasi dan situs Petakuis, data apa yang dihapus, dan berapa lama cadangan disimpan."
		updated="12 November 2026"
		:sections="sections"
	/>
</template>
