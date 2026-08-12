<script lang="ts">
	import { navigating, page } from '$app/state';
	import BrowseByCategoryAsync from '$lib/components/jobs/browse-by-category-async.svelte';
	import FiltersDrawer from '$lib/components/jobs/filters-drawer.svelte';
	import JobList from '$lib/components/jobs/job-list.svelte';

	let { data } = $props();

	let filtersOpen = $state(false);

	const isNavigating = $derived(
		navigating.to !== null && navigating.to.route.id === '/[slug]'
	);

	const activeFilterCount = $derived(
		(data.filters.ad_date ? 1 : 0) +
			(data.filters.posted_by ? 1 : 0) +
			(data.filters.donor_name ? 1 : 0) +
			(data.filters.gender ? 1 : 0) +
			(data.filters.place_of_posting ? 1 : 0) +
			(data.filters.domicile ? 1 : 0) +
			(data.filters.department ? 1 : 0) +
			(data.filters.collar ? 1 : 0) +
			(data.filters.has_salary ? 1 : 0) +
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

<div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
	<div class="min-w-0 space-y-6">
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
				clearHref="/{data.category.slug}"
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

	<div class="lg:sticky lg:top-16 lg:h-[calc(100svh-5rem)] lg:overflow-hidden">
		<BrowseByCategoryAsync browse={data.browse} />
	</div>
</div>
