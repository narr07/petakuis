<script setup lang="ts">
	import type { DropdownMenuItem } from '@nuxt/ui'

	defineProps<{
		collapsed?: boolean
	}>()

	const colorMode = useColorMode()
	const { user, roleLabel, signOut } = useCurrentUser()

	const avatar = computed(() => ({
		src: user.value?.image || undefined,
		alt: user.value?.name || 'Pengguna'
	}))

	const items = computed<DropdownMenuItem[][]>(() => [
		[
			{
				type: 'label',
				label: user.value?.name || 'Pengguna',
				description: `${user.value?.email ?? ''} · ${roleLabel.value}`,
				avatar: avatar.value
			}
		],
		[
			{
				label: 'Tampilan',
				icon: 'i-lucide-sun-moon',
				children: [
					{
						label: 'Terang',
						icon: 'i-lucide-sun',
						type: 'checkbox',
						checked: colorMode.value === 'light',
						onSelect(e: Event) {
							e.preventDefault()
							colorMode.preference = 'light'
						}
					},
					{
						label: 'Gelap',
						icon: 'i-lucide-moon',
						type: 'checkbox',
						checked: colorMode.value === 'dark',
						onSelect(e: Event) {
							e.preventDefault()
							colorMode.preference = 'dark'
						}
					}
				]
			}
		],
		[
			{ label: 'Kembali ke beranda', icon: 'i-lucide-house', to: '/' },
			{ label: 'Status pengembangan', icon: 'i-lucide-activity', to: '/logs' }
		],
		[
			{
				label: 'Keluar',
				icon: 'i-lucide-log-out',
				onSelect: () => signOut()
			}
		]
	])
</script>

<template>
	<UDropdownMenu
		:items="items"
		:content="{ align: 'center', collisionPadding: 12 }"
		:ui="{ content: collapsed ? 'w-56' : 'w-(--reka-dropdown-menu-trigger-width)' }"
	>
		<UButton
			:avatar="avatar"
			:label="collapsed ? undefined : (user?.name || 'Pengguna')"
			:trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
			color="neutral"
			variant="ghost"
			block
			:square="collapsed"
			class="data-[state=open]:bg-elevated"
			:ui="{ trailingIcon: 'text-dimmed', label: 'truncate' }"
		/>
	</UDropdownMenu>
</template>
