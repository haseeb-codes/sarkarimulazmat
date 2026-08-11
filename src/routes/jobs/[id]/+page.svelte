<script lang="ts">
	import { navigating, page } from '$app/state';
	import MultiValueBadges from '$lib/components/multi-value-badges.svelte';
	import GenderIcons from '$lib/components/gender-icons.svelte';
	import JobDetailSkeleton from '$lib/components/jobs/job-detail-skeleton.svelte';
	import JobAdModal from '$lib/components/jobs/job-ad-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		formatAgeRange,
		formatDateLabel,
		getJobAdUrl,
		isClosingSoon,
		isJobExpired
	} from '$lib/jobs-utils';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	let { data } = $props();
	const isNavigating = $derived(
		navigating.to !== null && navigating.to.route.id === '/jobs/[id]'
	);
	const job = $derived(data.job);
	const expired = $derived(isJobExpired(job.last_date_to_apply));
	const closingSoon = $derived(isClosingSoon(job.last_date_to_apply));
	const ageLabel = $derived(formatAgeRange(job.min_age, job.max_age));
	const applyByLabel = $derived(formatDateLabel(job.last_date_to_apply));
	const applyByClass = $derived(
		expired
			? 'bg-status-closed-bg text-status-closed'
			: closingSoon
				? 'bg-status-closing-bg text-status-closing'
				: 'bg-status-open-bg text-status-open'
	);
	const adUrl = $derived(getJobAdUrl(job.supabase_file_path));

	let adOpen = $state(false);

	const title = $derived(
		`${job.title ?? 'Job'} — ${job.department ?? 'Government'} — Sarkari Mulazmat`
	);
	const description = $derived(
		[
			job.title,
			job.department,
			applyByLabel ? `Apply by ${applyByLabel}` : null,
			job.place_of_posting
		]
			.filter(Boolean)
			.join(' · ')
			.slice(0, 160)
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'JobPosting',
		title: job.title,
		description: job.description ?? job.notes ?? job.title,
		datePosted: job.ad_date
			? new Date(job.ad_date).toISOString().slice(0, 10)
			: undefined,
		validThrough: job.last_date_to_apply
			? new Date(job.last_date_to_apply).toISOString().slice(0, 10)
			: undefined,
		hiringOrganization: {
			'@type': 'Organization',
			name: job.department ?? 'Government of Pakistan'
		},
		jobLocation: job.place_of_posting
			? {
					'@type': 'Place',
					address: {
						'@type': 'PostalAddress',
						addressLocality: job.place_of_posting,
						addressCountry: 'PK',
						addressRegion: job.province ?? undefined
					}
				}
			: undefined,
		employmentType: job.employment_type ?? undefined,
		url: page.url.href
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
				name: job.title ?? 'Job',
				item: page.url.href
			}
		]
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={page.url.href} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={page.url.href} />
	<meta name="twitter:card" content="summary" />
	{#if expired}
		<meta name="robots" content="noindex, follow" />
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>`}
</svelte:head>

{#if isNavigating}
	<JobDetailSkeleton />
{:else}
<article class="mx-auto max-w-3xl space-y-8">
	<div>
		<a
			href="/"
			class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeftIcon class="size-4" />
			All jobs
		</a>
		<div class="flex flex-wrap items-start justify-between gap-3">
			<h1 class="flex items-start gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
				{#if adUrl}
					<button
						type="button"
						class="text-left underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onclick={() => (adOpen = true)}
					>
						{job.title ?? 'Untitled posting'}
					</button>
				{:else}
					<span>{job.title ?? 'Untitled posting'}</span>
				{/if}
				<GenderIcons gender={job.gender} class="mt-1.5 md:mt-2 md:[&_svg]:size-5" />
			</h1>
			{#if expired}
				<span
					class="inline-flex h-6 items-center rounded-full bg-status-closed-bg px-2.5 text-xs font-medium text-status-closed"
				>
					Applications closed
				</span>
			{:else}
				<span
					class="inline-flex h-6 items-center rounded-full bg-status-open-bg px-2.5 text-xs font-medium text-status-open"
				>
					Open
				</span>
			{/if}
		</div>
		{#if job.department}
			<p class="mt-2 text-muted-foreground">{job.department}</p>
		{/if}
	</div>

	{#if adUrl}
		<JobAdModal bind:open={adOpen} title={job.title} supabaseFilePath={job.supabase_file_path} />
	{/if}

	{#if expired}
		<div
			class="rounded-lg border border-status-closed/30 bg-status-closed-bg px-4 py-3 text-sm text-status-closed"
			role="status"
		>
			The application deadline
			{#if applyByLabel}
				({applyByLabel})
			{/if}
			has passed. This posting is shown for reference only.
		</div>
	{/if}

	<section class="space-y-4 rounded-lg border border-border bg-card p-5" aria-labelledby="eligibility-heading">
		<h2 id="eligibility-heading" class="text-lg font-semibold">Eligibility</h2>
		<dl class="grid gap-4 sm:grid-cols-2">
			{#if job.education_level}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Education
					</dt>
					<dd class="mt-1 text-sm">{job.education_level}</dd>
				</div>
			{/if}
			{#if job.grade}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Grade
					</dt>
					<dd class="mt-1"><Badge variant="secondary">{job.grade}</Badge></dd>
				</div>
			{/if}
			{#if ageLabel}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Age
					</dt>
					<dd class="mt-1 text-sm">{ageLabel}</dd>
				</div>
			{/if}
			{#if job.domicile}
				<div class="sm:col-span-2">
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Domicile
					</dt>
					<dd class="mt-1">
						<MultiValueBadges value={job.domicile} param="domicile" />
					</dd>
				</div>
			{/if}
			{#if job.place_of_posting}
				<div class="sm:col-span-2">
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Location
					</dt>
					<dd class="mt-1">
						<MultiValueBadges
							value={job.place_of_posting}
							param="place_of_posting"
							class="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-900/60"
						/>
					</dd>
				</div>
			{/if}
			{#if job.vacancies != null}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Vacancies
					</dt>
					<dd class="mt-1 text-sm">{job.vacancies}</dd>
				</div>
			{/if}
			{#if job.employment_type}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Employment type
					</dt>
					<dd class="mt-1 text-sm">{job.employment_type}</dd>
				</div>
			{/if}
			{#if applyByLabel}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Last date to apply
					</dt>
					<dd class="mt-1">
						<span
							class="inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold tracking-wide {applyByClass}"
						>
							{applyByLabel}
						</span>
					</dd>
				</div>
			{/if}
		</dl>

		{#if job.degree_area || job.degrees}
			<div class="space-y-2">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Degree / area
				</p>
				<MultiValueBadges value={job.degree_area} />
				{#if job.degrees}
					<MultiValueBadges value={job.degrees} />
				{/if}
			</div>
		{/if}
	</section>

	<section class="space-y-3" aria-labelledby="apply-heading">
		<h2 id="apply-heading" class="text-lg font-semibold">How to apply</h2>
		{#if expired}
			<p class="text-sm text-muted-foreground">Applications are no longer being accepted.</p>
		{:else}
			<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				{#if job.url}
					<Button href={job.url} target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto">
						<ExternalLinkIcon data-icon="inline-start" />
						Official posting
					</Button>
				{/if}
				{#if job.application_online_address}
					<Button
						href={job.application_online_address}
						target="_blank"
						rel="noopener noreferrer"
						variant="outline"
						class="w-full sm:w-auto"
					>
						<ExternalLinkIcon data-icon="inline-start" />
						Apply online
					</Button>
				{/if}
				{#if job.email}
					<Button href={`mailto:${job.email}`} variant="outline" class="w-full sm:w-auto">
						<MailIcon data-icon="inline-start" />
						{job.email}
					</Button>
				{/if}
			</div>
			{#if !job.url && !job.application_online_address && !job.email}
				<p class="text-sm text-muted-foreground">
					No direct apply link is available for this posting. Check the original advertisement
					for instructions.
				</p>
			{/if}
			{#if job.application_postal_address}
				<p class="text-sm">
					<span class="font-medium">Postal address:</span>
					{job.application_postal_address}
				</p>
			{/if}
		{/if}
	</section>

	{#if job.description || job.notes}
		<Separator />
		<section class="space-y-3" aria-labelledby="details-heading">
			<h2 id="details-heading" class="text-lg font-semibold">Details</h2>
			{#if job.description}
				<p class="whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p>
			{/if}
			{#if job.notes}
				<p class="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
					{job.notes}
				</p>
			{/if}
		</section>
	{/if}
</article>
{/if}
