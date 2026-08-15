<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import MultiValueBadges from '$lib/components/multi-value-badges.svelte';
	import GenderIcons from '$lib/components/gender-icons.svelte';
	import JobAdModal from '$lib/components/jobs/job-ad-modal.svelte';
	import ShareJobButton from '$lib/components/jobs/share-job-button.svelte';
	import { page } from '$app/state';
	import {
		badgeFilterHref,
		filtersToHref,
		formatAgeRange,
		formatDateLabel,
		formatSalary,
		getJobAdUrl,
		isRecentAd,
		isClosingSoon,
		isJobExpired,
		isWomenOrTransOnly,
		jobDetailHref,
		type JobSort
	} from '$lib/jobs-utils';
	import ImageIcon from '@lucide/svelte/icons/image';

	type JobCardJob = {
		row_id: number;
		slug: string;
		title: string | null;
		department: string | null;
		education_level: string | null;
		ad_date?: string | Date | null;
		degree_area: string | null;
		degrees: string | null;
		grade: string | null;
		place_of_posting: string | null;
		domicile: string | null;
		gender: string | null;
		collar?: string | null;
		donor_name?: string | null;
		salary?: number | null;
		min_age: number | null;
		max_age: number | null;
		last_date_to_apply: string | Date | null;
		supabase_file_path?: string | null;
	};

	let {
		job,
		sort = 'newest',
		fresh = false
	}: {
		job: JobCardJob;
		sort?: JobSort;
		/** Briefly highlight cards appended by infinite scroll */
		fresh?: boolean;
	} = $props();

	const expired = $derived(isJobExpired(job.last_date_to_apply));
	const closingSoon = $derived(isClosingSoon(job.last_date_to_apply));
	const recentAd = $derived(isRecentAd(job.ad_date));
	const ageLabel = $derived(formatAgeRange(job.min_age, job.max_age));
	const applyByLabel = $derived(formatDateLabel(job.last_date_to_apply));
	const salaryLabel = $derived(formatSalary(job.salary));
	const applyByClass = $derived(
		expired
			? 'bg-status-closed-bg text-status-closed'
			: closingSoon
				? 'bg-status-closing-bg text-status-closing'
				: 'bg-status-open-bg text-status-open'
	);
	const href = $derived(jobDetailHref(job.slug));
	const shareUrl = $derived(new URL(href, page.url.origin).href);
	const departmentHref = $derived(
		job.department ? badgeFilterHref(job.department, sort, 'department') : null
	);
	const hasSalaryHref = $derived(filtersToHref({ has_salary: true, sort }));
	const womenOrTransOnly = $derived(isWomenOrTransOnly(job.gender));
	const whiteCollar = $derived(job.collar?.trim().toLowerCase() === 'white');
	const adUrl = $derived(getJobAdUrl(job.supabase_file_path));
	const cardAccentClass = $derived(
		fresh
			? 'job-card-fresh ring-2 ring-primary/70'
			: womenOrTransOnly
				? 'ring-2 ring-pink-400 hover:ring-pink-500 dark:ring-pink-500 dark:hover:ring-pink-400'
				: whiteCollar
					? 'ring-2 ring-primary/55 hover:ring-primary/75 dark:ring-primary/50 dark:hover:ring-primary/70'
					: 'hover:border-primary/40'
	);

	let adOpen = $state(false);
</script>

<Card.Root
	size="sm"
	class="h-full transition-colors {cardAccentClass} {expired ? 'opacity-70' : ''}"
	data-fresh={fresh ? 'true' : undefined}
>
	<Card.Header class="gap-1.5 pb-2">
		<a {href} class="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
			{#if recentAd || job.donor_name}
				<div class="mb-1.5 flex flex-wrap items-center gap-1.5">
					{#if recentAd}
						<span
							class="inline-flex h-5 items-center rounded-full bg-red-100 px-2 text-xs font-semibold text-red-700 animate-pulse dark:bg-red-950/70 dark:text-red-300"
						>
							New
						</span>
					{/if}
					{#if job.donor_name}
						<span
							class="inline-flex h-5 max-w-full items-center truncate rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800 animate-pulse dark:bg-blue-950/70 dark:text-blue-300"
						>
							{job.donor_name}
						</span>
					{/if}
				</div>
			{/if}
			<div class="flex flex-wrap items-start justify-between gap-2">
				<Card.Title
					class="flex items-start gap-1.5 text-base! font-semibold tracking-tight leading-snug text-foreground md:text-lg!"
				>
					<span>{job.title ?? 'Untitled posting'}</span>
					<GenderIcons gender={job.gender} class="mt-0.5" />
				</Card.Title>
				<div class="flex flex-wrap gap-1.5">
					{#if expired}
						<span
							class="inline-flex h-5 items-center rounded-full bg-status-closed-bg px-2 text-xs font-medium text-status-closed"
						>
							Closed
						</span>
					{:else if closingSoon}
						<span
							class="inline-flex h-5 items-center rounded-full bg-status-closing-bg px-2 text-xs font-medium text-status-closing"
						>
							Closing soon
						</span>
					{/if}
					{#if job.grade}
						<Badge variant="secondary">{job.grade}</Badge>
					{/if}
				</div>
			</div>
		</a>
		{#if job.department && departmentHref}
			<a
				href={departmentHref}
				class="line-clamp-2 text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline md:text-sm"
				aria-label="Filter by department {job.department}"
			>
				{job.department}
			</a>
		{/if}
	</Card.Header>

	{#if adUrl}
		<JobAdModal
			bind:open={adOpen}
			title={job.title}
			supabaseFilePath={job.supabase_file_path ?? null}
		/>
	{/if}

	<Card.Content class="space-y-2.5 pt-0">
		<div class="space-y-2">
			{#if job.education_level}
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground">Education</p>
					<MultiValueBadges value={job.education_level} {sort} param="education_level" />
				</div>
			{/if}
			{#if job.degree_area || job.degrees}
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground">Specialization</p>
					<MultiValueBadges value={job.degree_area} {sort} />
					{#if job.degrees}
						<MultiValueBadges value={job.degrees} {sort} />
					{/if}
				</div>
			{/if}
			{#if job.domicile?.trim()}
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground">Domicile</p>
					<MultiValueBadges value={job.domicile} {sort} param="domicile" />
				</div>
			{/if}
			{#if job.place_of_posting && !job.domicile?.trim()}
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground">Location</p>
					<MultiValueBadges
						value={job.place_of_posting}
						{sort}
						param="place_of_posting"
						class="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-900/60"
					/>
				</div>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
			{#if salaryLabel}
				<span class="inline-flex items-center gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Salary</span>
					<Badge
						variant="outline"
						href={hasSalaryHref}
						aria-label="Show jobs with salary listed"
						class="border-emerald-200 bg-emerald-50 text-emerald-900 underline-offset-2 hover:bg-emerald-100 hover:underline dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
					>
						Rs. {salaryLabel}
					</Badge>
				</span>
			{/if}
			{#if job.max_age != null}
				<span class="inline-flex items-center gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Max Age</span>
					<Badge
						variant="outline"
						class="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
					>
						{job.max_age}y
					</Badge>
				</span>
			{:else if ageLabel}
				<span class="inline-flex items-center gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Age</span>
					<span class="text-foreground">{ageLabel}</span>
				</span>
			{/if}
			{#if applyByLabel}
				<span class="inline-flex items-center gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Deadline</span>
					<span
						class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide {applyByClass}"
					>
						{applyByLabel}
					</span>
				</span>
			{/if}
		</div>
		<div class="flex gap-2">
			{#if adUrl}
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="min-w-0 flex-1"
					onclick={() => (adOpen = true)}
				>
					<ImageIcon data-icon="inline-start" />
					View Ad
				</Button>
			{/if}
			<ShareJobButton
				url={shareUrl}
				title={job.title}
				text={job.department}
				class={adUrl ? 'shrink-0' : 'w-full'}
			/>
		</div>
	</Card.Content>
</Card.Root>
