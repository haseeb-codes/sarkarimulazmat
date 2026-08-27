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
		listing: ListingResult;
		loading?: boolean;
	} = $props();
</script>

<!--
  Keep FiltersDrawer mounted across listing updates so mobile drawer open state,
  sticky search, and window scroll aren't reset when listing refetches.
-->
<FiltersDrawer
	{filters}
	resultCount={listing.total}
	listingLoading={loading}
	listingError={listing.error}
>
	{#if loading}
		<JobListSkeleton showHeader={false} />
	{:else}
		<JobList
			jobs={listing.jobs}
			total={listing.total}
			totalPages={listing.totalPages}
			filters={filters as any}
			error={listing.error}
			loading={loading}
		/>
	{/if}
</FiltersDrawer>
