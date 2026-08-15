<script lang="ts">
	import { navigating, page } from '$app/state';
	import BrowseByCategoryAsync from '$lib/components/jobs/browse-by-category-async.svelte';
	import EducationChipsAsync from '$lib/components/jobs/education-chips-async.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';

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

	<EducationChipsAsync browse={data.browse} />

	<div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
		<div class="min-w-0">
			<JobList
				jobs={data.jobs}
				total={data.total}
				totalPages={data.totalPages}
				filters={data.filters}
				filtered={data.filtered}
				error={data.error}
				loading={isNavigating}
			/>
		</div>

		<div class="lg:sticky lg:top-16 lg:h-[calc(100svh-5rem)] lg:overflow-hidden">
			<BrowseByCategoryAsync browse={data.browse} />
		</div>
	</div>
</div>
