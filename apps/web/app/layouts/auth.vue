<template>
	<div class="relative flex min-h-dvh items-center justify-center px-4 py-16">
		<UButton
			icon="i-lucide-chevron-left"
			to="/"
			size="xl"
			color="neutral"
			variant="subtle"
			aria-label="Kembali ke beranda"
			class="absolute left-4 top-4 z-10 rounded-full sm:left-8 sm:top-8"
		/>

		<UPageCard variant="subtle" class="w-full max-w-md">
			<slot />
		</UPageCard>
	</div>
</template>
