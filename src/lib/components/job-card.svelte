<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import MultiValueBadges from '$lib/components/multi-value-badges.svelte';
	import GenderIcons from '$lib/components/gender-icons.svelte';
	import JobAdModal from '$lib/components/jobs/job-ad-modal.svelte';
	import {
		formatAgeRange,
		formatDateLabel,
		getJobAdUrl,
		isClosingSoon,
		isJobExpired,
		isWomenOrTransOnly,
		type JobSort
	} from '$lib/jobs-utils';
	import ImageIcon from '@lucide/svelte/icons/image';

	type JobCardJob = {
		row_id: number;
		title: string | null;
		department: string | null;
		education_level: string | null;
		degree_area: string | null;
		degrees: string | null;
		grade: string | null;
		place_of_posting: string | null;
		domicile: string | null;
		gender: string | null;
		min_age: number | null;
		max_age: number | null;
		last_date_to_apply: string | Date | null;
		supabase_file_path?: string | null;
	};

	let {
		job,
		sort = 'newest'
	}: {
		job: JobCardJob;
		sort?: JobSort;
	} = $props();

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
	const href = $derived(`/jobs/${job.row_id}`);
	const womenOrTransOnly = $derived(isWomenOrTransOnly(job.gender));
	const adUrl = $derived(getJobAdUrl(job.supabase_file_path));

	let adOpen = $state(false);
</script>

<Card.Root
	size="sm"
	class="h-full transition-colors {womenOrTransOnly
		? 'ring-2 ring-pink-400 hover:ring-pink-500 dark:ring-pink-500 dark:hover:ring-pink-400'
		: 'hover:border-primary/40'} {expired ? 'opacity-70' : ''}"
>
	<a {href} class="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
		<Card.Header class="gap-1.5 pb-2">
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
			{#if job.department}
				<Card.Description class="line-clamp-2 text-xs md:text-sm">{job.department}</Card.Description>
			{/if}
		</Card.Header>
	</a>

	{#if adUrl}
		<JobAdModal bind:open={adOpen} title={job.title} supabaseFilePath={job.supabase_file_path} />
	{/if}

	<Card.Content class="space-y-2.5 pt-0">
		<div class="space-y-2">
			{#if job.education_level}
				<p class="text-xs md:text-sm">
					<span class="text-muted-foreground">Education:</span>
					{job.education_level}
				</p>
			{/if}
			{#if job.degree_area || job.degrees}
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground">Degree areas</p>
					<MultiValueBadges value={job.degree_area} {sort} />
					{#if job.degrees}
						<MultiValueBadges value={job.degrees} {sort} />
					{/if}
				</div>
			{/if}
			{#if job.domicile}
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground">Domicile</p>
					<MultiValueBadges value={job.domicile} {sort} param="domicile" />
				</div>
			{/if}
			{#if job.place_of_posting}
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
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground md:text-sm">
			{#if job.max_age != null}
				<Badge
					variant="outline"
					class="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
				>
					Max Age: {job.max_age}y
				</Badge>
			{:else if ageLabel}
				<span>Age: {ageLabel}</span>
			{/if}
			{#if applyByLabel}
				<span
					class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide {applyByClass}"
				>
					Deadline: {applyByLabel}
				</span>
			{/if}
		</div>
		{#if adUrl}
			<Button
				type="button"
				variant="outline"
				size="sm"
				class="w-full"
				onclick={() => (adOpen = true)}
			>
				<ImageIcon data-icon="inline-start" />
				View Ad
			</Button>
		{/if}
	</Card.Content>
</Card.Root>
