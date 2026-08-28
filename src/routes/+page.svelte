<script lang="ts">
	import { navigating, page } from '$app/state';
	import JobsBrowseShell from '$lib/components/jobs/jobs-browse-shell.svelte';

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

	const canonical = $derived(new URL('/', page.url.origin).href);
</script>

<svelte:head>
	<title>{title}</title>
	<meta
		name="description"
		content={data.filtered
			? `Browse government job postings matching your filters on Sarkari Mulazmat.`
			: `Find government jobs in Pakistan that match your degree, education level, grade, and age.`}
	/>
	<link rel="canonical" href={canonical} />
	{#if data.filtered}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<meta property="og:title" content={title} />
	<meta
		property="og:description"
		content={data.filtered
			? `Browse government job postings matching your filters on Sarkari Mulazmat.`
			: `Find government jobs in Pakistan that match your degree, education level, grade, and age.`}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
		<h1 class="shrink-0">Government jobs in Pakistan</h1>
		<p class="min-w-0 text-sm text-muted-foreground lg:text-base">
			Browse postings by category, education, and more to see what you're eligible for.
		</p>
	</div>

	<JobsBrowseShell filters={data.filters} listing={data.listing} loading={isNavigating} />
</div>