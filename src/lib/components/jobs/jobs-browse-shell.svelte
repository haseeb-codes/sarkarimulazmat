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
		listing,
		loading = false
	}: {
		filters: FilterParams;
		listing: Promise<ListingResult>;
		loading?: boolean;
	} = $props();

	/** Keep last listing so Clear / results chrome stay mounted across fetches. */
	let result = $state<ListingResult | null>(null);
	let resultCount = $state<number | null>(null);
	let listingPending = $state(true);

	$effect(() => {
		let cancelled = false;
		listingPending = true;
		listing.then((next) => {
			if (cancelled) return;
			result = next;
			resultCount = next.total;
			listingPending = false;
		});
		return () => {
			cancelled = true;
		};
	});

	const showLoading = $derived(loading || listingPending);
</script>

<!--
  Keep FiltersDrawer mounted across listing updates so mobile drawer open state,
  sticky search, and window scroll aren't reset when listing refetches.
-->
<FiltersDrawer {filters} {resultCount}>
	{#if result}
		<JobList
			jobs={result.jobs}
			total={result.total}
			totalPages={result.totalPages}
			filters={filters as any}
			error={result.error}
			loading={showLoading}
		/>
	{:else}
		<JobListSkeleton />
	{/if}
</FiltersDrawer>
