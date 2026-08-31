<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import JobCard from '$lib/components/job-card.svelte';
	import JobListSkeleton from '$lib/components/jobs/job-list-skeleton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { browseShownCount, browseViewMode, initBrowseViewModeForViewport } from '$lib/browse-view-mode';
	import {
		filtersToSearchParams,
		urlHasSearchParams,
		type FilterParams,
		type JobSort
	} from '$lib/jobs-utils';

	type Job = {
		row_id: number;
		slug: string;
		title: string | null;
		department: string | null;
		education_level: string | null;
		project_program_name: string | null;
		ad_date: string | Date | null;
		degree_area: string | null;
		degrees: string | null;
		grade: string | null;
		place_of_posting: string | null;
		domicile: string | null;
		gender: string | null;
		disability_quota?: boolean | null;
		collar: string | null;
		donor_name: string | null;
		salary: number | null;
		min_age: number | null;
		max_age: number | null;
		last_date_to_apply: string | Date | null;
		supabase_file_path?: string | null;
		application_online_address?: string | null;
		email?: string | null;
	};

	type Filters = FilterParams & {
		degree_areas: string[];
		education_level: string | null;
		grade: string | null;
		age: number | null;
		age_from: number | null;
		age_to: number | null;
		include_no_max_age: boolean;
		place_of_posting: string | null;
		domicile: string[];
		domicile_region: string[];
		tag: string[];
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
		error,
		loading = false
	}: {
		jobs: Job[];
		total: number;
		totalPages: number;
		filters: Filters;
		error: string | null;
		loading?: boolean;
	} = $props();

	let loadingMore = $state(false);
	let loadMoreError = $state<string | null>(null);
	let sentinel = $state<HTMLElement | null>(null);
	/** slugs just appended via infinite scroll — highlighted briefly */
	let freshIds = $state<Set<string>>(new Set());
	let freshClearTimer: ReturnType<typeof setTimeout> | null = null;

	const HIGHLIGHT_MS = 2800;

	/** Identity of the active filter set — mirrors URL search params, ignores page. */
	const resultKey = $derived(
		filtersToSearchParams({ ...filters, page: 1 }).toString()
	);

	/**
	 * Pages appended by infinite scroll, tagged with the filter set they belong to so a
	 * response for stale filters is discarded rather than rendered.
	 */
	let appended = $state<{ key: string; groups: { page: number; jobs: Job[] }[] }>({
		key: '',
		groups: []
	});

	const appendedGroups = $derived(appended.key === resultKey ? appended.groups : []);

	/** The server payload is always page one; scroll-loaded pages follow it. */
	const pageGroups = $derived([{ page: filters.page, jobs }, ...appendedGroups]);
	const visibleGroups = $derived(pageGroups.filter((group) => group.jobs.length > 0));
	const listItems = $derived(visibleGroups.flatMap((group) => group.jobs));

	const loadedPage = $derived(
		appendedGroups.length ? appendedGroups[appendedGroups.length - 1].page : filters.page
	);
	const hasMore = $derived(loadedPage < totalPages && listItems.length < total);
	const viewMode = $derived($browseViewMode);

	const browseUrl = $derived(
		navigating.to?.url.pathname === page.url.pathname ? navigating.to.url : page.url
	);

	/** Any query param — keep Clear visible for q / sort / tags / etc. */
	const hasSearchParams = $derived(urlHasSearchParams(browseUrl));

	function clearFilters() {
		goto(page.url.pathname, {
			keepFocus: true,
			noScroll: true
		});
	}

	function clearFreshHighlight() {
		if (freshClearTimer) {
			clearTimeout(freshClearTimer);
			freshClearTimer = null;
		}
		freshIds = new Set();
	}

	function markFresh(ids: string[]) {
		if (!ids.length) return;
		if (freshClearTimer) clearTimeout(freshClearTimer);
		freshIds = new Set(ids);
		freshClearTimer = setTimeout(() => {
			freshIds = new Set();
			freshClearTimer = null;
		}, HIGHLIGHT_MS);
	}

	$effect(() => {
		browseShownCount.set(listItems.length);
	});

	$effect(() => {
		initBrowseViewModeForViewport();
	});

	$effect(() => {
		return () => {
			browseShownCount.set(0);
			if (freshClearTimer) clearTimeout(freshClearTimer);
		};
	});

	/** Drop stale scroll state and highlights when the filter set changes. */
	$effect(() => {
		void resultKey;
		loadMoreError = null;
		clearFreshHighlight();
	});

	async function loadMore() {
		if (loading || loadingMore || !hasMore) return;

		const key = resultKey;
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

			if (key !== resultKey) return;

			const seen = new Set(listItems.map((job) => job.slug));
			const newJobs = data.jobs.filter((job) => !seen.has(job.slug));
			const groups = appended.key === key ? appended.groups : [];
			appended = { key, groups: [...groups, { page: data.page, jobs: newJobs }] };
			markFresh(newJobs.map((job) => job.slug));
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

		if (el.getBoundingClientRect().top < window.innerHeight + 480) {
			void loadMore();
		}

		return () => observer.disconnect();
	});
</script>

<div class="space-y-2" aria-live="polite">
	<!-- Keep card rings/borders in a lower stacking context than sticky chrome -->
	<div class="relative z-0">
		{#if loading}
			<JobListSkeleton showHeader={false} />
		{:else if error}
			<div
				class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				role="alert"
			>
				{error}
			</div>
		{:else if listItems.length === 0}
			<div class="rounded-lg border border-dashed border-border px-6 py-12 text-center">
				<p class="font-medium">No matching jobs</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Try clearing some eligibility filters — a narrow combination of degree,
					education, grade, and age often returns zero results.
				</p>
				{#if hasSearchParams}
					<Button type="button" variant="destructive" class="mt-4" onclick={clearFilters}>
						Clear all filters
					</Button>
				{/if}
			</div>
		{:else}
			{#each visibleGroups as group, i (group.page)}
				{#if i > 0}
					{@const jobsShownSoFar =
						visibleGroups.slice(0, i).reduce((sum, g) => sum + g.jobs.length, 0) +
						group.jobs.length}
					{@const jobsLeft = total - jobsShownSoFar}
					<div class="flex items-center gap-3 py-2">
						<div class="h-px flex-1 bg-border"></div>
						<span class="shrink-0 text-xs font-medium text-muted-foreground">
							Page {group.page} of {totalPages} ({jobsLeft.toLocaleString()} job{jobsLeft === 1
								? ''
								: 's'} left)
						</span>
						<div class="h-px flex-1 bg-border"></div>
					</div>
				{/if}
				{#if viewMode === 'list'}
					<ul class="relative z-0 flex flex-col gap-2 sm:gap-3">
						{#each group.jobs as job (job.slug)}
							<li>
								<JobCard
									{job}
									sort={filters.sort}
									fresh={freshIds.has(job.slug)}
									layout="list"
								/>
							</li>
						{/each}
					</ul>
				{:else}
					<!-- z-0: CSS columns otherwise paint card rings above sticky search/header -->
					<ul class="relative z-0 columns-1 gap-2 sm:columns-2 sm:gap-3 lg:columns-3">
						{#each group.jobs as job (job.slug)}
							<li class="mb-2 break-inside-avoid sm:mb-3">
								<JobCard
									{job}
									sort={filters.sort}
									fresh={freshIds.has(job.slug)}
									layout="masonry"
								/>
							</li>
						{/each}
					</ul>
				{/if}
			{/each}

			{#if loadingMore}
				{#if viewMode === 'list'}
					<ul class="flex flex-col gap-2 sm:gap-3" aria-hidden="true">
						{#each Array(3) as _, i (i)}
							<li>
								<Card.Root size="sm">
									<div class="flex gap-4 p-3 sm:px-4">
										<div class="min-w-0 flex-1 space-y-2">
											<Skeleton class="h-4 w-24" />
											<Skeleton class="h-5 w-3/4 max-w-[20rem]" />
											<Skeleton class="h-4 w-1/2 max-w-[14rem]" />
										</div>
										<Skeleton class="h-8 w-20 shrink-0" />
									</div>
								</Card.Root>
							</li>
						{/each}
					</ul>
				{:else}
					<ul class="columns-1 gap-2 sm:columns-2 sm:gap-3 lg:columns-3" aria-hidden="true">
						{#each Array(3) as _, i (i)}
							<li class="mb-2 break-inside-avoid sm:mb-3">
								<Card.Root>
									<Card.Header>
										<Skeleton class="h-4 w-24" />
										<Skeleton class="mt-2 h-5 w-3/4" />
									</Card.Header>
									<Card.Content class="space-y-2">
										<Skeleton class="h-4 w-full" />
										<Skeleton class="h-4 w-2/3" />
									</Card.Content>
								</Card.Root>
							</li>
						{/each}
					</ul>
				{/if}
			{/if}

			{#if hasMore}
				<div bind:this={sentinel} class="h-4 w-full" aria-hidden="true"></div>
			{/if}

			{#if loadMoreError}
				<div class="py-4 text-center">
					<button
						type="button"
						class="text-sm text-destructive underline-offset-2 hover:underline"
						onclick={() => void loadMore()}
					>
						{loadMoreError}
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
