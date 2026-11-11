<script setup lang="ts">
	defineProps<{
		pageName: string
	}>()

	const { isAdmin } = useDashboardRole()
</script>

<template>
	<slot v-if="isAdmin" />

	<UEmpty
		v-else
		icon="i-lucide-lock"
		:title="`${pageName} khusus admin sekolah`"
		description="Peran guru difokuskan untuk menyusun kuis, membuka kelas live, dan mengunduh nilai. Halaman ini dikelola admin."
		variant="naked"
		class="flex-1"
		:actions="[{ label: 'Kembali ke Ringkasan', color: 'neutral', variant: 'outline', to: '/dashboard' }]"
	/>
</template>
