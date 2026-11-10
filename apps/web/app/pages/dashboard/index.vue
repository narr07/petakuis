<script setup lang="ts">
	import { MAP_CATALOG, STARTER_QUIZZES } from '@petakuis/shared'
	import type { NavigationMenuItem } from '@nuxt/ui'

	const route = useRoute()
	const router = useRouter()

	const isSidebarOpen = ref(false)
	const activeRole = ref<'teacher' | 'admin'>(route.query.role === 'admin' ? 'admin' : 'teacher')
	const activeTab = ref('overview')
	const studentGradeFilter = ref('all')

	const teacherQuizzes = ref(STARTER_QUIZZES)

	const overviewStats = [
		{ label: 'Total Guru Pengajar', value: '18 Guru', icon: 'i-lucide-graduation-cap', change: '4 Mapel Utama' },
		{ label: 'Total Siswa Terdaftar', value: '420 Siswa', icon: 'i-lucide-users', change: 'Kelas 7 & 8' },
		{ label: 'Sesi Game Berjalan', value: '42 Sesi', icon: 'i-lucide-gamepad-2', change: '100% lancar' },
		{ label: 'Koleksi Kuis Sekolah', value: `${teacherQuizzes.value.length} Kuis`, icon: 'i-lucide-book-open', change: 'Siap dimainkan' }
	]

	const schoolTeachers = [
		{ name: 'Pak Hendra Saputra, S.Pd.', subject: 'Matematika', email: 'hendra@smpn5bdg.sch.id', quizzes: 8, sessions: 24, status: 'Aktif' },
		{ name: 'Ibu Ratna Dewi, M.Pd.', subject: 'IPA (Sains)', email: 'ratna@smpn5bdg.sch.id', quizzes: 12, sessions: 38, status: 'Aktif' },
		{ name: 'Pak Budi Prasetyo, S.Kom.', subject: 'Informatika / TIK', email: 'budi@smpn5bdg.sch.id', quizzes: 5, sessions: 14, status: 'Aktif' },
		{ name: 'Ibu Siti Rahmawati, S.Pd.', subject: 'Bahasa Indonesia', email: 'siti@smpn5bdg.sch.id', quizzes: 9, sessions: 29, status: 'Aktif' }
	]

	const schoolStudents = [
		{ nisn: '0081294812', name: 'Ahmad Fauzan', grade: '7A', quizzesJoined: 14, avgScore: 88, status: 'Aktif' },
		{ nisn: '0082739182', name: 'Aisyah Putri Pratama', grade: '7A', quizzesJoined: 16, avgScore: 94, status: 'Aktif' },
		{ nisn: '0084928192', name: 'Bima Satria Wicaksana', grade: '7B', quizzesJoined: 12, avgScore: 78, status: 'Aktif' },
		{ nisn: '0085819201', name: 'Citra Kirana Lestari', grade: '7B', quizzesJoined: 15, avgScore: 92, status: 'Aktif' },
		{ nisn: '0071928391', name: 'Dimas Aditya Nugraha', grade: '8A', quizzesJoined: 20, avgScore: 85, status: 'Aktif' },
		{ nisn: '0072819203', name: 'Farhan Maulana', grade: '8A', quizzesJoined: 18, avgScore: 90, status: 'Aktif' },
		{ nisn: '0073910294', name: 'Gita Nurhaliza', grade: '8B', quizzesJoined: 19, avgScore: 96, status: 'Aktif' }
	]

	const filteredStudents = computed(() => {
		if (studentGradeFilter.value === 'all') return schoolStudents
		return schoolStudents.filter((s) => s.grade === studentGradeFilter.value)
	})

	const teacherColumns = [
		{ accessorKey: 'name', header: 'Nama Guru' },
		{ accessorKey: 'subject', header: 'Mata Pelajaran' },
		{ accessorKey: 'email', header: 'Email Sekolah' },
		{ accessorKey: 'quizzes', header: 'Jumlah Kuis' },
		{ accessorKey: 'sessions', header: 'Sesi Selesai' },
		{ accessorKey: 'status', header: 'Status' },
		{ id: 'actions', header: 'Aksi' }
	]

	const studentColumns = [
		{ accessorKey: 'nisn', header: 'NISN' },
		{ accessorKey: 'name', header: 'Nama Siswa' },
		{ accessorKey: 'grade', header: 'Kelas' },
		{ accessorKey: 'quizzesJoined', header: 'Kuis Diikuti' },
		{ accessorKey: 'avgScore', header: 'Rata-rata Skor' },
		{ accessorKey: 'status', header: 'Status' },
		{ id: 'actions', header: 'Aksi' }
	]

	function switchRole(newRole: 'teacher' | 'admin') {
		activeRole.value = newRole
		router.replace({ query: { ...route.query, role: newRole } })
	}

	const navSections = computed<NavigationMenuItem[][]>(() => [
		[
			{
				label: 'Ringkasan',
				icon: 'i-lucide-layout-dashboard',
				active: activeTab.value === 'overview',
				onSelect: () => { activeTab.value = 'overview' }
			},
			{
				label: 'Koleksi Kuis',
				icon: 'i-lucide-book-open',
				badge: String(teacherQuizzes.value.length),
				active: activeTab.value === 'quizzes',
				onSelect: () => { activeTab.value = 'quizzes' }
			},
			{
				label: 'Peta Petualangan 2D',
				icon: 'i-lucide-map',
				badge: String(MAP_CATALOG.length),
				active: activeTab.value === 'maps',
				onSelect: () => { activeTab.value = 'maps' }
			},
			{
				label: 'Laporan & Nilai',
				icon: 'i-lucide-file-spreadsheet',
				active: activeTab.value === 'reports',
				onSelect: () => { activeTab.value = 'reports' }
			}
		],
		[
			{
				label: 'List Guru',
				icon: activeRole.value === 'teacher' ? 'i-lucide-lock' : 'i-lucide-graduation-cap',
				badge: activeRole.value === 'teacher' ? 'Admin' : String(schoolTeachers.length),
				active: activeTab.value === 'teachers',
				onSelect: () => { activeTab.value = 'teachers' }
			},
			{
				label: 'List Siswa',
				icon: activeRole.value === 'teacher' ? 'i-lucide-lock' : 'i-lucide-users',
				badge: activeRole.value === 'teacher' ? 'Admin' : String(schoolStudents.length),
				active: activeTab.value === 'students',
				onSelect: () => { activeTab.value = 'students' }
			},
			{
				label: 'Pengaturan Sekolah',
				icon: activeRole.value === 'teacher' ? 'i-lucide-lock' : 'i-lucide-settings',
				badge: activeRole.value === 'teacher' ? 'Admin' : 'AI 48/200',
				active: activeTab.value === 'settings',
				onSelect: () => { activeTab.value = 'settings' }
			}
		],
		[
			{
				label: 'Buat Kuis Baru',
				icon: 'i-lucide-plus-circle',
				to: '/build'
			},
			{
				label: 'Kembali ke Web',
				icon: 'i-lucide-arrow-left',
				to: '/'
			}
		]
	])

	const isTabRestrictedForTeacher = computed(() => {
		return activeRole.value === 'teacher' && ['teachers', 'students', 'settings'].includes(activeTab.value)
	})

	async function launchLiveHost(quizId: string) {
		try {
			const res = await $fetch<{ ok: boolean; code: string; hostToken: string }>('/api/sessions', {
				method: 'POST',
				body: { quizId, autoStart: true }
			})
			router.push(`/host/${res.code}`)
		} catch (err) {
			alert('Gagal meluncurkan room: ' + err)
		}
	}
</script>

<template>
	<UDashboardGroup unit="rem">
		<!-- Sidebar Kiri Sesuai Template Resmi Nuxt UI Dashboard -->
		<UDashboardSidebar
			id="dashboard-sidebar"
			v-model:open="isSidebarOpen"
			collapsible
			resizable
			class="bg-elevated/25"
			:ui="{ footer: 'lg:border-t lg:border-default' }"
		>
			<!-- Header Sidebar -->
			<template #header="{ collapsed }">
				<div class="flex items-center gap-2.5 px-2 py-1.5 w-full min-w-0">
					<img
						src="/mascot.svg"
						alt="Petakuis"
						class="h-8 w-8 shrink-0 transition-transform hover:scale-105"
					>
					<div v-if="!collapsed" class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5">
							<span class="font-bold text-sm truncate">Petakuis</span>
							<UBadge :color="activeRole === 'teacher' ? 'primary' : 'neutral'" size="xs" variant="subtle">
								{{ activeRole === 'teacher' ? 'Guru' : 'Admin' }}
							</UBadge>
						</div>
						<p class="text-xs text-muted truncate">SMP Negeri 5 Bandung</p>
					</div>
				</div>
			</template>

			<!-- Default Nav Menu -->
			<template #default="{ collapsed }">
				<UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

				<UNavigationMenu
					:collapsed="collapsed"
					:items="navSections[0]"
					orientation="vertical"
					tooltip
					popover
				/>

				<div v-if="!collapsed" class="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted">
					Administrasi Sekolah
				</div>

				<UNavigationMenu
					:collapsed="collapsed"
					:items="navSections[1]"
					orientation="vertical"
					tooltip
					popover
				/>

				<UNavigationMenu
					:collapsed="collapsed"
					:items="navSections[2]"
					orientation="vertical"
					tooltip
					class="mt-auto"
				/>
			</template>

			<!-- Footer Sidebar (User / Role Switcher Menu) -->
			<template #footer="{ collapsed }">
				<div class="p-2 w-full space-y-2">
					<div v-if="!collapsed" class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2 min-w-0">
							<UAvatar
								:alt="activeRole === 'teacher' ? 'Hendra Saputra' : 'Admin Kurikulum'"
								size="sm"
							/>
							<div class="min-w-0">
								<p class="text-xs font-bold truncate">
									{{ activeRole === 'teacher' ? 'Pak Hendra, S.Pd.' : 'Admin Sekolah' }}
								</p>
								<p class="text-[10px] text-muted truncate">
									{{ activeRole === 'teacher' ? 'hendra@smpn5bdg.sch.id' : 'admin@smpn5bdg.sch.id' }}
								</p>
							</div>
						</div>
					</div>

					<!-- Role Switcher Toggle -->
					<div class="flex items-center gap-1 w-full">
						<UButton
							:variant="activeRole === 'teacher' ? 'solid' : 'ghost'"
							:color="activeRole === 'teacher' ? 'primary' : 'neutral'"
							size="xs"
							icon="i-lucide-graduation-cap"
							:label="collapsed ? undefined : 'Guru'"
							class="flex-1 justify-center"
							@click="switchRole('teacher')"
						/>
						<UButton
							:variant="activeRole === 'admin' ? 'solid' : 'ghost'"
							:color="activeRole === 'admin' ? 'primary' : 'neutral'"
							size="xs"
							icon="i-lucide-shield-check"
							:label="collapsed ? undefined : 'Admin'"
							class="flex-1 justify-center"
							@click="switchRole('admin')"
						/>
					</div>
				</div>
			</template>
		</UDashboardSidebar>

		<!-- Main Panel Kanan Sesuai Template Resmi Nuxt UI Dashboard -->
		<UDashboardPanel id="dashboard-content">
			<template #header>
				<UDashboardNavbar
					:title="
						activeTab === 'overview'
							? 'Dashboard Sekolah: SMP Negeri 5 Bandung'
							: activeTab === 'quizzes'
								? 'Koleksi Kuis Petualangan'
								: activeTab === 'maps'
									? 'Peta Petualangan 2D'
									: activeTab === 'reports'
										? 'Laporan Nilai & Rekapitulasi'
										: activeTab === 'teachers'
											? 'List Guru & Tenaga Pengajar'
											: activeTab === 'students'
												? 'List Siswa & Kelas'
												: 'Pengaturan Sekolah & Kuota AI'
					"
					:ui="{ right: 'gap-2.5' }"
				>
					<template #leading>
						<UDashboardSidebarCollapse />
					</template>

					<template #right>
						<UBadge :color="activeRole === 'teacher' ? 'primary' : 'neutral'" size="sm" variant="subtle">
							{{ activeRole === 'teacher' ? 'Peran: Guru' : 'Peran: Admin Sekolah' }}
						</UBadge>

						<UButton
							to="/build"
							color="primary"
							icon="i-lucide-plus"
							label="Buat Kuis"
							size="sm"
						/>

						<UButton
							to="/join"
							variant="outline"
							color="warning"
							icon="i-lucide-gamepad-2"
							label="Tab Siswa"
							size="sm"
							target="_blank"
						/>
					</template>
				</UDashboardNavbar>

				<UDashboardToolbar>
					<template #left>
						<div class="flex items-center gap-2">
							<UButton
								variant="ghost"
								color="neutral"
								size="xs"
								label="Ringkasan"
								:class="activeTab === 'overview' ? 'font-bold text-primary' : ''"
								@click="activeTab = 'overview'"
							/>
							<UButton
								variant="ghost"
								color="neutral"
								size="xs"
								label="Kuis"
								:class="activeTab === 'quizzes' ? 'font-bold text-primary' : ''"
								@click="activeTab = 'quizzes'"
							/>
							<UButton
								variant="ghost"
								color="neutral"
								size="xs"
								label="List Guru"
								:class="activeTab === 'teachers' ? 'font-bold text-primary' : ''"
								@click="activeTab = 'teachers'"
							/>
							<UButton
								variant="ghost"
								color="neutral"
								size="xs"
								label="List Siswa"
								:class="activeTab === 'students' ? 'font-bold text-primary' : ''"
								@click="activeTab = 'students'"
							/>
						</div>
					</template>
				</UDashboardToolbar>
			</template>

			<template #body>
				<!-- STATE 1: JIKA GURU MENCOBA MENGAKSES HALAMAN KHUSUS ADMIN -->
				<div v-if="isTabRestrictedForTeacher" class="space-y-6">
					<UCard class="text-center py-12 px-6">
						<div class="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mx-auto mb-4">
							<UIcon name="i-lucide-lock" class="w-8 h-8" />
						</div>

						<h2 class="text-xl font-bold">Akses Dibatasi: Khusus Admin Sekolah</h2>
						<p class="text-sm text-muted max-w-lg mx-auto mt-2 leading-relaxed">
							Halaman <strong>{{ activeTab === 'teachers' ? 'List Guru' : activeTab === 'students' ? 'List Siswa' : 'Pengaturan Sekolah' }}</strong> hanya dapat dikelola oleh Admin Sekolah atau Tim Kurikulum. Peran Guru difokuskan untuk membuat kuis, meluncurkan room 2D, dan mengunduh rekapan nilai kelas.
						</p>

						<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
							<UButton
								color="primary"
								icon="i-lucide-shield-check"
								label="Beralih ke Mode Admin Sekolah"
								@click="switchRole('admin')"
							/>
							<UButton
								variant="outline"
								color="neutral"
								label="Kembali ke Ringkasan Guru"
								@click="activeTab = 'overview'"
							/>
						</div>
					</UCard>
				</div>

				<!-- STATE 2: TAB OVERVIEW (Bisa Diakses Guru & Admin) -->
				<div v-else-if="activeTab === 'overview'" class="space-y-6">
					<!-- Metric Cards -->
					<UPageGrid>
						<UCard v-for="(stat, idx) in overviewStats" :key="idx">
							<template #header>
								<div class="flex items-center justify-between">
									<span class="text-xs font-bold text-muted">{{ stat.label }}</span>
									<UIcon :name="stat.icon" class="w-5 h-5 text-primary" />
								</div>
							</template>
							<div class="text-2xl font-bold">{{ stat.value }}</div>
							<p class="text-xs text-primary mt-1 font-semibold">{{ stat.change }}</p>
						</UCard>
					</UPageGrid>

					<!-- Quick Access Section -->
					<UPageGrid>
						<UCard>
							<template #header>
								<div class="flex items-center justify-between">
									<h3 class="text-base font-bold">Kuis Terakhir</h3>
									<UButton
										variant="ghost"
										color="primary"
										size="xs"
										label="Lihat Semua"
										@click="activeTab = 'quizzes'"
									/>
								</div>
							</template>

							<div class="space-y-3">
								<div
									v-for="q in teacherQuizzes.slice(0, 3)"
									:key="q.id"
									class="flex items-center justify-between p-3 rounded-lg bg-muted/20"
								>
									<div>
										<p class="text-sm font-bold">{{ q.title }}</p>
										<p class="text-xs text-muted">{{ q.subject }} · {{ q.questions.length }} Pos Soal</p>
									</div>
									<UButton
										size="xs"
										color="primary"
										icon="i-lucide-play"
										label="Mulai"
										@click="launchLiveHost(q.id)"
									/>
								</div>
							</div>
						</UCard>

						<UCard>
							<template #header>
								<div class="flex items-center justify-between">
									<h3 class="text-base font-bold">Peta Siap Digunakan</h3>
									<UButton
										variant="ghost"
										color="primary"
										size="xs"
										label="Buka Katalog"
										@click="activeTab = 'maps'"
									/>
								</div>
							</template>

							<div class="space-y-3">
								<div
									v-for="m in MAP_CATALOG"
									:key="m.id"
									class="flex items-center justify-between p-3 rounded-lg bg-muted/20"
								>
									<div>
										<p class="text-sm font-bold">{{ m.name }}</p>
										<p class="text-xs text-muted">{{ m.spawnPoints.length }} Pos Soal · Kapasitas 200 Siswa</p>
									</div>
									<UButton
										:to="`/build?mapId=${m.id}`"
										size="xs"
										variant="outline"
										color="neutral"
										label="Pakai Peta"
									/>
								</div>
							</div>
						</UCard>
					</UPageGrid>
				</div>

				<!-- STATE 3: TAB KOLEKSI KUIS -->
				<div v-else-if="activeTab === 'quizzes'" class="space-y-6">
					<UCard>
						<template #header>
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div>
									<h2 class="text-lg font-bold">Koleksi Kuis Sekolah</h2>
									<p class="text-xs text-muted">Kuis yang dapat langsung diluncurkan ke proyektor kelas atau diedit.</p>
								</div>
								<UButton
									to="/build"
									color="primary"
									icon="i-lucide-plus-circle"
									label="Buat Kuis Baru"
									size="sm"
								/>
							</div>
						</template>

						<div class="space-y-4">
							<UCard
								v-for="q in teacherQuizzes"
								:key="q.id"
								variant="subtle"
							>
								<div class="flex flex-wrap items-center justify-between gap-4">
									<div class="flex items-start gap-3.5">
										<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
											<UIcon name="i-lucide-gamepad" class="w-5 h-5 text-primary" />
										</div>
										<div>
											<div class="flex flex-wrap items-center gap-2">
												<h3 class="text-base font-bold">{{ q.title }}</h3>
												<UBadge color="neutral" size="xs">{{ q.subject }}</UBadge>
												<UBadge color="warning" size="xs">{{ q.schoolLevel.toUpperCase() }}</UBadge>
												<UBadge color="primary" variant="subtle" size="xs">{{ q.questions.length }} Pos Soal</UBadge>
											</div>
											<p class="text-xs text-muted mt-1 max-w-2xl leading-relaxed">{{ q.description }}</p>
											<p class="text-xs text-primary font-semibold mt-2">
												Peta: {{ MAP_CATALOG.find((m) => m.id === q.mapId)?.name || 'Lembah Sunnyside' }} · Mode {{ q.mode === 'free' ? 'Eksplorasi Bebas' : 'Berurutan' }}
											</p>
										</div>
									</div>

									<div class="flex items-center gap-2">
										<UButton
											color="primary"
											icon="i-lucide-play"
											label="Luncurkan Kelas"
											size="sm"
											@click="launchLiveHost(q.id)"
										/>
										<UButton
											:to="`/report/123456`"
											variant="outline"
											color="neutral"
											icon="i-lucide-bar-chart-3"
											label="Laporan"
											size="sm"
										/>
									</div>
								</div>
							</UCard>
						</div>
					</UCard>
				</div>

				<!-- STATE 4: TAB LIST GURU (Khusus Admin) -->
				<div v-else-if="activeTab === 'teachers'" class="space-y-6">
					<UCard>
						<template #header>
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div>
									<div class="flex items-center gap-2">
										<h2 class="text-lg font-bold">List Guru & Tenaga Pengajar</h2>
										<UBadge color="primary" size="xs">Khusus Admin</UBadge>
									</div>
									<p class="text-xs text-muted">Kelola akun guru terdaftar, penugasan mata pelajaran, dan riwayat aktivitas kuis.</p>
								</div>
								<div class="flex items-center gap-2">
									<UButton
										color="primary"
										icon="i-lucide-user-plus"
										label="Tambah Guru Baru"
										size="sm"
									/>
								</div>
							</div>
						</template>

						<UTable
							:data="schoolTeachers"
							:columns="teacherColumns"
						>
							<template #subject-cell="{ row }">
								<UBadge color="neutral" size="xs">{{ row.original.subject }}</UBadge>
							</template>
							<template #status-cell="{ row }">
								<UBadge color="success" variant="subtle" size="xs">{{ row.original.status }}</UBadge>
							</template>
							<template #actions-cell>
								<UButton size="xs" variant="ghost" color="neutral" label="Detail" />
							</template>
						</UTable>
					</UCard>
				</div>

				<!-- STATE 5: TAB LIST SISWA (Khusus Admin) -->
				<div v-else-if="activeTab === 'students'" class="space-y-6">
					<UCard>
						<template #header>
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div>
									<div class="flex items-center gap-2">
										<h2 class="text-lg font-bold">List Siswa & Data Kelas</h2>
										<UBadge color="primary" size="xs">Khusus Admin</UBadge>
									</div>
									<p class="text-xs text-muted">Daftar siswa yang mengikuti kuis kelas petualangan 2D beserta catatan nilai.</p>
								</div>

								<div class="flex items-center gap-2.5">
									<div class="flex items-center gap-1.5 text-xs text-muted">
										<span>Filter Kelas:</span>
										<div class="flex gap-1">
											<UButton
												size="xs"
												:variant="studentGradeFilter === 'all' ? 'solid' : 'outline'"
												:color="studentGradeFilter === 'all' ? 'primary' : 'neutral'"
												label="Semua"
												@click="studentGradeFilter = 'all'"
											/>
											<UButton
												size="xs"
												:variant="studentGradeFilter === '7A' ? 'solid' : 'outline'"
												:color="studentGradeFilter === '7A' ? 'primary' : 'neutral'"
												label="7A"
												@click="studentGradeFilter = '7A'"
											/>
											<UButton
												size="xs"
												:variant="studentGradeFilter === '7B' ? 'solid' : 'outline'"
												:color="studentGradeFilter === '7B' ? 'primary' : 'neutral'"
												label="7B"
												@click="studentGradeFilter = '7B'"
											/>
											<UButton
												size="xs"
												:variant="studentGradeFilter === '8A' ? 'solid' : 'outline'"
												:color="studentGradeFilter === '8A' ? 'primary' : 'neutral'"
												label="8A"
												@click="studentGradeFilter = '8A'"
											/>
										</div>
									</div>

									<UButton
										variant="outline"
										color="primary"
										icon="i-lucide-download"
										label="Ekspor Siswa"
										size="sm"
									/>
								</div>
							</div>
						</template>

						<UTable
							:data="filteredStudents"
							:columns="studentColumns"
						>
							<template #grade-cell="{ row }">
								<UBadge color="neutral" size="xs">{{ row.original.grade }}</UBadge>
							</template>
							<template #avgScore-cell="{ row }">
								<span class="font-bold text-primary">{{ row.original.avgScore }} Poin</span>
							</template>
							<template #status-cell="{ row }">
								<UBadge color="success" variant="subtle" size="xs">{{ row.original.status }}</UBadge>
							</template>
							<template #actions-cell>
								<UButton size="xs" variant="ghost" color="neutral" label="Rapor" />
							</template>
						</UTable>
					</UCard>
				</div>

				<!-- STATE 6: TAB PETA 2D -->
				<div v-else-if="activeTab === 'maps'" class="space-y-6">
					<UCard>
						<template #header>
							<div>
								<h2 class="text-lg font-bold">Katalog Peta Petualangan 2D</h2>
								<p class="text-xs text-muted">Peta yang tersedia untuk digunakan pada kuis kelas baru.</p>
							</div>
						</template>

						<UPageGrid>
							<UCard v-for="m in MAP_CATALOG" :key="m.id" class="overflow-hidden">
								<template #header>
									<div class="relative -m-6 mb-0 h-40 w-full overflow-hidden">
										<img
											:src="m.mapImageUrl"
											:alt="m.name"
											class="h-full w-full object-cover"
											style="image-rendering: pixelated"
										>
									</div>
								</template>
								<h3 class="text-base font-bold">{{ m.name }}</h3>
								<p class="text-xs text-muted mt-1">{{ m.description }}</p>
								<template #footer>
									<UButton
										:to="`/build?mapId=${m.id}`"
										color="primary"
										icon="i-lucide-map-pin"
										label="Buat Kuis dengan Peta Ini"
										block
										size="sm"
									/>
								</template>
							</UCard>
						</UPageGrid>
					</UCard>
				</div>

				<!-- STATE 7: TAB LAPORAN & REKAP NILAI -->
				<div v-else-if="activeTab === 'reports'" class="space-y-6">
					<UCard>
						<template #header>
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div>
									<h2 class="text-lg font-bold">Laporan & Rekap Nilai Siswa</h2>
									<p class="text-xs text-muted">Unduh rekapan nilai format CSV yang kompatibel dengan Google Classroom dan Dapodik.</p>
								</div>
								<UButton
									:to="`/report/123456`"
									color="primary"
									icon="i-lucide-file-spreadsheet"
									label="Buka Laporan Sesi Demo (PIN 123456)"
									size="sm"
								/>
							</div>
						</template>

						<div class="space-y-3">
							<div class="p-4 rounded-xl border border-default flex items-center justify-between">
								<div>
									<p class="text-sm font-bold">Sesi 123456 · Eksplorasi Alam & Geografi Indonesia</p>
									<p class="text-xs text-muted">24 Siswa Selesai · Rata-rata Skor: 420 Poin</p>
								</div>
								<UButton :to="`/report/123456`" variant="outline" color="neutral" size="sm" label="Unduh CSV" />
							</div>
						</div>
					</UCard>
				</div>

				<!-- STATE 8: TAB PENGATURAN SEKOLAH (Khusus Admin) -->
				<div v-else-if="activeTab === 'settings'" class="space-y-6">
					<UCard>
						<template #header>
							<div class="flex items-center gap-2">
								<h2 class="text-lg font-bold">Pengaturan Sekolah & Kuota AI</h2>
								<UBadge color="primary" size="xs">Khusus Admin</UBadge>
							</div>
						</template>

						<div class="space-y-4 max-w-xl">
							<UFormField label="Nama Sekolah">
								<UInput model-value="SMP Negeri 5 Bandung" disabled />
							</UFormField>

							<UFormField label="Alamat / Kota">
								<UInput model-value="Kota Bandung, Jawa Barat" disabled />
							</UFormField>

							<UFormField label="Penggunaan Kuota AI Generator">
								<div class="p-3 rounded-lg bg-muted/20 space-y-2">
									<div class="flex justify-between text-xs font-bold">
										<span>Pemakaian Hari Ini:</span>
										<span class="text-primary">48 / 200 Soal</span>
									</div>
									<div class="w-full bg-default rounded-full h-2 overflow-hidden">
										<div class="bg-primary h-2 rounded-full w-[24%]" />
									</div>
									<p class="text-[11px] text-muted">Kuota reset otomatis setiap pukul 00:00 WIB.</p>
								</div>
							</UFormField>
						</div>
					</UCard>
				</div>
			</template>
		</UDashboardPanel>
	</UDashboardGroup>
</template>
