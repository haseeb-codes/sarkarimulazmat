<script lang="ts">
	import FiltersDrawer from '$lib/components/jobs/filters-drawer.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';
	import type { FilterParams } from '$lib/jobs-utils';

	type ListingResult = {
		jobs: any[];
		total: number;
		totalPages: number;
		error: string | null;
	};

	const EMPTY_LISTING: ListingResult = {
		jobs: [],
		total: 0,
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
		resultCount: resultCountInput,
		loading = false
	}: {
		filters: FilterParams;
		listing: ListingResult | Promise<ListingResult>;
		resultCount?: number | Promise<number>;
		loading?: boolean;
	} = $props();

	let listing = $state<ListingResult>(EMPTY_LISTING);
	let listingPending = $state(isPromise(listingInput));
	let resultCount = $state<number | null>(null);
	let resultCountPending = $state(
		resultCountInput !== undefined && isPromise(resultCountInput)
	);

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

	$effect(() => {
		const input = resultCountInput;

		if (input === undefined) {
			resultCount = listing.total;
			resultCountPending = listingPending;
			return;
		}

		if (!isPromise(input)) {
			resultCount = input;
			resultCountPending = false;
			return;
		}

		let cancelled = false;
		resultCountPending = true;
		resultCount = null;

		void input.then((total) => {
			if (cancelled) return;
			resultCount = total;
			resultCountPending = false;
		});

		return () => {
			cancelled = true;
		};
	});

	const showListingLoading = $derived(loading || listingPending);
	const showCountLoading = $derived(resultCountPending);
</script>

<!--
  Keep FiltersDrawer mounted across listing updates so mobile drawer open state,
  sticky search, and window scroll aren't reset when listing refetches.
-->
<FiltersDrawer
	{filters}
	resultCount={resultCount}
	countLoading={showCountLoading}
	listingLoading={showListingLoading}
	listingError={listing.error}
>
	<JobList
		jobs={listing.jobs}
		total={resultCount ?? listing.total}
		totalPages={listing.totalPages}
		filters={filters as any}
		error={listing.error}
		loading={showListingLoading}
	/>
</FiltersDrawer>
