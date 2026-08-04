<script lang="ts">
	import JobCard from '$lib/components/job-card.svelte';
	import JobListSkeleton from '$lib/components/jobs/job-list-skeleton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { filtersToHref, type FilterParams, type JobSort } from '$lib/jobs-utils';

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
		min_age: number | null;
		max_age: number | null;
		last_date_to_apply: string | null;
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
		loading = false,
		pageHref = defaultPageHref
	}: {
		jobs: Job[];
		total: number;
		totalPages: number;
		filters: Filters;
		filtered: boolean;
		error: string | null;
		loading?: boolean;
		pageHref?: (pageNum: number) => string;
	} = $props();

	function defaultPageHref(pageNum: number) {
		return filtersToHref({ ...filters, page: pageNum } as FilterParams);
	}
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
			{#if totalPages > 1}
				<p class="text-sm text-muted-foreground">
					Page {filters.page} of {totalPages}
				</p>
			{/if}
		</div>

		{#if jobs.length === 0}
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
			<ul class="space-y-3">
				{#each jobs as job (job.row_id)}
					<li>
						<JobCard {job} sort={filters.sort} />
					</li>
				{/each}
			</ul>
		{/if}

		{#if totalPages > 1}
			<nav class="flex items-center justify-between gap-4 pt-2" aria-label="Pagination">
				<Button
					variant="outline"
					size="sm"
					href={pageHref(filters.page - 1)}
					disabled={filters.page <= 1}
				>
					Previous
				</Button>
				<span class="text-sm text-muted-foreground">
					Page {filters.page} of {totalPages}
				</span>
				<Button
					variant="outline"
					size="sm"
					href={pageHref(filters.page + 1)}
					disabled={filters.page >= totalPages}
				>
					Next
				</Button>
			</nav>
		{/if}
	</div>
{/if}
