<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<article class="mx-auto max-w-3xl space-y-8" aria-hidden="true">
	<div class="space-y-3">
		<Skeleton class="h-4 w-20" />
		<div class="flex flex-wrap items-start justify-between gap-3">
			<Skeleton class="h-9 w-full max-w-lg" />
			<Skeleton class="h-6 w-16 rounded-full" />
		</div>
		<Skeleton class="h-5 w-48" />
	</div>

	<section class="space-y-4 rounded-lg border border-border bg-card p-5">
		<Skeleton class="h-6 w-24" />
		<div class="grid gap-4 sm:grid-cols-2">
			{#each Array(6) as _, i (i)}
				<div class="space-y-2">
					<Skeleton class="h-3 w-20" />
					<Skeleton class="h-4 w-full max-w-[12rem]" />
				</div>
			{/each}
		</div>
		<div class="flex flex-wrap gap-1.5">
			<Skeleton class="h-5 w-24 rounded-full" />
			<Skeleton class="h-5 w-28 rounded-full" />
		</div>
	</section>

	<section class="space-y-3">
		<Skeleton class="h-6 w-32" />
		<div class="flex flex-col gap-2 sm:flex-row">
			<Skeleton class="h-10 w-full sm:w-40" />
			<Skeleton class="h-10 w-full sm:w-36" />
		</div>
	</section>
</article>
