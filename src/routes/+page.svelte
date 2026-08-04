<script lang="ts">
	import { navigating, page } from '$app/state';
	import FilterPanelAsync from '$lib/components/jobs/filter-panel-async.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';
	import SavedSearchesAsync from '$lib/components/jobs/saved-searches-async.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import FilterIcon from '@lucide/svelte/icons/sliders-horizontal';

	let { data, form } = $props();

	let filtersOpen = $state(false);

	const isNavigating = $derived(
		navigating.to !== null &&
			(navigating.to.route.id === '/' || navigating.to.route.id === '/[slug]')
	);

	const activeFilterCount = $derived(
		data.filters.degree_areas.length +
			(data.filters.education_level ? 1 : 0) +
			(data.filters.grade ? 1 : 0) +
			(data.filters.age ? 1 : 0) +
			(data.filters.place_of_posting ? 1 : 0) +
			(data.filters.domicile ? 1 : 0) +
			(data.filters.q ? 1 : 0) +
			(data.filters.show_expired ? 1 : 0)
	);

	const title = $derived(
		data.filtered
			? `Filtered Government Jobs — Sarkari Mulazmat`
			: `Government Jobs in Pakistan — Sarkari Mulazmat`
	);

	const description = $derived(
		data.filtered
			? `Browse ${data.total} government job postings matching your filters on Sarkari Mulazmat.`
			: `Find government jobs in Pakistan that match your degree, education level, grade, and age.`
	);

	const canonical = $derived(new URL('/', page.url.origin).href);

	function pageHref(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		if (pageNum > 1) params.set('page', String(pageNum));
		else params.delete('page');
		const qs = params.toString();
		return qs ? `/?${qs}` : '/';
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if data.filtered}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="space-y-6">
	<div class="space-y-2">
		<h1>Government jobs in Pakistan</h1>
		<p class="max-w-2xl text-muted-foreground">
			Filter postings by your degree area, education, grade, and age to see what you're
			eligible for.
		</p>
	</div>

	<!-- Mobile filter trigger -->
	<div class="lg:hidden">
		<Dialog.Root bind:open={filtersOpen}>
			<Dialog.Trigger
				class="inline-flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-sm shadow-xs hover:bg-muted"
			>
				<span class="inline-flex items-center gap-2">
					<FilterIcon class="size-4" />
					Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
				</span>
			</Dialog.Trigger>
			<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title>Filters</Dialog.Title>
					<Dialog.Description>Narrow jobs by eligibility and location.</Dialog.Description>
				</Dialog.Header>
				<FilterPanelAsync
					filters={data.filters}
					options={data.options}
					resultCount={isNavigating ? 0 : data.total}
				/>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="grid gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
		<aside class="hidden lg:block">
			<div class="sticky top-20 space-y-6">
				<FilterPanelAsync
					filters={data.filters}
					options={data.options}
					resultCount={isNavigating ? 0 : data.total}
				/>
				<SavedSearchesAsync
					savedSearches={data.savedSearches}
					canSave={data.canSave}
					saveMessage={form?.saveMessage}
				/>
			</div>
		</aside>

		<JobList
			jobs={data.jobs}
			total={data.total}
			totalPages={data.totalPages}
			filters={data.filters}
			filtered={data.filtered}
			error={data.error}
			loading={isNavigating}
			{pageHref}
		/>
	</div>

	<section class="space-y-6 lg:hidden">
		<SavedSearchesAsync
			savedSearches={data.savedSearches}
			canSave={data.canSave}
			saveMessage={form?.saveMessage}
		/>
	</section>

	<section class="space-y-3">
		<h2 class="text-base font-semibold">Browse by category</h2>
		<ul class="flex flex-wrap gap-2">
			{#each [
				['medical-jobs', 'Medical'],
				['engineering-jobs', 'Engineering'],
				['mba', 'MBA / Business'],
				['law-jobs', 'Law'],
				['teaching-jobs', 'Teaching'],
				['bs-cs', 'CS / IT'],
				['graduate-jobs', 'Graduate'],
				['intermediate-jobs', 'Intermediate'],
				['matric-jobs', 'Matric'],
				['balochistan-jobs', 'Balochistan']
			] as [slug, label]}
				<li>
					<a
						href="/{slug}"
						class="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-sm hover:bg-muted"
					>
						{label}
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
