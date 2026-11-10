<script setup lang="ts">
	import { AVATAR_COLORWAYS, type AvatarColorway } from '@petakuis/shared'

	const route = useRoute()
	const router = useRouter()

	const code = ref(String(route.query.code || '123456'))
	const nickname = ref('')
	const selectedColorway = ref<AvatarColorway>('merah-putih')
	const errorMessage = ref('')
	const loading = ref(false)

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
		} catch (err: any) {
			errorMessage.value =
				err?.data?.statusMessage ||
				'Kode ruangan tidak ditemukan. Coba gunakan PIN demo 123456.'
		} finally {
			loading.value = false
		}
	}
</script>

<template>
	<div class="mx-auto max-w-xl px-4 py-10 sm:py-14">
		<div class="pixel-card rounded-2xl p-6 sm:p-8">
			<div class="flex items-center justify-between">
				<span class="font-pixel text-xs text-[#15803d]">GABUNG SESI KELAS</span>
				<button
					type="button"
					class="rounded border border-[#16211b] bg-[#fef08a] px-2.5 py-1 font-mono-num text-xs font-extrabold text-[#16211b]"
					@click="code = '123456'"
				>
					Isi PIN Demo: 123456
				</button>
			</div>

			<h1 class="mt-3 text-2xl font-extrabold text-[#16211b] sm:text-3xl">
				Siapkan Avatarmu
			</h1>
			<p class="mt-1 text-sm text-[#435249]">
				Masukkan kode ruangan dari layar proyektor guru dan pilih warna seragam
				sebelum masuk ke peta.
			</p>

			<form
				class="mt-6 space-y-5"
				@submit.prevent="handleJoinRoom"
			>
				<div>
					<label
						for="join-code-input"
						class="block text-xs font-extrabold uppercase tracking-wider text-[#16211b]"
					>
						Kode Ruangan (PIN 6 Digit)
					</label>
					<input
						id="join-code-input"
						v-model="code"
						type="text"
						maxlength="8"
						required
						class="font-mono-num mt-1.5 w-full rounded-xl border-2 border-[#16211b] bg-[#faf6ee] px-4 py-3 text-center text-2xl font-extrabold tracking-widest text-[#16211b]"
					/>
				</div>

				<div>
					<label
						for="join-nickname-input"
						class="block text-xs font-extrabold uppercase tracking-wider text-[#16211b]"
					>
						Nama Panggilan di Kelas
					</label>
					<input
						id="join-nickname-input"
						v-model="nickname"
						type="text"
						maxlength="20"
						placeholder="Contoh: Budi Kelas 5A"
						class="mt-1.5 w-full rounded-xl border-2 border-[#16211b] bg-white px-4 py-3 text-base font-bold text-[#16211b]"
					/>
				</div>

				<div>
					<span
						class="block text-xs font-extrabold uppercase tracking-wider text-[#16211b]"
					>
						Pilih Karakter Trainer GBA Pokémon
					</span>
					<div class="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
						<button
							v-for="preset in AVATAR_COLORWAYS"
							:key="preset.id"
							type="button"
							class="flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left text-xs font-bold transition-transform"
							:class="
								selectedColorway === preset.id
									? 'border-[#16211b] bg-[#fef08a] shadow-[2px_2px_0px_#16211b]'
									: 'border-[#16211b]/40 bg-white hover:border-[#16211b]'
							"
							@click="selectedColorway = preset.id"
						>
							<span
								class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#16211b] bg-[#dcfce7]"
							>
								<span class="relative block h-8 w-4 overflow-hidden">
									<img
										:src="preset.spriteUrl"
										:alt="preset.label"
										class="absolute left-0 top-0 h-8 max-w-none"
										style="image-rendering: pixelated; width: 144px"
									/>
								</span>
							</span>
							<span class="truncate">{{ preset.label }}</span>
						</button>
					</div>
				</div>

				<p
					v-if="errorMessage"
					role="alert"
					class="rounded-xl border-2 border-[#991b1b] bg-[#fee2e2] px-4 py-3 text-xs font-bold text-[#991b1b]"
				>
					{{ errorMessage }}
				</p>

				<button
					type="submit"
					:disabled="loading"
					class="pixel-btn w-full rounded-xl bg-[#15803d] py-3.5 text-base font-extrabold text-white"
				>
					{{ loading ? 'Memeriksa Ruangan...' : 'Masuk ke Peta Permainan' }}
				</button>
			</form>
		</div>
	</div>
</template>
