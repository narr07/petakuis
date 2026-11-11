<script setup lang="ts">
	import * as z from 'zod'
	import type { FormSubmitEvent } from '@nuxt/ui'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Pengaturan Sekolah' })

	const toast = useToast()

	const { data, refresh } = await useFetch<{
		school: { name: string, npsn: string, city: string }
		stats: { users: number, quizzes: number, sessions: number }
	}>('/api/admin/school', { key: 'admin-school' })

	const schema = z.object({
		name: z.string().trim().min(3, 'Nama sekolah terlalu pendek').max(120, 'Maksimal 120 karakter'),
		npsn: z.string().trim().regex(/^(\d{8})?$/, 'NPSN terdiri dari 8 digit angka (boleh dikosongkan)'),
		city: z.string().trim().max(120, 'Maksimal 120 karakter')
	})

	type Schema = z.output<typeof schema>

	const state = reactive<Schema>({
		name: data.value?.school.name ?? '',
		npsn: data.value?.school.npsn ?? '',
		city: data.value?.school.city ?? ''
	})

	const saving = ref(false)

	async function onSubmit(event: FormSubmitEvent<Schema>) {
		saving.value = true
		try {
			await $fetch('/api/admin/school', { method: 'PUT', body: event.data })
			toast.add({ title: 'Profil sekolah tersimpan', icon: 'i-lucide-circle-check', color: 'success' })
			await Promise.all([refresh(), refreshNuxtData('school-profile')])
		} catch (err: unknown) {
			const e = err as { data?: { statusMessage?: string } }
			toast.add({
				title: 'Belum tersimpan',
				description: e?.data?.statusMessage || 'Coba lagi sebentar lagi.',
				icon: 'i-lucide-circle-alert',
				color: 'error'
			})
		} finally {
			saving.value = false
		}
	}

	const statItems = computed(() => [
		{ label: 'Akun terdaftar', value: data.value?.stats.users ?? 0, icon: 'i-lucide-users', to: '/dashboard/teachers' },
		{ label: 'Kuis tersimpan', value: data.value?.stats.quizzes ?? 0, icon: 'i-lucide-book-open', to: '/dashboard/quizzes' },
		{ label: 'Sesi live', value: data.value?.stats.sessions ?? 0, icon: 'i-lucide-radio-tower', to: '/dashboard/reports' }
	])
</script>

<template>
	<UDashboardPanel id="dashboard-settings" :ui="{ body: 'lg:py-12' }">
		<template #header>
			<UDashboardNavbar title="Pengaturan Sekolah">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<DashboardAdminOnly page-name="Pengaturan sekolah">
				<div class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
					<UForm
						id="school-settings"
						:schema="schema"
						:state="state"
						@submit="onSubmit"
					>
						<UPageCard
							title="Profil sekolah"
							description="Tampil di menu dashboard dan laporan nilai."
							variant="naked"
							orientation="horizontal"
							class="mb-4"
						>
							<UButton
								form="school-settings"
								label="Simpan"
								color="neutral"
								type="submit"
								:loading="saving"
								class="w-fit lg:ms-auto"
							/>
						</UPageCard>

						<UPageCard variant="subtle">
							<UFormField
								name="name"
								label="Nama sekolah"
								description="Nama resmi sesuai Dapodik."
								required
								class="flex items-start justify-between gap-4 max-sm:flex-col"
							>
								<UInput v-model="state.name" autocomplete="off" />
							</UFormField>
							<USeparator />
							<UFormField
								name="npsn"
								label="NPSN"
								description="Nomor Pokok Sekolah Nasional, 8 digit."
								class="flex items-start justify-between gap-4 max-sm:flex-col"
							>
								<UInput v-model="state.npsn" inputmode="numeric" maxlength="8" autocomplete="off" />
							</UFormField>
							<USeparator />
							<UFormField
								name="city"
								label="Kota / kabupaten"
								class="flex items-start justify-between gap-4 max-sm:flex-col"
							>
								<UInput v-model="state.city" autocomplete="off" />
							</UFormField>
						</UPageCard>
					</UForm>

					<div>
						<UPageCard
							title="Ringkasan"
							description="Jumlah data yang tersimpan di Petakuis saat ini."
							variant="naked"
							class="mb-4"
						/>

						<UPageGrid class="lg:grid-cols-3">
							<UPageCard
								v-for="stat in statItems"
								:key="stat.label"
								:icon="stat.icon"
								:title="stat.label"
								:to="stat.to"
								variant="subtle"
							>
								<span class="text-2xl font-semibold text-highlighted">{{ stat.value }}</span>
							</UPageCard>
						</UPageGrid>
					</div>
				</div>
			</DashboardAdminOnly>
		</template>
	</UDashboardPanel>
</template>
