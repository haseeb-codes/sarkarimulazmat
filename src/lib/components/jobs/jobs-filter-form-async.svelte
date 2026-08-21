<script lang="ts">
	import JobsFilterForm from '$lib/components/jobs/jobs-filter-form.svelte';
	import JobsFilterFormSkeleton from '$lib/components/jobs/jobs-filter-form-skeleton.svelte';
	import type { FilterParams } from '$lib/jobs-utils';

	type FilterOptions = {
		grades: string[];
		salary_max: number;
	};

	let {
		filters,
		options,
		resultCount,
		idPrefix = ''
	}: {
		filters: FilterParams;
		options: Promise<FilterOptions>;
		resultCount: number;
		idPrefix?: string;
	} = $props();
</script>

{#snippet failed(error: unknown)}
	<div
		class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
	>
		Could not load filter options.
		<span class="sr-only">{String(error)}</span>
	</div>
{/snippet}

{#await options}
	<JobsFilterFormSkeleton />
{:then resolved}
	<JobsFilterForm {filters} options={resolved} {resultCount} {idPrefix} />
{:catch error}
	{@render failed(error)}
{/await}
