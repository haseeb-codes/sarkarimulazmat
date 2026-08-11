<script lang="ts">
	import { navigating, page } from '$app/state';
	import FiltersDrawer from '$lib/components/jobs/filters-drawer.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';
	import SavedSearchesAsync from '$lib/components/jobs/saved-searches-async.svelte';

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

	// Keep the drawer open while tweaking filters (URL updates), but close after leaving listing routes.
	$effect(() => {
		const to = navigating.to;
		if (to && to.route.id !== '/' && to.route.id !== '/[slug]') {
			filtersOpen = false;
		}
	});
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
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-2">
			<h1>Government jobs in Pakistan</h1>
			<p class="max-w-2xl text-muted-foreground">
				Filter postings by your degree area, education, grade, and age to see what you're
				eligible for.
			</p>
		</div>
		<FiltersDrawer
			bind:open={filtersOpen}
			filters={data.filters}
			options={data.options}
			resultCount={isNavigating ? 0 : data.total}
			{activeFilterCount}
		>
			<SavedSearchesAsync
				savedSearches={data.savedSearches}
				canSave={data.canSave}
				saveMessage={form?.saveMessage}
			/>
		</FiltersDrawer>
	</div>

	<JobList
		jobs={data.jobs}
		total={data.total}
		totalPages={data.totalPages}
		filters={data.filters}
		filtered={data.filtered}
		error={data.error}
		loading={isNavigating}
	/>

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
