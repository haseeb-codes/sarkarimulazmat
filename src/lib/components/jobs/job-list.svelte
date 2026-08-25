<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import JobCard from '$lib/components/job-card.svelte';
	import JobListSkeleton from '$lib/components/jobs/job-list-skeleton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		filtersToHref,
		filtersToSearchParams,
		type FilterParams,
		type JobSort
	} from '$lib/jobs-utils';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import ListIcon from '@lucide/svelte/icons/list';

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
		permanent_only?: boolean;
		women_only?: boolean;
		transgender_applicable?: boolean;
		disability_quota?: boolean;
		minority_quota?: boolean;
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

	type ViewMode = 'masonry' | 'list';
	type ResultsSortOption = 'closing_soon' | 'newest' | 'white' | 'blue';

	const VIEW_STORAGE_KEY = 'jobs-view-mode';

	const RESULTS_SORT_OPTIONS = [
		{ value: 'closing_soon', label: 'Closing soon' },
		{ value: 'newest', label: 'Newly Posted' },
		{ value: 'white', label: 'White Collar jobs' },
		{ value: 'blue', label: 'Blue collar jobs' }
	] as const satisfies ReadonlyArray<{ value: ResultsSortOption; label: string }>;

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
	let viewMode = $state<ViewMode>('masonry');

	const HIGHLIGHT_MS = 2800;

	const hasMore = $derived(loadedPage < totalPages && items.length < total);

	const resultsSort = $derived.by((): ResultsSortOption => {
		const collar = filters.collar?.trim().toLowerCase() ?? '';
		if (collar === 'white') return 'white';
		if (collar === 'blue') return 'blue';
		if (filters.sort === 'closing_soon') return 'closing_soon';
		return 'newest';
	});

	const resultsSortLabel = $derived(
		RESULTS_SORT_OPTIONS.find((o) => o.value === resultsSort)?.label ?? 'Newly Posted'
	);

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
			filters.permanent_only ? '1' : '0',
			filters.women_only ? '1' : '0',
			filters.transgender_applicable ? '1' : '0',
			filters.disability_quota ? '1' : '0',
			filters.minority_quota ? '1' : '0',
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

	function readStoredView(): ViewMode {
		try {
			const stored = localStorage.getItem(VIEW_STORAGE_KEY);
			if (stored === 'list' || stored === 'masonry') return stored;
		} catch {
			/* ignore */
		}
		return 'masonry';
	}

	function setViewMode(next: ViewMode) {
		viewMode = next;
		try {
			localStorage.setItem(VIEW_STORAGE_KEY, next);
		} catch {
			/* ignore */
		}
	}

	function setResultsSort(next: string) {
		const option = next as ResultsSortOption;
		const patch: Partial<FilterParams> =
			option === 'white'
				? { sort: 'newest', collar: 'white', page: 1 }
				: option === 'blue'
					? { sort: 'newest', collar: 'blue', page: 1 }
					: option === 'closing_soon'
						? { sort: 'closing_soon', collar: null, page: 1 }
						: { sort: 'newest', collar: null, page: 1 };

		goto(filtersToHref({ ...filters, ...patch }, page.url.pathname), {
			keepFocus: true,
			noScroll: true
		});
	}

	$effect(() => {
		viewMode = readStoredView();
	});

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

		if (el.getBoundingClientRect().top < window.innerHeight + 480) {
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
		<!-- Stick under the results-column search field -->
		<div
			class="sticky top-[var(--browse-results-header-offset,8rem)] z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background py-2.5"
		>
			<div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
				{#if filtered}
					<Button href={page.url.pathname} variant="outline" size="sm">Clear filter</Button>
				{/if}
				{#if items.length > 0 && items.length < total}
					<p class="ml-2 text-sm text-muted-foreground">
						Showing {items.length.toLocaleString()} of {total.toLocaleString()}
					</p>
				{:else if items.length > 0}
					<p class="ml-2 text-sm text-muted-foreground">
						{total.toLocaleString()} job{total === 1 ? '' : 's'}
					</p>
				{/if}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<div
					class="inline-flex rounded-md border border-border p-0.5"
					role="group"
					aria-label="Results layout"
				>
					<Button
						type="button"
						variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
						size="sm"
						class="h-8 gap-1.5 px-2.5"
						aria-pressed={viewMode === 'masonry'}
						onclick={() => setViewMode('masonry')}
					>
						<LayoutGridIcon class="size-4" aria-hidden="true" />
						<span class="hidden sm:inline">Grid</span>
					</Button>
					<Button
						type="button"
						variant={viewMode === 'list' ? 'secondary' : 'ghost'}
						size="sm"
						class="h-8 gap-1.5 px-2.5"
						aria-pressed={viewMode === 'list'}
						onclick={() => setViewMode('list')}
					>
						<ListIcon class="size-4" aria-hidden="true" />
						<span class="hidden sm:inline">List</span>
					</Button>
				</div>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-foreground hover:bg-muted"
					>
						<span class="text-muted-foreground">Sort by:</span>
						<span class="font-medium">{resultsSortLabel}</span>
						<ChevronDownIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="min-w-52">
						<DropdownMenu.RadioGroup value={resultsSort} onValueChange={setResultsSort}>
							{#each RESULTS_SORT_OPTIONS as option (option.value)}
								<DropdownMenu.RadioItem value={option.value}>
									{option.label}
								</DropdownMenu.RadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
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
					<Button href={page.url.pathname} variant="outline" class="mt-4">Clear filter</Button>
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
					{@const jobsShownSoFar =
						pages.slice(0, i).reduce((sum, g) => sum + g.jobs.length, 0) + group.jobs.length}
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
					<ul class="flex flex-col gap-3">
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
					<ul class="columns-1 gap-3 sm:columns-2 lg:columns-3">
						{#each group.jobs as job (job.slug)}
							<li class="mb-3 break-inside-avoid">
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
					<ul class="flex flex-col gap-3" aria-hidden="true">
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
					<ul class="columns-1 gap-3 sm:columns-2 lg:columns-3" aria-hidden="true">
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
				<p class="pt-2 pb-2 text-center text-sm text-muted-foreground">
					You've seen all {total.toLocaleString()} job{total === 1 ? '' : 's'}
				</p>
			{/if}
		{/if}
	</div>
{/if}
