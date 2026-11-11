<script setup lang="ts">
	import type { FooterColumn } from '@nuxt/ui'

	const columns: FooterColumn[] = [
		{
			label: 'Untuk Guru',
			children: [
				{ label: 'Buat Kuis', to: '/build' },
				{ label: 'Jelajah Kuis', to: '/explore' },
				{ label: 'Dashboard Guru', to: '/dashboard' },
				{ label: 'Masuk Akun', to: '/auth/login' }
			]
		},
		{
			label: 'Untuk Siswa',
			children: [
				{ label: 'Masuk dengan PIN', to: '/join' },
				{ label: 'Coba Room Demo', to: '/play/123456?nickname=SiswaDemo&colorway=merah-putih' }
			]
		},
		{
			label: 'Petakuis',
			children: [
				{ label: 'Fitur', to: '/#fitur' },
				{ label: 'Katalog Peta', to: '/#peta' },
				{ label: 'Status Pengembangan', to: '/logs' },
				{ label: 'Kebijakan Privasi', to: '/privasi' },
				{ label: 'Ketentuan Layanan', to: '/ketentuan' }
			]
		}
	]

	const router = useRouter()
	const pinState = reactive({ pin: '' })

	function onJoin() {
		const code = pinState.pin.replace(/\D/g, '')
		router.push(code ? { path: '/join', query: { code } } : '/join')
	}
</script>

<template>
	<USeparator :avatar="{ src: '/mascot.svg', alt: 'Kuispi' }" class="h-px" />

	<UFooter :ui="{ top: 'border-b border-default' }">
		<template #top>
			<UContainer>
				<UFooterColumns :columns="columns">
					<template #right>
						<UForm :state="pinState" @submit="onJoin">
							<UFormField
								name="pin"
								label="Punya PIN dari guru?"
								description="Masukkan 6 digit kode ruangan, tanpa perlu akun."
								size="lg"
							>
								<UInput
									v-model="pinState.pin"
									inputmode="numeric"
									maxlength="6"
									placeholder="Contoh: 123456"
									class="w-full"
								>
									<template #trailing>
										<UButton
											type="submit"
											size="xs"
											color="neutral"
											label="Main"
										/>
									</template>
								</UInput>
							</UFormField>
						</UForm>
					</template>
				</UFooterColumns>
			</UContainer>
		</template>

		<template #left>
			<p class="text-sm text-muted">
				© {{ new Date().getFullYear() }} Petakuis · Gratis untuk guru dan siswa Indonesia
			</p>
		</template>

		<template #right>
			<UButton
				to="/logs"
				icon="i-lucide-activity"
				label="Status"
				color="neutral"
				variant="ghost"
			/>
		</template>
	</UFooter>
</template>
