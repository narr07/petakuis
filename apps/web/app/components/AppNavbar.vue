<script setup lang="ts">
	const route = useRoute()
</script>

<template>
	<header
		class="sticky top-0 z-40 border-b-2 border-[#16211b] bg-[#faf6ee]/95 backdrop-blur"
	>
		<div
			class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"
		>
			<NuxtLink
				to="/"
				class="flex items-center gap-3 group"
			>
				<img
					src="/mascot.svg"
					alt="Maskot Kuispi Petakuis"
					class="h-10 w-10 shrink-0 drop-shadow-[2px_2px_0px_#16211b] transition-transform group-hover:scale-105"
				/>
				<div>
					<div class="flex items-center gap-2">
						<span class="text-lg font-extrabold tracking-tight text-[#16211b]">
							Petakuis
						</span>
						<span
							class="rounded border border-[#16211b] bg-[#dcfce7] px-1.5 py-0.5 text-[11px] font-bold text-[#14532d]"
						>
							100% GRATIS
						</span>
					</div>
					<p class="text-xs text-[#435249] hidden sm:block">
						Kuis Kelas Petualangan 2D
					</p>
				</div>
			</NuxtLink>

			<nav
				aria-label="Navigasi Utama"
				class="flex items-center gap-2 sm:gap-3"
			>
				<NuxtLink
					to="/explore"
					class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
					:class="
						route.path.startsWith('/explore')
							? 'bg-[#16211b] text-white'
							: 'text-[#16211b] hover:bg-[#e6decb]'
					"
				>
					Jelajah Kuis
				</NuxtLink>
				<NuxtLink
					to="/build"
					class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
					:class="
						route.path.startsWith('/build')
							? 'bg-[#16211b] text-white'
							: 'text-[#16211b] hover:bg-[#e6decb]'
					"
				>
					Buat Kuis
				</NuxtLink>
				<NuxtLink
					to="/logs"
					class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
					:class="
						route.path.startsWith('/logs')
							? 'bg-[#16211b] text-white'
							: 'text-[#16211b] hover:bg-[#e6decb]'
					"
				>
					Log Server
				</NuxtLink>
				<NuxtLink
					to="/join"
					class="pixel-btn rounded-lg bg-[#f59e0b] px-3.5 py-2 text-sm font-bold text-[#16211b]"
				>
					Masuk Kode PIN
				</NuxtLink>
			</nav>
		</div>
	</header>
</template>
