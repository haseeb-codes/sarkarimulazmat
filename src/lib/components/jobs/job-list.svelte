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

	type Filters = {
		degree_areas: string[];
		education_level: string | null;
		ad_date?: string | null;
		posted_by?: string | null;
		donor_name?: string | null;
		gender?: string | null;
		qualification?: number[];
		qualification_from?: number | null;
		qualification_to?: number | null;
		grade: string | null;
		age: number | null;
		age_from: number | null;
		age_to: number | null;
		include_no_max_age: boolean;
		age_max?: string | number | null;
		place_of_posting: string | null;
		domicile: string[];
		domicile_region?: string[];
		tag?: string[];
		department?: string | null;
		collar?: string | null;
		has_salary?: boolean;
		min_salary?: number | null;
		salary_from?: number | null;
		salary_to?: number | null;
		keyword?: string | null;
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
	/** Maps each job slug to the page it was loaded on */
	let jobPageMap = $state<Map<string, number>>(new Map());
	let loadingMore = $state(false);
	let loadMoreError = $state<string | null>(null);
	let sentinel = $state<HTMLElement | null>(null);
	/** slugs just appended via infinite scroll — highlighted briefly */
	let freshIds = $state<Set<string>>(new Set());
	let freshClearTimer: ReturnType<typeof setTimeout> | null = null;

	const HIGHLIGHT_MS = 2800;

	const hasMore = $derived(loadedPage < totalPages && items.length < total);

	/** Stable key for the active result set — ignore page so scroll-loaded pages aren't wiped. */
	const resultKey = $derived(
		[
			filters.degree_areas.join('\0'),
			filters.education_level ?? '',
			filters.ad_date ?? '',
			filters.posted_by ?? '',
			filters.donor_name ?? '',
			filters.gender ?? '',
			(filters.qualification ?? []).join('\0'),
			filters.qualification_from ?? '',
			filters.qualification_to ?? '',
			filters.grade ?? '',
			filters.age_from ?? filters.age ?? '',
			filters.age_to ?? filters.age ?? '',
			filters.include_no_max_age ? '1' : '0',
			filters.age_max ?? '',
			filters.place_of_posting ?? '',
			filters.domicile.join('\0'),
			(filters.domicile_region ?? []).join('\0'),
			(filters.tag ?? []).join('\0'),
			filters.department ?? '',
			filters.collar ?? '',
			filters.has_salary ? '1' : '0',
			filters.min_salary ?? '',
			filters.salary_from ?? '',
			filters.salary_to ?? '',
			filters.keyword ?? '',
			filters.q ?? '',
			filters.show_expired ? '1' : '0',
			filters.sort,
			filters.pageSize,
			total
		].join('|')
	);

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
		return () => {
			if (freshClearTimer) clearTimeout(freshClearTimer);
		};
	});

	/** Reset accumulated list when filters / totals change (not when appending pages). */
	$effect(() => {
		void resultKey;
		const initialJobs = untrack(() => jobs);
		const initialPage = untrack(() => filters.page);
		items = initialJobs;
		loadedPage = initialPage;
		jobPageMap = new Map(initialJobs.map((j) => [j.slug, initialPage]));
		loadMoreError = null;
		clearFreshHighlight();
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

			const seen = new Set(items.map((j) => j.slug));
			const appended = data.jobs.filter((j) => !seen.has(j.slug));
			const newMap = new Map(jobPageMap);
			for (const j of appended) newMap.set(j.slug, data.page);
			jobPageMap = newMap;
			items = [...items, ...appended];
			loadedPage = data.page;
			markFresh(appended.map((j) => j.slug));
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
			<div class="flex items-center gap-3">
				{#if filtered}
					<Button href="/" variant="outline" size="sm">← All jobs</Button>
				{/if}
				{#if items.length > 0 && items.length < total}
					<p class="text-sm text-muted-foreground">
						Showing {items.length.toLocaleString()} of {total.toLocaleString()}
					</p>
				{/if}
			</div>
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
			{@const pages = (() => {
				const grouped: { page: number; jobs: Job[] }[] = [];
				let currentPage = -1;
				for (const job of items) {
					const p = jobPageMap.get(job.slug) ?? 1;
					if (p !== currentPage) {
						grouped.push({ page: p, jobs: [job] });
						currentPage = p;
					} else {
						grouped[grouped.length - 1].jobs.push(job);
					}
				}
				return grouped;
			})()}

			{#each pages as group, i (group.page)}
				{#if i > 0}
					{@const jobsShownSoFar = pages.slice(0, i).reduce((sum, g) => sum + g.jobs.length, 0) + group.jobs.length}
					{@const jobsLeft = total - jobsShownSoFar}
					<div class="flex items-center gap-3 py-2">
						<div class="h-px flex-1 bg-border"></div>
						<span class="shrink-0 text-xs font-medium text-muted-foreground">
							Page {group.page} of {totalPages} ({jobsLeft.toLocaleString()} job{jobsLeft === 1 ? '' : 's'} left)
						</span>
						<div class="h-px flex-1 bg-border"></div>
					</div>
				{/if}
				<ul class="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
					{#each group.jobs as job (job.slug)}
						<li class="mb-3 break-inside-avoid">
							<JobCard {job} sort={filters.sort} fresh={freshIds.has(job.slug)} />
						</li>
					{/each}
				</ul>
			{/each}

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
