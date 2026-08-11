<script lang="ts">
	import JobFilters from '$lib/components/job-filters.svelte';
	import FilterPanelSkeleton from '$lib/components/jobs/filter-panel-skeleton.svelte';
	import type { JobSort } from '$lib/jobs-utils';

	type FilterOptions = {
		degree_areas: string[];
		degrees: string[];
		education_levels: string[];
		grades: string[];
		places: string[];
		domiciles: string[];
	};

	type Filters = {
		degree_areas: string[];
		education_level: string | null;
		grade: string | null;
		age: number | null;
		place_of_posting: string | null;
		domicile: string | null;
		department?: string | null;
		collar?: string | null;
		has_salary?: boolean;
		q: string | null;
		show_expired: boolean;
		sort: JobSort;
	};

	let {
		filters,
		options,
		resultCount
	}: {
		filters: Filters;
		options: Promise<FilterOptions>;
		resultCount: number;
	} = $props();
</script>

{#snippet pending()}
	<FilterPanelSkeleton />
{/snippet}

{#snippet failed(error: unknown)}
	<div class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
		Could not load filter options.
		<span class="sr-only">{String(error)}</span>
	</div>
{/snippet}

<svelte:boundary {pending} {failed}>
	{#await options}
		<FilterPanelSkeleton />
	{:then resolved}
		<JobFilters {filters} options={resolved} {resultCount} />
	{:catch error}
		{@render failed(error)}
	{/await}
</svelte:boundary>
