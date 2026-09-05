<script lang="ts">
	import FiltersDrawer from '$lib/components/jobs/filters-drawer.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';
	import { filtersToSearchParams, type FilterParams } from '$lib/jobs-utils';

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
		closingOnDates = null,
		loading = false
	}: {
		filters: FilterParams;
		listing: ListingResult | Promise<ListingResult>;
		resultCount?: number | Promise<number>;
		/** Unique last-date-to-apply values for the Closing On filter (streamed). */
		closingOnDates?: Promise<string[]> | string[] | null;
		loading?: boolean;
	} = $props();

	/** Identity of the active filter set — mirrors URL search params, ignores page. */
	const filterKey = $derived(
		filtersToSearchParams({ ...filters, page: 1 }).toString()
	);

	/**
	 * Resolved payloads carry the filter set they were requested for. Anything tagged with a
	 * stale key is treated as still-loading, so results from the previous filters are never
	 * rendered against the current ones.
	 */
	let resolvedListing = $state<{ key: string; value: ListingResult } | null>(null);
	let resolvedCount = $state<{ key: string; value: number } | null>(null);

	$effect(() => {
		const input = listingInput;
		const key = filterKey;

		if (!isPromise(input)) {
			resolvedListing = { key, value: input };
			return;
		}

		let cancelled = false;

		void input.then((value) => {
			if (!cancelled) resolvedListing = { key, value };
		});

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const input = resultCountInput;
		const key = filterKey;

		if (input === undefined) return;

		if (!isPromise(input)) {
			resolvedCount = { key, value: input };
			return;
		}

		let cancelled = false;

		void input.then((value) => {
			if (!cancelled) resolvedCount = { key, value };
		});

		return () => {
			cancelled = true;
		};
	});

	const listing = $derived.by(() => {
		const resolved = resolvedListing;
		return resolved && resolved.key === filterKey ? resolved.value : null;
	});

	const resultCount = $derived.by(() => {
		if (resultCountInput === undefined) return listing?.total ?? null;
		const resolved = resolvedCount;
		return resolved && resolved.key === filterKey ? resolved.value : null;
	});

	const showListingLoading = $derived(loading || listing === null);
	const showCountLoading = $derived(loading || resultCount === null);
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
	listingError={listing?.error ?? null}
	{closingOnDates}
>
	<JobList
		jobs={(listing ?? EMPTY_LISTING).jobs}
		total={resultCount ?? listing?.total ?? 0}
		totalPages={listing?.totalPages ?? 1}
		filters={filters as any}
		error={listing?.error ?? null}
		loading={showListingLoading}
	/>
</FiltersDrawer>
