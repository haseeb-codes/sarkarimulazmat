<script lang="ts">
	import FiltersDrawer from '$lib/components/jobs/filters-drawer.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';
	import JobListSkeleton from '$lib/components/jobs/job-list-skeleton.svelte';
	import type { FilterParams } from '$lib/jobs-utils';

	type ListingResult = {
		jobs: any[];
		total: number;
		totalPages: number;
		error: string | null;
	};

	let {
		filters,
		filtered,
		listing,
		loading = false
	}: {
		filters: FilterParams;
		filtered: boolean;
		listing: Promise<ListingResult>;
		loading?: boolean;
	} = $props();

	/** Keep last known total so the shell count doesn't flash on each listing fetch. */
	let resultCount = $state<number | null>(null);

	$effect(() => {
		let cancelled = false;
		listing.then((result) => {
			if (!cancelled) resultCount = result.total;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<!--
  Keep FiltersDrawer mounted across listing updates so mobile drawer open state,
  sticky search, and window scroll aren't reset when {#await} flips pending/then.
-->
<FiltersDrawer {filters} {resultCount}>
	{#await listing}
		<JobListSkeleton />
	{:then result}
		<JobList
			jobs={result.jobs}
			total={result.total}
			totalPages={result.totalPages}
			filters={filters as any}
			{filtered}
			error={result.error}
			{loading}
		/>
	{/await}
</FiltersDrawer>
