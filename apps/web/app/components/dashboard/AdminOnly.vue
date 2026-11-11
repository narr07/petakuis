<script setup lang="ts">
	defineProps<{
		pageName: string
	}>()

	const { isAdmin, setRole } = useDashboardRole()
</script>

<template>
	<slot v-if="isAdmin" />

	<UEmpty
		v-else
		icon="i-lucide-lock"
		:title="`${pageName} khusus admin sekolah`"
		description="Peran guru difokuskan untuk menyusun kuis, membuka kelas live, dan mengunduh nilai. Halaman ini dikelola admin sekolah atau tim kurikulum."
		variant="naked"
		class="flex-1"
		:actions="[
			{ label: 'Beralih ke peran Admin', icon: 'i-lucide-shield-check', onClick: () => setRole('admin') },
			{ label: 'Kembali ke Ringkasan', color: 'neutral', variant: 'outline', to: '/dashboard' }
		]"
	/>
</template>
