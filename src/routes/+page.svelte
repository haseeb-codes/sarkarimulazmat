<script lang="ts">
	import { navigating, page } from '$app/state';
	import TagChipsAsync from '$lib/components/jobs/tag-chips-async.svelte';
	import FiltersDrawer from '$lib/components/jobs/filters-drawer.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';
	import JobsSearch from '$lib/components/jobs/jobs-search.svelte';

	let { data } = $props();

	const isNavigating = $derived(
		navigating.to !== null &&
			(navigating.to.route.id === '/' || navigating.to.route.id === '/[slug]')
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
			Browse postings by category, education, and more to see what you're eligible for.
		</p>
	</div>

	<TagChipsAsync browse={data.browse} />

	<div class="min-w-0 space-y-4">
		<JobsSearch filters={data.filters} />
		<FiltersDrawer
			filters={data.filters}
			options={data.filterOptions}
			resultCount={data.total}
		>
			<JobList
				jobs={data.jobs}
				total={data.total}
				totalPages={data.totalPages}
				filters={data.filters}
				filtered={data.filtered}
				error={data.error}
				loading={isNavigating}
			/>
		</FiltersDrawer>
	</div>
</div>
