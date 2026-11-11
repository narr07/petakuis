<script setup lang="ts">
	const toast = useToast()
	const target = useDeleteUserTarget()
	const deleting = ref(false)

	const open = computed({
		get: () => target.value !== null,
		set: (value: boolean) => {
			if (!value && !deleting.value) target.value = null
		}
	})

	async function confirmDelete() {
		const u = target.value
		if (!u) return
		deleting.value = true
		try {
			await $fetch(`/api/admin/users/${encodeURIComponent(u.id)}`, { method: 'DELETE' })
			toast.add({ title: 'Akun dihapus', description: u.email, icon: 'i-lucide-user-x' })
			target.value = null
			await refreshNuxtData('admin-users')
		} catch (err: unknown) {
			const e = err as { data?: { statusMessage?: string } }
			toast.add({
				title: 'Akun belum terhapus',
				description: e?.data?.statusMessage || 'Coba lagi sebentar lagi.',
				icon: 'i-lucide-circle-alert',
				color: 'error'
			})
		} finally {
			deleting.value = false
		}
	}
</script>

<template>
	<UModal
		v-model:open="open"
		title="Hapus akun ini?"
		:description="target ? `${target.name} (${target.email}) tidak bisa masuk lagi dan harus mendaftar ulang. Kuis dan laporan nilai yang sudah dibuatnya tetap tersimpan.` : ''"
		:dismissible="!deleting"
	>
		<template #footer="{ close }">
			<div class="flex w-full justify-end gap-2">
				<UButton label="Batal" color="neutral" variant="outline" :disabled="deleting" @click="close" />
				<UButton label="Hapus akun" icon="i-lucide-user-x" color="error" :loading="deleting" @click="confirmDelete" />
			</div>
		</template>
	</UModal>
</template>
