<script lang="ts">
	import { navigating, page } from '$app/state';
	import JobCategorySharePage from '$lib/components/jobs/job-category-share-page.svelte';
	import JobsBrowseShell from '$lib/components/jobs/jobs-browse-shell.svelte';

	let { data } = $props();

	const isNavigating = $derived(
		navigating.to !== null && navigating.to.route.id === '/[slug]'
	);

	const breadcrumbLd = $derived(
		data.kind === 'category'
			? {
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
				}
			: null
	);
</script>

<svelte:head>
	{#if data.kind === 'category'}
		<title>{data.category.title}</title>
		<meta name="description" content={data.category.meta_description} />
		<link rel="canonical" href={new URL(`/${data.category.slug}`, page.url.origin).href} />
		{#if data.filtered}
			<meta name="robots" content="noindex, follow" />
		{/if}
		<meta property="og:title" content={data.category.title} />
		<meta property="og:description" content={data.category.meta_description} />
		<meta property="og:type" content="website" />
		{#if breadcrumbLd}
			{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>`}
		{/if}
	{/if}
</svelte:head>

{#if data.kind === 'share'}
	<JobCategorySharePage category={data.category} jobs={data.jobs} updatedAt={data.updatedAt} />
{:else}
	<div class="space-y-6">
		<div class="space-y-3">
			<p class="text-sm text-muted-foreground">
				<a href="/" class="hover:text-foreground hover:underline">www.sarkarimulazmat.com</a
				><span>/{data.category.slug}</span>
			</p>
			<a href="/" class="text-sm text-muted-foreground hover:text-foreground">← All jobs</a>
			<h1>{data.category.h1}</h1>
			<p class="max-w-2xl text-muted-foreground leading-relaxed">
				{data.category.intro_content}
			</p>
		</div>

		<JobsBrowseShell
			filters={data.filters}
			filtered={data.filtered}
			listing={data.listing}
			loading={isNavigating}
		/>
	</div>
{/if}
