<script setup lang="ts">
	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Log Server' })

	interface LogEntry {
		id: string
		timestamp: string
		service: string
		level: string
		tag: string
		message: string
	}

	// Halaman dan API khusus admin (dijaga middleware dan server).
	const { data, refresh, status, error } = await useFetch<{
		webLogs: LogEntry[]
		gameServerLogs: LogEntry[]
	}>('/api/logs', { key: 'dashboard-logs' })

	const logPanels = computed(() => [
		{
			key: 'game',
			title: 'Game Server',
			description: 'Socket.IO · sesi, pemain, jawaban',
			icon: 'i-lucide-gamepad-2',
			logs: data.value?.gameServerLogs || []
		},
		{
			key: 'web',
			title: 'HTTP & API Nuxt',
			description: 'Request API dan pengiriman email',
			icon: 'i-lucide-globe',
			logs: data.value?.webLogs || []
		}
	])

	function levelColor(level: string) {
		switch (level.toLowerCase()) {
			case 'error':
			case 'fatal':
				return 'error' as const
			case 'warn':
			case 'warning':
				return 'warning' as const
			case 'info':
				return 'info' as const
			case 'success':
				return 'success' as const
			default:
				return 'neutral' as const
		}
	}

	const autoRefresh = ref(true)
	const { pause, resume } = useIntervalFn(() => refresh(), 3000, { immediate: false })

	watch(autoRefresh, on => (on ? resume() : pause()))
	onMounted(() => {
		if (autoRefresh.value) resume()
	})
</script>

<template>
	<UDashboardPanel id="dashboard-logs">
		<template #header>
			<UDashboardNavbar title="Log Server">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<USwitch v-model="autoRefresh" label="Segarkan otomatis" />
					<UButton
						icon="i-lucide-refresh-cw"
						label="Segarkan"
						color="neutral"
						variant="outline"
						:loading="status === 'pending'"
						@click="refresh()"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<UAlert
				v-if="error"
				icon="i-lucide-circle-alert"
				color="error"
				variant="subtle"
				title="Log tidak bisa dimuat"
				:description="error.statusMessage || 'Coba segarkan halaman.'"
			/>

			<div class="grid gap-6 xl:grid-cols-2">
				<UCard
					v-for="panel in logPanels"
					:key="panel.key"
					:ui="{ body: 'p-0 sm:p-0' }"
				>
					<template #header>
						<div class="flex items-center justify-between gap-3">
							<UUser
								:name="panel.title"
								:description="panel.description"
								:avatar="{ icon: panel.icon }"
							/>
							<UBadge
								:label="`${panel.logs.length} log`"
								color="neutral"
								variant="subtle"
							/>
						</div>
					</template>

					<div class="max-h-[32rem] divide-y divide-default overflow-y-auto font-mono text-xs">
						<div
							v-for="item in panel.logs"
							:key="item.id"
							class="space-y-1 px-4 py-2.5"
						>
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-1.5">
									<UBadge
										:label="item.level.toUpperCase()"
										:color="levelColor(item.level)"
										variant="subtle"
										size="sm"
									/>
									<span class="font-semibold text-muted">[{{ item.tag }}]</span>
								</div>
								<span class="text-dimmed">{{ item.timestamp.slice(11, 19) }}</span>
							</div>
							<p class="break-words leading-relaxed text-highlighted">
								{{ item.message }}
							</p>
						</div>

						<UEmpty
							v-if="!panel.logs.length"
							icon="i-lucide-terminal"
							title="Belum ada log"
							description="Log muncul di sini saat ada aktivitas."
							variant="naked"
							class="py-10"
						/>
					</div>
				</UCard>
			</div>
		</template>
	</UDashboardPanel>
</template>
