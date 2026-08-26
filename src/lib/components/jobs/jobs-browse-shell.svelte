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
</script>

{#await listing}
	<!-- Static shell (filters + search) renders immediately; jobs show skeleton. -->
	<FiltersDrawer {filters} resultCount={null}>
		<JobListSkeleton />
	</FiltersDrawer>
{:then result}
	<FiltersDrawer {filters} resultCount={result.total}>
		<JobList
			jobs={result.jobs}
			total={result.total}
			totalPages={result.totalPages}
			filters={filters as any}
			{filtered}
			error={result.error}
			{loading}
		/>
	</FiltersDrawer>
{/await}
