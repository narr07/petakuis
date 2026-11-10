<script setup lang="ts">
	const route = useRoute()
	const code = computed(() => String(route.params.code || '123456'))

	const { data: report, refresh } = await useFetch<any>(
		() => `/api/sessions/${code.value}/report`
	)

	function downloadCsv() {
		if (!report.value) return
		const headers = [
			'Peringkat',
			'Nama Siswa',
			'Skor Total',
			'Jawaban Benar',
			'Total Soal',
			'Akurasi (%)',
			'Total Waktu Respons (Detik)'
		]
		const rows = (report.value.players || []).map((p: any) => [
			p.rank,
			`"${String(p.nickname).replace(/"/g, '""')}"`,
			p.score,
			p.correctCount,
			p.totalQuestions,
			p.accuracyPercent,
			p.totalTimeSeconds
		])

		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n')

		const encodedUri = encodeURI(csvContent)
		const link = document.createElement('a')
		link.setAttribute('href', encodedUri)
		link.setAttribute('download', `laporan-petakuis-${code.value}.csv`)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}
</script>

<template>
	<div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
		<div
			v-if="report"
			class="space-y-8"
		>
			<!-- Report Summary Header -->
			<div class="pixel-card rounded-2xl p-6">
				<div class="flex flex-wrap items-center justify-between gap-4">
					<div>
						<span class="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
							LAPORAN HASIL SESI KELAS · PIN {{ report.code }}
						</span>
						<h1 class="mt-1 text-2xl font-extrabold text-[#16211b] sm:text-3xl">
							{{ report.quizTitle }}
						</h1>
						<p class="mt-1 text-sm text-[#435249]">
							{{ report.subject }} ({{ report.gradeLabel }}) · Peta:
							{{ report.mapName }} · {{ report.totalPlayers }} Siswa
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<button
							type="button"
							class="pixel-btn rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#16211b]"
							@click="refresh()"
						>
							Muat Ulang Data
						</button>
						<button
							type="button"
							class="pixel-btn rounded-xl bg-[#15803d] px-5 py-2.5 text-xs font-extrabold text-white"
							@click="downloadCsv"
						>
							Unduh Nilai CSV (Format Google Classroom)
						</button>
					</div>
				</div>
			</div>

			<!-- Per-Student Grade Table -->
			<section class="pixel-card rounded-2xl p-6">
				<h2 class="text-lg font-extrabold text-[#16211b]">
					Daftar Nilai per Siswa
				</h2>
				<div class="mt-4 overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr class="border-b-2 border-[#16211b] text-xs font-extrabold uppercase text-[#435249]">
								<th class="py-3 pr-4">Peringkat</th>
								<th class="py-3 px-4">Nama Siswa</th>
								<th class="py-3 px-4">Benar / Total</th>
								<th class="py-3 px-4">Akurasi</th>
								<th class="py-3 px-4">Waktu Jawab</th>
								<th class="py-3 pl-4 text-right">Skor Akhir</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="p in report.players"
								:key="p.id"
								class="border-b border-[#e6decb] font-semibold"
							>
								<td class="py-3 pr-4 font-mono-num font-extrabold">
									#{{ p.rank }}
								</td>
								<td class="py-3 px-4 font-bold text-[#16211b]">
									{{ p.nickname }}
								</td>
								<td class="py-3 px-4 font-mono-num">
									{{ p.correctCount }} / {{ p.totalQuestions }}
								</td>
								<td class="py-3 px-4 font-mono-num">
									{{ p.accuracyPercent }}%
								</td>
								<td class="py-3 px-4 font-mono-num">
									{{ p.totalTimeSeconds }} dtk
								</td>
								<td class="py-3 pl-4 text-right font-mono-num font-extrabold text-[#15803d]">
									{{ p.score }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Per-Question Analysis -->
			<section class="pixel-card rounded-2xl p-6">
				<h2 class="text-lg font-extrabold text-[#16211b]">
					Analisis Ketuntasan per Butir Soal
				</h2>
				<div class="mt-4 overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr class="border-b-2 border-[#16211b] text-xs font-extrabold uppercase text-[#435249]">
								<th class="py-3 pr-4">No</th>
								<th class="py-3 px-4">Pertanyaan</th>
								<th class="py-3 px-4">Tipe</th>
								<th class="py-3 px-4">Dijawab</th>
								<th class="py-3 px-4">Persentase Benar</th>
								<th class="py-3 pl-4 text-right">Rata-rata Waktu</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="qs in report.questionStats"
								:key="qs.questionId"
								class="border-b border-[#e6decb] font-semibold"
							>
								<td class="py-3 pr-4 font-mono-num font-extrabold">
									#{{ qs.order }}
								</td>
								<td class="py-3 px-4 font-bold text-[#16211b]">
									{{ qs.prompt }}
								</td>
								<td class="py-3 px-4 uppercase text-xs font-extrabold text-[#435249]">
									{{ qs.type }}
								</td>
								<td class="py-3 px-4 font-mono-num">
									{{ qs.attemptsCount }} siswa
								</td>
								<td class="py-3 px-4 font-mono-num font-extrabold">
									{{ qs.accuracyPercent }}%
								</td>
								<td class="py-3 pl-4 text-right font-mono-num">
									{{ qs.avgResponseSeconds }} dtk
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</div>
	</div>
</template>
