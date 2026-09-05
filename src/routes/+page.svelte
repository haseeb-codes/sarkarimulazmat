<script lang="ts">
	import { navigating, page } from '$app/state';
	import HomePageHero from '$lib/components/jobs/home-page-hero.svelte';
	import JobsBrowseShell from '$lib/components/jobs/jobs-browse-shell.svelte';
	import TagChipsAsync from '$lib/components/jobs/tag-chips-async.svelte';

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
			: `The first unified portal for government jobs in Pakistan — aggregated from CTSP, FPSC, PPSC, NTS, ETEA, NJP, and every major official source.`}
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
			: `The first unified portal for government jobs in Pakistan — aggregated from CTSP, FPSC, PPSC, NTS, ETEA, NJP, and every major official source.`}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="space-y-2 sm:space-y-4">
	{#if data.filtered}
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:hidden">
			<h1 class="shrink-0">Government jobs in Pakistan</h1>
			<p class="min-w-0 text-sm text-muted-foreground lg:text-base">
				Browse postings matching your current filters.
			</p>
		</div>
	{/if}

	<div class="space-y-1 sm:space-y-2 {data.filtered ? 'hidden md:block' : ''}">
		{#if data.filtered}
			<h1 class="sr-only">Government jobs in Pakistan</h1>
		{/if}
		<HomePageHero showIntro={!data.filtered} />
		<TagChipsAsync />
	</div>

	<JobsBrowseShell
		filters={data.filters}
		listing={data.listing}
		resultCount={data.resultCount}
		closingOnDates={data.closingOnDates}
		loading={isNavigating}
	/>
</div>
