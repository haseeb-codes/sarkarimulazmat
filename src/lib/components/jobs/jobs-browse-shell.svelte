<script lang="ts">
	import FiltersDrawer from '$lib/components/jobs/filters-drawer.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';
	import type { FilterParams } from '$lib/jobs-utils';

	type ListingResult = {
		jobs: any[];
		/** null while the listing promise is still pending */
		total: number | null;
		totalPages: number;
		error: string | null;
	};

	const EMPTY_LISTING: ListingResult = {
		jobs: [],
		total: null,
		totalPages: 1,
		error: null
	};

	function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
		return (
			typeof value === 'object' &&
			value !== null &&
			'then' in value &&
			typeof (value as Promise<T>).then === 'function'
		);
	}

	let {
		filters,
		listing: listingInput,
		loading = false
	}: {
		filters: FilterParams;
		listing: ListingResult | Promise<ListingResult>;
		loading?: boolean;
	} = $props();

	let listing = $state<ListingResult>(EMPTY_LISTING);
	let listingPending = $state(isPromise(listingInput));

	$effect(() => {
		const input = listingInput;

		if (!isPromise(input)) {
			listing = input;
			listingPending = false;
			return;
		}

		let cancelled = false;
		listingPending = true;

		void input.then((result) => {
			if (cancelled) return;
			listing = result;
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
<FiltersDrawer
	{filters}
	resultCount={listing.total}
	listingLoading={showLoading}
	listingError={listing.error}
>
	<JobList
		jobs={listing.jobs}
		total={listing.total ?? 0}
		totalPages={listing.totalPages}
		filters={filters as any}
		error={listing.error}
		loading={showLoading}
	/>
</FiltersDrawer>
