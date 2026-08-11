<script lang="ts">
	import { navigating, page } from '$app/state';
	import FiltersDrawer from '$lib/components/jobs/filters-drawer.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';

	let { data } = $props();

	let filtersOpen = $state(false);

	const isNavigating = $derived(
		navigating.to !== null && navigating.to.route.id === '/[slug]'
	);

	const activeFilterCount = $derived(
		(data.filters.place_of_posting ? 1 : 0) +
			(data.filters.domicile ? 1 : 0) +
			(data.filters.q ? 1 : 0) +
			(data.filters.age ? 1 : 0) +
			(data.filters.show_expired ? 1 : 0) +
			(data.filters.sort !== 'newest' ? 1 : 0)
	);

	const breadcrumbLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: new URL('/', page.url.origin).href
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: data.category.h1,
				item: page.url.href
			}
		]
	});
</script>

<svelte:head>
	<title>{data.category.title}</title>
	<meta name="description" content={data.category.meta_description} />
	<link rel="canonical" href={new URL(`/${data.category.slug}`, page.url.origin).href} />
	{#if data.filtered}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<meta property="og:title" content={data.category.title} />
	<meta property="og:description" content={data.category.meta_description} />
	<meta property="og:type" content="website" />
	{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>`}
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-3">
			<a href="/" class="text-sm text-muted-foreground hover:text-foreground">← All jobs</a>
			<h1>{data.category.h1}</h1>
			<p class="max-w-2xl text-muted-foreground leading-relaxed">{data.category.intro_content}</p>
		</div>
		<FiltersDrawer
			bind:open={filtersOpen}
			filters={data.filters}
			options={data.options}
			resultCount={isNavigating ? 0 : data.total}
			{activeFilterCount}
		/>
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
</div>
