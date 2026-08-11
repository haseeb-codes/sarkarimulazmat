<script lang="ts">
	import { untrack } from 'svelte';
	import JobCard from '$lib/components/job-card.svelte';
	import JobListSkeleton from '$lib/components/jobs/job-list-skeleton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { filtersToSearchParams, type FilterParams, type JobSort } from '$lib/jobs-utils';

	type Job = {
		row_id: number;
		title: string | null;
		department: string | null;
		education_level: string | null;
		degree_area: string | null;
		degrees: string | null;
		grade: string | null;
		place_of_posting: string | null;
		domicile: string | null;
		gender: string | null;
		min_age: number | null;
		max_age: number | null;
		last_date_to_apply: string | Date | null;
		supabase_file_path?: string | null;
	};

	type Filters = {
		degree_areas: string[];
		education_level: string | null;
		grade: string | null;
		age: number | null;
		place_of_posting: string | null;
		domicile: string | null;
		q: string | null;
		show_expired: boolean;
		sort: JobSort;
		page: number;
		pageSize: number;
	};

	let {
		jobs,
		total,
		totalPages,
		filters,
		filtered,
		error,
		loading = false
	}: {
		jobs: Job[];
		total: number;
		totalPages: number;
		filters: Filters;
		filtered: boolean;
		error: string | null;
		loading?: boolean;
	} = $props();

	let items = $state<Job[]>([]);
	let loadedPage = $state(1);
	let loadingMore = $state(false);
	let loadMoreError = $state<string | null>(null);
	let sentinel = $state<HTMLElement | null>(null);

	const hasMore = $derived(loadedPage < totalPages && items.length < total);

	/** Stable key for the active result set — ignore page so scroll-loaded pages aren't wiped. */
	const resultKey = $derived(
		[
			filters.degree_areas.join('\0'),
			filters.education_level ?? '',
			filters.grade ?? '',
			filters.age ?? '',
			filters.place_of_posting ?? '',
			filters.domicile ?? '',
			filters.q ?? '',
			filters.show_expired ? '1' : '0',
			filters.sort,
			filters.pageSize,
			total
		].join('|')
	);

	/** Reset accumulated list when filters / totals change (not when appending pages). */
	$effect(() => {
		void resultKey;
		items = untrack(() => jobs);
		loadedPage = untrack(() => filters.page);
		loadMoreError = null;
	});

	async function loadMore() {
		if (loading || loadingMore || !hasMore) return;

		const nextPage = loadedPage + 1;
		loadingMore = true;
		loadMoreError = null;

		try {
			const params = filtersToSearchParams({
				...filters,
				page: nextPage,
				pageSize: filters.pageSize
			} as FilterParams);
			if (!params.has('pageSize')) params.set('pageSize', String(filters.pageSize));

			const res = await fetch(`/api/jobs?${params.toString()}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const data = (await res.json()) as {
				jobs: Job[];
				page: number;
				totalPages: number;
			};

			const seen = new Set(items.map((j) => j.row_id));
			const appended = data.jobs.filter((j) => !seen.has(j.row_id));
			items = [...items, ...appended];
			loadedPage = data.page;
		} catch (err) {
			console.error('Failed to load more jobs', err);
			loadMoreError = 'Could not load more jobs. Tap to retry.';
		} finally {
			loadingMore = false;
		}
	}

	$effect(() => {
		const el = sentinel;
		if (!el || loading || loadingMore || !hasMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					void loadMore();
				}
			},
			{ root: null, rootMargin: '480px 0px', threshold: 0 }
		);

		observer.observe(el);

		// If the sentinel is already on-screen after a page loads, keep fetching.
		const rect = el.getBoundingClientRect();
		if (rect.top < window.innerHeight + 480) {
			void loadMore();
		}

		return () => observer.disconnect();
	});
</script>

{#if loading}
	<JobListSkeleton />
{:else if error}
	<div
		class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		role="alert"
	>
		{error}
	</div>
{:else}
	<div class="space-y-4" aria-live="polite">
		<div class="flex items-baseline justify-between gap-2">
			<h2 class="text-base font-semibold">
				{total.toLocaleString()} job{total === 1 ? '' : 's'}
			</h2>
			{#if items.length > 0 && items.length < total}
				<p class="text-sm text-muted-foreground">
					Showing {items.length.toLocaleString()} of {total.toLocaleString()}
				</p>
			{/if}
		</div>

		{#if items.length === 0}
			<div class="rounded-lg border border-dashed border-border px-6 py-12 text-center">
				<p class="font-medium">No matching jobs</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Try clearing some eligibility filters — a narrow combination of degree,
					education, grade, and age often returns zero results.
				</p>
				{#if filtered}
					<Button href="/" variant="outline" class="mt-4">Clear filters</Button>
				{/if}
			</div>
		{:else}
			<ul class="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
				{#each items as job (job.row_id)}
					<li class="mb-3 break-inside-avoid">
						<JobCard {job} sort={filters.sort} />
					</li>
				{/each}
			</ul>

			{#if loadingMore}
				<ul
					class="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4"
					aria-hidden="true"
				>
					{#each Array(4) as _, i (i)}
						<li class="mb-3 break-inside-avoid">
							<Card.Root size="sm">
								<Card.Header class="gap-1.5 pb-2">
									<Skeleton class="h-5 w-3/4 max-w-[14rem]" />
									<Skeleton class="h-4 w-1/2 max-w-[10rem]" />
								</Card.Header>
								<Card.Content class="space-y-2 pt-0">
									<Skeleton class="h-3.5 w-2/3" />
									<Skeleton class="h-5 w-24 rounded-md" />
								</Card.Content>
							</Card.Root>
						</li>
					{/each}
				</ul>
			{/if}

			{#if loadMoreError}
				<div class="flex justify-center pt-2">
					<Button variant="outline" size="sm" onclick={() => void loadMore()}>
						{loadMoreError}
					</Button>
				</div>
			{:else if hasMore}
				<div bind:this={sentinel} class="h-8 w-full" aria-hidden="true"></div>
				<p class="sr-only" aria-live="polite">
					{loadingMore ? 'Loading more jobs' : 'Scroll for more jobs'}
				</p>
			{:else if items.length > 0}
				<p class="pt-2 text-center text-sm text-muted-foreground">
					You've seen all {total.toLocaleString()} job{total === 1 ? '' : 's'}
				</p>
			{/if}
		{/if}
	</div>
{/if}
