<script lang="ts">
	import { page } from '$app/state';
	import JobCard from '$lib/components/job-card.svelte';
	import JobAdModal from '$lib/components/jobs/job-ad-modal.svelte';
	import ShareJobButton from '$lib/components/jobs/share-job-button.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { adDetailHref } from '$lib/ads-utils';
	import { formatDateLabel, getJobAdUrl, jobDetailHref } from '$lib/jobs-utils';
	import ImageIcon from '@lucide/svelte/icons/image';

	let { data } = $props();

	let adModalOpen = $state(false);

	const ad = $derived(data.ad);
	const title = $derived(`${ad.ad_headline ?? 'Job advertisement'} — Sarkari Mulazmat`);
	const description = $derived(
		(ad.ad_content ?? `Government job postings from ${ad.posted_by ?? 'this advertisement'}.`).slice(
			0,
			160
		)
	);
	const canonical = $derived(new URL(adDetailHref(ad.ad_slug), page.url.origin).href);
	const adImageUrl = $derived(getJobAdUrl(ad.supabase_file_path));

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: ad.ad_headline ?? 'Job advertisement',
		description: ad.ad_content ?? description,
		datePublished: ad.file_creation_date ?? undefined,
		author: {
			'@type': 'Organization',
			name: ad.posted_by ?? 'Sarkari Mulazmat'
		},
		image: adImageUrl ?? undefined,
		url: canonical
	});

	const jobsLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: `Job postings from ${ad.ad_headline ?? 'advertisement'}`,
		numberOfItems: data.listing.total,
		itemListElement: data.listing.jobs.map((job, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			url: new URL(jobDetailHref(job.slug), page.url.origin).href,
			name: job.title ?? job.slug
		}))
	});

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
				name: 'Job advertisements',
				item: new URL('/ads', page.url.origin).href
			},
			{
				'@type': 'ListItem',
				position: 3,
				name: ad.ad_headline ?? 'Advertisement',
				item: canonical
			}
		]
	});

	const metaItemClass =
		'rounded-lg border border-border bg-muted/20 px-3 py-2.5 sm:px-4 sm:py-3';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={canonical} />
	{#if adImageUrl}
		<meta property="og:image" content={adImageUrl} />
	{/if}
	<meta name="twitter:card" content={adImageUrl ? 'summary_large_image' : 'summary'} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
	{#if data.listing.jobs.length > 0}
		{@html `<script type="application/ld+json">${JSON.stringify(jobsLd)}</script>`}
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>`}
</svelte:head>

<article class="space-y-4 sm:space-y-6">
	<header class="space-y-3 sm:space-y-4">
		<a href="/ads" class="text-sm text-muted-foreground hover:text-foreground">← All advertisements</a>
		<h1 class="text-balance break-words">{ad.ad_headline ?? 'Job advertisement'}</h1>

		<dl class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
			{#if ad.ad_code}
				<div class={metaItemClass}>
					<dt class="text-xs font-medium text-muted-foreground">Ad code</dt>
					<dd class="mt-0.5 text-sm font-medium break-words text-foreground">{ad.ad_code}</dd>
				</div>
			{/if}
			{#if ad.posted_by}
				<div class={metaItemClass}>
					<dt class="text-xs font-medium text-muted-foreground">Posted by</dt>
					<dd class="mt-0.5 text-sm font-medium break-words text-foreground">{ad.posted_by}</dd>
				</div>
			{/if}
			{#if ad.vacancies != null}
				<div class={metaItemClass}>
					<dt class="text-xs font-medium text-muted-foreground">Vacancies</dt>
					<dd class="mt-0.5 text-sm font-medium tabular-nums text-foreground">
						{ad.vacancies.toLocaleString('en-PK')}
					</dd>
				</div>
			{/if}
			{#if ad.last_date_to_apply}
				<div class={metaItemClass}>
					<dt class="text-xs font-medium text-muted-foreground">Last date</dt>
					<dd class="mt-0.5 text-sm font-medium text-foreground">
						{formatDateLabel(ad.last_date_to_apply)}
					</dd>
				</div>
			{/if}
		</dl>

		{#if ad.ad_content}
			<p class="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
				{ad.ad_content}
			</p>
		{/if}

		<div class="flex flex-wrap gap-2">
			{#if ad.supabase_file_path}
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="w-full sm:w-auto"
					onclick={() => (adModalOpen = true)}
				>
					<ImageIcon class="size-4" aria-hidden="true" />
					View newspaper ad
				</Button>
			{/if}
			<ShareJobButton
				url={canonical}
				title={ad.ad_headline}
				text={description}
				class="w-full sm:w-auto"
			/>
		</div>
	</header>

	<section class="space-y-3" aria-labelledby="ad-jobs-heading">
		<h2 id="ad-jobs-heading" class="text-base font-semibold sm:text-lg">
			{data.listing.total.toLocaleString('en-PK')} job posting{data.listing.total === 1 ? '' : 's'} from
			this ad
		</h2>

		{#if data.listing.error}
			<div
				class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				role="alert"
			>
				{data.listing.error}
			</div>
		{:else if data.listing.jobs.length === 0}
			<p class="text-sm text-muted-foreground">No active job postings are linked to this advertisement yet.</p>
		{:else}
			<ul class="relative z-0 columns-1 gap-3 sm:columns-2 lg:columns-3">
				{#each data.listing.jobs as job (job.slug)}
					<li class="mb-3 break-inside-avoid">
						<JobCard {job} sort="newest" layout="masonry" />
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</article>

{#if ad.supabase_file_path}
	<JobAdModal
		bind:open={adModalOpen}
		title={ad.ad_headline}
		supabaseFilePath={ad.supabase_file_path}
	/>
{/if}
