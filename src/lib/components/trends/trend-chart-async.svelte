<script lang="ts">
	import type { TrendPoint } from '$lib/trends-types';
	import BarChart from '$lib/components/trends/bar-chart.svelte';
	import ChartSkeleton from '$lib/components/trends/chart-skeleton.svelte';

	let {
		promise,
		title,
		description,
		orientation = 'vertical',
		color = 'var(--chart-1)',
		accent = 'var(--chart-1)',
		emptyMessage = 'No data available.'
	}: {
		promise: Promise<TrendPoint[]>;
		title: string;
		description?: string;
		orientation?: 'vertical' | 'horizontal';
		color?: string;
		accent?: string;
		emptyMessage?: string;
	} = $props();
</script>

{#snippet pending()}
	<ChartSkeleton {orientation} />
{/snippet}

{#snippet failed(error: unknown)}
	<section
		class="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-sm text-destructive"
		role="alert"
	>
		<p class="font-medium">Could not load “{title}”.</p>
		<p class="mt-1 text-destructive/80">Please try refreshing the page.</p>
		<span class="sr-only">{String(error)}</span>
	</section>
{/snippet}

<svelte:boundary {pending} {failed}>
	{#await promise}
		<ChartSkeleton {orientation} />
	{:then data}
		<BarChart
			{title}
			{description}
			{data}
			{orientation}
			{color}
			{accent}
			{emptyMessage}
		/>
	{:catch error}
		{@render failed(error)}
	{/await}
</svelte:boundary>
