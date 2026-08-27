<script lang="ts">
	import { navigating, page } from '$app/state';
	import MultiValueBadges from '$lib/components/multi-value-badges.svelte';
	import GenderIcons from '$lib/components/gender-icons.svelte';
	import DisabilityIcon from '$lib/components/disability-icon.svelte';
	import JobDetailSkeleton from '$lib/components/jobs/job-detail-skeleton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { onFilterLinkClick } from '$lib/filter-nav';
	import {
		badgeFilterHref,
		mergeFilterFlagHref,
		formatAgeRange,
		formatDateLabel,
		formatSalary,
		getJobAdKind,
		getJobAdUrl,
		isClosingSoon,
		isJobExpired,
		jobDetailHref
	} from '$lib/jobs-utils';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ShareJobButton from '$lib/components/jobs/share-job-button.svelte';

	let { data } = $props();
	const isNavigating = $derived(
		navigating.to !== null && navigating.to.route.id === '/jobs/[slug]'
	);
	const job = $derived(data.job);
	const expired = $derived(isJobExpired(job.last_date_to_apply));
	const closingSoon = $derived(isClosingSoon(job.last_date_to_apply));
	const ageLabel = $derived(formatAgeRange(job.min_age, job.max_age));
	const applyByLabel = $derived(formatDateLabel(job.last_date_to_apply));
	const salaryLabel = $derived(formatSalary(job.salary));
	const hasSalaryHref = $derived(mergeFilterFlagHref(page.url, 'has_salary'));
	const applyByClass = $derived(
		expired
			? 'bg-status-closed-bg text-status-closed'
			: closingSoon
				? 'bg-status-closing-bg text-status-closing'
				: 'bg-status-open-bg text-status-open'
	);
	const adUrl = $derived(getJobAdUrl(job.supabase_file_path));
	const adKind = $derived(getJobAdKind(job.supabase_file_path));
	const departmentHref = $derived(
		job.department
			? badgeFilterHref(job.department, undefined, 'department', page.url)
			: null
	);

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

	const canonical = $derived(new URL(jobDetailHref(job.slug), page.url.origin).href);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'JobPosting',
		title: job.title,
		description: job.notes ?? job.title,
		datePosted: job.file_creation_date
			? new Date(job.file_creation_date).toISOString().slice(0, 10)
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
						addressCountry: 'PK'
					}
				}
			: undefined,
		employmentType: job.employment_type ?? undefined,
		url: canonical
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
				item: canonical
			}
		]
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={canonical} />
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
				<span>{job.title ?? 'Untitled posting'}</span>
				<span class="mt-1.5 inline-flex items-center gap-0.5 md:mt-2 md:[&_svg]:size-5">
					<GenderIcons gender={job.gender} />
					<DisabilityIcon show={Boolean(job.disability_quota)} />
				</span>
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
		{#if job.donor_name}
			<span
				class="mt-2 inline-flex h-6 max-w-full items-center truncate rounded-full bg-blue-100 px-2.5 text-xs font-semibold text-blue-800 animate-pulse dark:bg-blue-950/70 dark:text-blue-300"
			>
				{job.donor_name}
			</span>
		{/if}
		{#if job.department && departmentHref}
			<p class="mt-2">
				<a
					href={departmentHref}
					data-sveltekit-noscroll
					onclick={onFilterLinkClick}
					class="text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
					aria-label="Filter by department {job.department}"
				>
					{job.department}
				</a>
			</p>
		{:else if job.department}
			<p class="mt-2 text-muted-foreground">{job.department}</p>
		{/if}
		<div class="mt-4">
			<ShareJobButton
				url={canonical}
				title={job.title}
				text={job.department}
				size="default"
			/>
		</div>
	</div>

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
				<div class="sm:col-span-2">
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Education
					</dt>
					<dd class="mt-1">
						<MultiValueBadges value={job.education_level} param="education_level" />
					</dd>
				</div>
			{/if}
			{#if job.grade}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Grade
					</dt>
					<dd class="mt-1">
						<Badge
							variant="secondary"
							href={badgeFilterHref(job.grade, undefined, 'grade', page.url)}
							aria-label="Filter by grade {job.grade}"
							class="underline-offset-2 hover:underline"
						>
							{job.grade}
						</Badge>
					</dd>
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
			{#if salaryLabel}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Salary
					</dt>
					<dd class="mt-1">
						<Badge
							variant="outline"
							href={hasSalaryHref}
							aria-label="Show jobs with salary listed"
							class="border-emerald-200 bg-emerald-50 text-emerald-900 underline-offset-2 hover:bg-emerald-100 hover:underline dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
						>
							Rs. {salaryLabel}
						</Badge>
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
			{#if job.disability_quota}
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Disability quota
					</dt>
					<dd class="mt-1 flex items-center gap-1.5 text-sm">
						<DisabilityIcon show={true} />
						<span>Persons with disabilities encouraged to apply</span>
					</dd>
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
					Specialization
				</p>
				<MultiValueBadges value={job.degree_area} />
				{#if job.degrees}
					<MultiValueBadges value={job.degrees} />
				{/if}
			</div>
		{/if}
	</section>

	{#if adUrl && adKind === 'image'}
		<section class="space-y-3" aria-labelledby="ad-heading">
			<h2 id="ad-heading" class="text-lg font-semibold">Advertisement</h2>
			<img
				src={adUrl}
				alt="{job.title ?? 'Job'} advertisement"
				class="w-full rounded-lg border border-border bg-muted/30 object-contain"
				loading="lazy"
			/>
		</section>
	{:else if adUrl && adKind === 'pdf'}
		<section class="space-y-3" aria-labelledby="ad-heading">
			<h2 id="ad-heading" class="text-lg font-semibold">Advertisement</h2>
			<Button href={adUrl} class="w-full sm:w-auto">
				<FileTextIcon data-icon="inline-start" />
				View PDF
			</Button>
		</section>
	{:else if adUrl}
		<section class="space-y-3" aria-labelledby="ad-heading">
			<h2 id="ad-heading" class="text-lg font-semibold">Advertisement</h2>
			<Button href={adUrl} class="w-full sm:w-auto">
				<FileTextIcon data-icon="inline-start" />
				View advertisement
			</Button>
		</section>
	{/if}

	{#if job.notes}
		<Separator />
		<section class="space-y-3" aria-labelledby="details-heading">
			<h2 id="details-heading" class="text-lg font-semibold">Details</h2>
			<p class="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
				{job.notes}
			</p>
		</section>
	{/if}
</article>
{/if}
