<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let {
		orientation = 'vertical'
	}: {
		orientation?: 'vertical' | 'horizontal';
	} = $props();

	const horizontalWidths = [88, 76, 64, 52, 44, 36, 28];
	const verticalHeights = [42, 68, 55, 78, 48, 62, 35];
</script>

<section
	class="trend-chart-shell overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm sm:p-5"
	aria-busy="true"
	aria-label="Loading chart"
>
	<div class="mb-5 space-y-2">
		<Skeleton class="h-5 w-48" />
		<Skeleton class="h-3.5 w-72 max-w-full" />
		<Skeleton class="h-3 w-28" />
	</div>

	{#if orientation === 'horizontal'}
		<div class="space-y-3">
			{#each horizontalWidths as width, i (i)}
				<div
					class="grid grid-cols-[minmax(0,7rem)_1fr_2rem] items-center gap-2 sm:grid-cols-[minmax(0,9rem)_1fr_2.5rem]"
				>
					<Skeleton class="h-3.5 w-full" />
					<div class="h-5 w-full">
						<Skeleton class="h-full" style="width: {width}%" />
					</div>
					<Skeleton class="h-3.5 w-full" />
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex h-52 items-end gap-2 sm:h-56 sm:gap-3">
			{#each verticalHeights as height, i (i)}
				<div class="flex flex-1 flex-col items-center gap-2">
					<Skeleton class="h-3 w-6" />
					<div class="flex h-40 w-full items-end sm:h-44">
						<Skeleton class="w-full max-w-10 rounded-t-md" style="height: {height}%" />
					</div>
					<Skeleton class="h-3 w-8" />
				</div>
			{/each}
		</div>
	{/if}
</section>
