<script setup lang="ts">
	import { AVATAR_COLORWAYS, type AvatarColorway } from '@petakuis/shared'

	const route = useRoute()
	const router = useRouter()

	const PIN_LENGTH = 6

	const code = ref(String(route.query.code || '123456').slice(0, PIN_LENGTH))
	const nickname = ref('')
	const selectedColorway = ref<AvatarColorway>('merah-putih')
	const errorMessage = ref('')
	const loading = ref(false)

	// UPinInput memakai array of string, sementara logika lama memakai string
	const pin = computed<string[]>({
		get: () => code.value.split(''),
		set: (val) => {
			code.value = val.join('')
		}
	})

	const selectedPreset = computed(() =>
		AVATAR_COLORWAYS.find(p => p.id === selectedColorway.value)
	)

	function fillDemoPin() {
		code.value = '123456'
		errorMessage.value = ''
	}

	async function handleJoinRoom() {
		errorMessage.value = ''
		const cleanCode = code.value.trim()
		if (!cleanCode) {
			errorMessage.value = 'Masukkan kode ruangan 6 digit terlebih dahulu.'
			return
		}
		const cleanName = nickname.value.trim() || 'Petualang'

		loading.value = true
		try {
			await $fetch('/api/sessions/lookup', {
				query: { code: cleanCode }
			})
			await router.push({
				path: `/play/${encodeURIComponent(cleanCode)}`,
				query: {
					nickname: cleanName,
					colorway: selectedColorway.value
				}
			})
		} catch (err: unknown) {
			const e = err as { data?: { statusMessage?: string } }
			errorMessage.value
				= e?.data?.statusMessage
					|| 'Kode ruangan tidak ditemukan. Coba gunakan PIN demo 123456.'
		} finally {
			loading.value = false
		}
	}
</script>

<template>
	<UContainer class="relative py-10 sm:py-14">
		<!-- Dekorasi -->
		<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
			<div class="absolute -left-10 top-10 size-56 rounded-full bg-secondary/25 blur-2xl" />
			<div class="absolute -right-10 bottom-10 size-64 rounded-full bg-primary/25 blur-2xl" />
			<UIcon name="i-lucide-star" class="absolute left-[10%] top-[12%] size-8 animate-bounce text-warning" />
			<UIcon name="i-lucide-sparkles" class="absolute right-[12%] top-[20%] size-8 animate-pulse text-secondary" />
		</div>

		<div class="mx-auto max-w-xl">
			<UCard :ui="{ header: 'border-b border-default', body: 'p-5 sm:p-8' }">
				<template #header>
					<div class="flex items-center justify-between gap-2">
						<UBadge color="primary" variant="solid" icon="i-lucide-door-open">
							Gabung sesi kelas
						</UBadge>
						<UButton
							size="xs"
							color="warning"
							variant="soft"
							icon="i-lucide-wand-sparkles"
							label="Isi PIN Demo: 123456"
							@click="fillDemoPin"
						/>
					</div>

					<h1 class="mt-3 text-2xl font-extrabold sm:text-3xl">
						Siapkan Avatarmu!
					</h1>
					<p class="mt-1 text-sm text-muted">
						Masukkan kode ruangan dari layar proyektor guru dan pilih karakter
						sebelum masuk ke peta.
					</p>
				</template>

				<form class="space-y-6" @submit.prevent="handleJoinRoom">
					<!-- PIN -->
					<UFormField
						label="Kode ruangan (PIN 6 digit)"
						:ui="{ container: 'mt-2' }"
					>
						<div class="flex justify-center">
							<UPinInput
								v-model="pin"
								:length="PIN_LENGTH"
								type="number"
								size="xl"
								otp
								:ui="{ base: 'size-12 sm:size-14 text-2xl font-extrabold font-mono' }"
							/>
						</div>
					</UFormField>

					<!-- Nama -->
					<UFormField label="Nama panggilan di kelas">
						<UInput
							v-model="nickname"
							size="xl"
							class="w-full"
							icon="i-lucide-smile"
							maxlength="20"
							placeholder="Contoh: Budi Kelas 5A"
						/>
					</UFormField>

					<!-- Karakter -->
					<div>
						<div class="flex items-center justify-between">
							<span id="avatar-label" class="text-sm font-medium text-highlighted">
								Pilih karakter trainer
							</span>
							<UBadge v-if="selectedPreset" color="secondary" variant="subtle" size="sm">
								{{ selectedPreset.label }}
							</UBadge>
						</div>

						<div
							role="radiogroup"
							aria-labelledby="avatar-label"
							class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
						>
							<button
								v-for="preset in AVATAR_COLORWAYS"
								:key="preset.id"
								type="button"
								role="radio"
								:aria-checked="selectedColorway === preset.id"
								class="relative flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left text-xs font-bold transition-all focus-visible:outline-3 focus-visible:outline-primary/40"
								:class="
									selectedColorway === preset.id
										? 'border-[var(--ui-text-highlighted)] bg-primary/15 shadow-[3px_3px_0px_0px_var(--ui-text-highlighted)]'
										: 'border-accented bg-default hover:-translate-y-0.5 hover:border-[var(--ui-text-highlighted)]'
								"
								@click="selectedColorway = preset.id"
							>
								<span
									class="relative flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--ui-text-highlighted)] bg-success/20"
								>
									<span class="relative block h-8 w-4 overflow-hidden">
										<img
											:src="preset.spriteUrl"
											:alt="preset.label"
											class="absolute left-0 top-0 h-8 max-w-none"
											style="image-rendering: pixelated; width: 144px"
										>
									</span>
								</span>
								<span class="truncate">{{ preset.label }}</span>

								<UIcon
									v-if="selectedColorway === preset.id"
									name="i-lucide-circle-check"
									class="absolute -right-2 -top-2 size-5 rounded-full bg-default text-primary"
								/>
							</button>
						</div>
					</div>

					<!-- Error -->
					<UAlert
						v-if="errorMessage"
						color="error"
						variant="subtle"
						icon="i-lucide-circle-alert"
						title="Oops!"
						:description="errorMessage"
					/>

					<UButton
						type="submit"
						size="xl"
						block
						color="secondary"
						trailing-icon="i-lucide-arrow-right"
						:loading="loading"
						:label="loading ? 'Memeriksa ruangan...' : 'Masuk ke Peta Permainan'"
					/>
				</form>
			</UCard>
		</div>
	</UContainer>
</template>