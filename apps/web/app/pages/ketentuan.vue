<script setup lang="ts">
	import type { LegalSection } from '~/components/LegalPage.vue'

	useSeoMeta({
		title: 'Ketentuan Layanan',
		description: 'Aturan pemakaian Petakuis untuk guru dan siswa.'
	})

	const sections: LegalSection[] = [
		{
			title: 'Layanan',
			paragraphs: ['Petakuis adalah platform kuis berbasis peta untuk kelas. Layanan disediakan gratis apa adanya, dan fitur dapat berubah selama pengembangan.']
		},
		{
			title: 'Akun',
			items: [
				'Daftar dengan data yang benar dan jaga kerahasiaan kata sandimu.',
				'Satu akun untuk satu orang. Peran Guru atau Siswa dipilih saat pertama kali mendaftar.',
				'Kami dapat menangguhkan akun yang menyalahgunakan layanan.'
			]
		},
		{
			title: 'Konten kuis',
			items: [
				'Guru bertanggung jawab atas soal dan materi yang dibuatnya, termasuk hasil buatan AI yang perlu diperiksa sebelum dipakai.',
				'Dilarang memuat konten yang melanggar hukum, SARA, pornografi, kekerasan, atau melanggar hak cipta orang lain.'
			]
		},
		{
			title: 'Pemakaian yang wajar',
			items: [
				'Gunakan nama panggilan yang sopan saat bermain.',
				'Jangan mencoba membobol, mengganggu sesi orang lain, atau membebani server secara sengaja.'
			]
		},
		{
			title: 'Batasan tanggung jawab',
			paragraphs: ['Kami berusaha menjaga layanan tetap berjalan dan data tetap aman, tetapi tidak menjamin layanan selalu tersedia tanpa gangguan. Simpan salinan nilai penting dengan fitur ekspor CSV.']
		},
		{
			title: 'Privasi',
			paragraphs: ['Cara kami mengelola data dijelaskan di halaman Kebijakan Privasi (/privasi).']
		}
	]
</script>

<template>
	<LegalPage
		title="Ketentuan Layanan"
		description="Aturan singkat supaya Petakuis aman dan nyaman dipakai di kelas."
		updated="11 November 2026"
		:sections="sections"
	/>
</template>
