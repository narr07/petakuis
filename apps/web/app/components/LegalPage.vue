<script setup lang="ts">
	export interface LegalSection {
		title: string
		paragraphs?: string[]
		items?: string[]
	}

	defineProps<{
		title: string
		description: string
		updated: string
		sections: LegalSection[]
	}>()

	const contactEmail = useRuntimeConfig().public.contactEmail
</script>

<template>
	<UContainer>
		<UPage>
			<UPageHeader :title="title" :description="description">
				<template #headline>
					<UBadge :label="`Berlaku sejak ${updated}`" color="neutral" variant="subtle" />
				</template>
			</UPageHeader>

			<UPageBody class="max-w-3xl space-y-10">
				<section v-for="(section, i) in sections" :key="section.title" class="space-y-3">
					<h2 class="text-xl font-semibold text-highlighted">
						{{ i + 1 }}. {{ section.title }}
					</h2>
					<p v-for="p in section.paragraphs" :key="p" class="leading-7 text-muted">
						{{ p }}
					</p>
					<ul v-if="section.items?.length" class="list-disc space-y-2 ps-6 leading-7 text-muted">
						<li v-for="item in section.items" :key="item">
							{{ item }}
						</li>
					</ul>
				</section>

				<UAlert
					icon="i-lucide-mail"
					color="neutral"
					variant="subtle"
					title="Pertanyaan atau permintaan hapus data"
					:description="contactEmail
						? `Hubungi pengelola Petakuis di ${contactEmail}.`
						: 'Hubungi pengelola Petakuis melalui email dukungan yang tertera di layar login Google.'"
				/>
			</UPageBody>
		</UPage>
	</UContainer>
</template>
