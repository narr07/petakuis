<script setup lang="ts">
	import type { DropdownMenuItem } from '@nuxt/ui'

	defineProps<{
		collapsed?: boolean
	}>()

	const colorMode = useColorMode()
	const router = useRouter()
	const { role, roleLabel, setRole } = useDashboardRole()

	const user = computed(() => {
		const profile = DEMO_USERS[role.value]
		return {
			name: profile.name,
			description: roleLabel.value,
			avatar: { alt: profile.name }
		}
	})

	const items = computed<DropdownMenuItem[][]>(() => [
		[
			{
				type: 'label',
				label: user.value.name,
				description: DEMO_USERS[role.value].email,
				avatar: user.value.avatar
			}
		],
		[
			{
				label: 'Ganti peran',
				icon: 'i-lucide-repeat',
				children: [
					{
						label: 'Guru',
						icon: 'i-lucide-graduation-cap',
						type: 'checkbox',
						checked: role.value === 'teacher',
						onSelect(e: Event) {
							e.preventDefault()
							setRole('teacher')
						}
					},
					{
						label: 'Admin Sekolah',
						icon: 'i-lucide-shield-check',
						type: 'checkbox',
						checked: role.value === 'admin',
						onSelect(e: Event) {
							e.preventDefault()
							setRole('admin')
						}
					}
				]
			},
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
				onSelect: () => router.push('/auth/login')
			}
		]
	])
</script>

<template>
	<UDropdownMenu
		:items="items"
		:content="{ align: 'center', collisionPadding: 12 }"
		:ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
	>
		<UButton
			:avatar="user.avatar"
			:label="collapsed ? undefined : user.name"
			:trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
			color="neutral"
			variant="ghost"
			block
			:square="collapsed"
			class="data-[state=open]:bg-elevated"
			:ui="{ trailingIcon: 'text-dimmed' }"
		/>
	</UDropdownMenu>
</template>
