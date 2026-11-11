<script setup lang="ts">
	import type { DropdownMenuItem } from '@nuxt/ui'

	defineProps<{
		collapsed?: boolean
	}>()

	const school = {
		label: DEMO_SCHOOL.name,
		avatar: { src: '/mascot.svg', alt: 'Petakuis' }
	}

	const items: DropdownMenuItem[][] = [
		[{ type: 'label', label: 'Sekolah aktif' }, { ...school, type: 'checkbox', checked: true }],
		[
			{ label: 'Pengaturan sekolah', icon: 'i-lucide-settings', to: '/dashboard/settings' },
			{ label: 'Daftar guru', icon: 'i-lucide-graduation-cap', to: '/dashboard/teachers' }
		]
	]
</script>

<template>
	<UDropdownMenu
		:items="items"
		:content="{ align: 'center', collisionPadding: 12 }"
		:ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
	>
		<UButton
			v-bind="{
				...school,
				label: collapsed ? undefined : school.label,
				trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
			}"
			color="neutral"
			variant="ghost"
			block
			:square="collapsed"
			class="data-[state=open]:bg-elevated"
			:class="[!collapsed && 'py-2']"
			:ui="{ trailingIcon: 'text-dimmed', label: 'truncate' }"
		/>
	</UDropdownMenu>
</template>
