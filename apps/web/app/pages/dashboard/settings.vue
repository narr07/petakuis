<script setup lang="ts">
	import * as z from 'zod'
	import type { FormSubmitEvent } from '@nuxt/ui'

	definePageMeta({
		layout: 'dashboard'
	})

	useSeoMeta({ title: 'Pengaturan Sekolah' })

	const toast = useToast()

	const schema = z.object({
		name: z.string().min(3, 'Nama sekolah terlalu pendek'),
		npsn: z.string().regex(/^\d{8}$/, 'NPSN terdiri dari 8 digit angka'),
		city: z.string().min(3, 'Isi kota atau kabupaten')
	})

	type Schema = z.output<typeof schema>

	const state = reactive<Schema>({
		name: DEMO_SCHOOL.name,
		npsn: DEMO_SCHOOL.npsn,
		city: DEMO_SCHOOL.city
	})

	const quotaPercent = Math.round((DEMO_SCHOOL.aiQuotaUsed / DEMO_SCHOOL.aiQuotaLimit) * 100)

	function onSubmit(_event: FormSubmitEvent<Schema>) {
		toast.add({
			title: 'Belum tersimpan permanen',
			description: 'Isian valid, tetapi database belum tersambung sehingga perubahan hilang saat halaman dimuat ulang.',
			icon: 'i-lucide-database-zap',
			color: 'warning'
		})
	}
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
							description="Tampil di laporan nilai dan undangan guru."
							variant="naked"
							orientation="horizontal"
							class="mb-4"
						>
							<UButton
								form="school-settings"
								label="Simpan"
								color="neutral"
								type="submit"
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
								required
								class="flex items-start justify-between gap-4 max-sm:flex-col"
							>
								<UInput v-model="state.npsn" inputmode="numeric" maxlength="8" autocomplete="off" />
							</UFormField>
							<USeparator />
							<UFormField
								name="city"
								label="Kota / kabupaten"
								required
								class="flex items-start justify-between gap-4 max-sm:flex-col"
							>
								<UInput v-model="state.city" autocomplete="off" />
							</UFormField>
						</UPageCard>
					</UForm>

					<div>
						<UPageCard
							title="Kuota generator AI"
							description="Kuota harian gratis untuk seluruh guru di sekolah ini. Guru juga bisa memakai API key pribadi."
							variant="naked"
							class="mb-4"
						/>

						<UPageCard variant="subtle">
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted">Terpakai hari ini</span>
								<span class="font-semibold text-highlighted">
									{{ DEMO_SCHOOL.aiQuotaUsed }} / {{ DEMO_SCHOOL.aiQuotaLimit }} soal
								</span>
							</div>
							<UProgress :model-value="quotaPercent" />
							<p class="text-xs text-muted">
								Kuota direset setiap pukul 00.00 WIB. Angka ini masih contoh.
							</p>
						</UPageCard>
					</div>
				</div>
			</DashboardAdminOnly>
		</template>
	</UDashboardPanel>
</template>
