<script setup lang="ts">
	import type { QuestionStatEntry, ReportPlayerEntry, SessionReportData } from '@petakuis/shared'

	const route = useRoute()
	const code = computed(() => String(route.params.code || '123456'))

	const { data: report, refresh, status } = await useFetch<SessionReportData>(
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
		const rows = (report.value.players || []).map((p: ReportPlayerEntry) => [
			p.rank,
			`"${String(p.nickname).replace(/"/g, '""')}"`,
			p.score,
			p.correctCount,
			p.totalQuestions,
			p.accuracyPercent,
			p.totalTimeSeconds
		])

		const csvContent
			= 'data:text/csv;charset=utf-8,'
				+ [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

		const encodedUri = encodeURI(csvContent)
		const link = document.createElement('a')
		link.setAttribute('href', encodedUri)
		link.setAttribute('download', `laporan-petakuis-${code.value}.csv`)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const columns = [
		{ accessorKey: 'rank', header: 'Peringkat' },
		{ accessorKey: 'nickname', header: 'Nama Siswa' },
		{ accessorKey: 'correctCount', header: 'Benar / Total' },
		{ accessorKey: 'accuracyPercent', header: 'Akurasi' },
		{ accessorKey: 'totalTimeSeconds', header: 'Waktu' },
		{ accessorKey: 'score', header: 'Skor Akhir' }
	]

	function formatDuration(sec: number) {
		return `${sec.toFixed(1)} dtk`
	}
</script>

<template>
	<UContainer class="py-8 sm:py-10">
		<div v-if="report" class="space-y-8">
			<!-- Header Laporan -->
			<UPageHeader
				:headline="`PIN Sesi: ${report.code} · ${report.subject} (${report.gradeLabel})`"
				:title="report.quizTitle"
				:description="`Peta: ${report.mapName} · Mode: ${report.mode === 'free' ? 'Eksplorasi Bebas' : 'Jalur Berurutan'} · Diikuti oleh ${report.totalPlayers} siswa.`"
				:ui="{ root: 'border-b-0 pb-0' }"
			>
				<template #links>
					<div class="flex flex-wrap items-center gap-2">
						<UButton
							color="neutral"
							variant="outline"
							icon="i-lucide-rotate-ccw"
							label="Muat Ulang"
							:loading="status === 'pending'"
							@click="refresh()"
						/>
						<UButton
							color="primary"
							icon="i-lucide-download"
							label="Unduh Nilai CSV"
							@click="downloadCsv"
						/>
						<UButton
							color="neutral"
							variant="subtle"
							icon="i-lucide-monitor"
							label="Kembali ke Host"
							:to="`/host/${report.code}`"
						/>
					</div>
				</template>
			</UPageHeader>

			<!-- Statistik Ringkas -->
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<UCard :ui="{ body: 'p-4 sm:p-5' }">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-muted">Total Siswa</span>
						<UIcon name="i-lucide-users" class="size-4 text-primary" />
					</div>
					<div class="mt-2 text-2xl font-extrabold sm:text-3xl">
						{{ report.totalPlayers }}
					</div>
					<p class="mt-1 text-xs text-muted">Siswa terhubung</p>
				</UCard>

				<UCard :ui="{ body: 'p-4 sm:p-5' }">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-muted">Total Soal</span>
						<UIcon name="i-lucide-help-circle" class="size-4 text-secondary" />
					</div>
					<div class="mt-2 text-2xl font-extrabold sm:text-3xl">
						{{ report.totalQuestions }}
					</div>
					<p class="mt-1 text-xs text-muted">Pos tantangan di peta</p>
				</UCard>

				<UCard :ui="{ body: 'p-4 sm:p-5' }">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-muted">Rata-rata Akurasi</span>
						<UIcon name="i-lucide-target" class="size-4 text-success" />
					</div>
					<div class="mt-2 text-2xl font-extrabold sm:text-3xl">
						{{
							report.players.length > 0
								? Math.round(
									report.players.reduce((acc, p) => acc + p.accuracyPercent, 0) /
										report.players.length
								)
								: 0
						}}%
					</div>
					<p class="mt-1 text-xs text-muted">Ketepatan jawaban kelas</p>
				</UCard>

				<UCard :ui="{ body: 'p-4 sm:p-5' }">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-muted">Skor Tertinggi</span>
						<UIcon name="i-lucide-trophy" class="size-4 text-warning" />
					</div>
					<div class="mt-2 text-2xl font-extrabold sm:text-3xl">
						{{ report.players[0]?.score || 0 }}
					</div>
					<p class="mt-1 text-xs text-muted">
						{{ report.players[0]?.nickname || 'Belum ada data' }}
					</p>
				</UCard>
			</div>

			<!-- Tabel Nilai Siswa -->
			<UCard :ui="{ header: 'bg-primary/10', body: 'p-0' }">
				<template #header>
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-lg font-bold sm:text-xl">
								Rekapitulasi Nilai Siswa
							</h2>
							<p class="text-xs text-muted">
								Data siap diimpor ke Google Classroom atau buku nilai Dapodik.
							</p>
						</div>
						<UBadge color="primary" variant="subtle" size="md">
							{{ report.players.length }} Siswa Terdata
						</UBadge>
					</div>
				</template>

				<div v-if="report.players.length === 0" class="p-8 text-center text-sm text-muted">
					Belum ada data siswa yang menyelesaikan kuis pada sesi ini.
				</div>

				<UTable
					v-else
					:data="report.players"
					:columns="columns"
					class="w-full"
				>
					<template #rank-cell="{ row }">
						<UBadge
							:color="row.original.rank === 1 ? 'warning' : row.original.rank <= 3 ? 'secondary' : 'neutral'"
							variant="solid"
							size="sm"
						>
							#{{ row.original.rank }}
						</UBadge>
					</template>

					<template #nickname-cell="{ row }">
						<span class="font-bold text-highlighted">
							{{ row.original.nickname }}
						</span>
					</template>

					<template #correctCount-cell="{ row }">
						<span class="font-mono text-sm">
							{{ row.original.correctCount }} / {{ row.original.totalQuestions }}
						</span>
					</template>

					<template #accuracyPercent-cell="{ row }">
						<UBadge
							:color="row.original.accuracyPercent >= 75 ? 'success' : row.original.accuracyPercent >= 50 ? 'warning' : 'error'"
							variant="subtle"
							size="sm"
						>
							{{ row.original.accuracyPercent }}%
						</UBadge>
					</template>

					<template #totalTimeSeconds-cell="{ row }">
						<span class="text-xs text-muted">
							{{ formatDuration(row.original.totalTimeSeconds) }}
						</span>
					</template>

					<template #score-cell="{ row }">
						<span class="font-mono text-sm font-extrabold text-primary">
							{{ row.original.score }} Poin
						</span>
					</template>
				</UTable>
			</UCard>

			<!-- Analisis Daya Serap per Butir Soal -->
			<UCard v-if="report.questionStats?.length" :ui="{ header: 'bg-secondary/10' }">
				<template #header>
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-lg font-bold sm:text-xl">
								Analisis Butir Soal & Daya Serap Materi
							</h2>
							<p class="text-xs text-muted">
								Identifikasi soal yang paling sulit dijawab siswa untuk bahan remedial atau pembahasan kelas.
							</p>
						</div>
						<UBadge color="secondary" variant="subtle" size="md">
							{{ report.questionStats.length }} Butir Soal
						</UBadge>
					</div>
				</template>

				<div class="grid gap-4 sm:grid-cols-2">
					<UCard
						v-for="stat in (report.questionStats as QuestionStatEntry[])"
						:key="stat.questionId"
						variant="subtle"
						:ui="{ body: 'p-4' }"
					>
						<div class="flex items-center justify-between gap-2">
							<UBadge color="neutral" variant="outline" size="xs">
								Pos #{{ stat.order }} · {{ stat.type === 'multiple' ? 'PG' : stat.type === 'ox' ? 'B/S' : 'Isian' }}
							</UBadge>
							<UBadge
								:color="stat.accuracyPercent >= 70 ? 'success' : stat.accuracyPercent >= 40 ? 'warning' : 'error'"
								variant="solid"
								size="xs"
							>
								Akurasi: {{ stat.accuracyPercent }}%
							</UBadge>
						</div>

						<p class="mt-2 text-sm font-semibold text-highlighted line-clamp-2">
							{{ stat.prompt }}
						</p>

						<div class="mt-3 flex items-center justify-between text-xs text-muted">
							<span>{{ stat.correctCount }} dari {{ stat.attemptsCount }} siswa benar</span>
							<span>Rata-rata: {{ stat.avgResponseSeconds }} dtk</span>
						</div>
					</UCard>
				</div>
			</UCard>
		</div>

		<!-- State Loading / Not Found -->
		<div v-else-if="status === 'pending'" class="flex h-64 items-center justify-center">
			<div class="flex flex-col items-center gap-3">
				<UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
				<span class="text-sm font-semibold text-muted">Memuat data rekapitulasi sesi...</span>
			</div>
		</div>

		<div v-else class="mx-auto max-w-md text-center py-16">
			<UIcon name="i-lucide-file-x" class="mx-auto size-12 text-muted" />
			<h2 class="mt-4 text-xl font-bold">Laporan Tidak Ditemukan</h2>
			<p class="mt-2 text-sm text-muted">
				Sesi dengan PIN {{ code }} belum memiliki rekaman nilai atau server game baru saja dimulai ulang.
			</p>
			<UButton
				to="/dashboard"
				color="primary"
				class="mt-6"
				icon="i-lucide-arrow-left"
				label="Kembali ke Dashboard"
			/>
		</div>
	</UContainer>
</template>
