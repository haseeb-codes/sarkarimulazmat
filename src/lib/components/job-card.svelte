<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import MultiValueBadges from '$lib/components/multi-value-badges.svelte';
	import GenderIcons from '$lib/components/gender-icons.svelte';
	import {
		formatAgeRange,
		formatDateLabel,
		isClosingSoon,
		isJobExpired,
		type JobSort
	} from '$lib/jobs-utils';

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
		last_date_to_apply: string | null;
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
</script>

<Card.Root
	class="transition-colors hover:border-primary/40 {expired ? 'opacity-70' : ''}"
>
	<a {href} class="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
		<Card.Header class="gap-2 pb-3">
			<div class="flex flex-wrap items-start justify-between gap-2">
				<Card.Title class="flex items-start gap-1.5 text-base leading-snug md:text-lg">
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
				<Card.Description class="text-sm">{job.department}</Card.Description>
			{/if}
		</Card.Header>
	</a>
	<Card.Content class="space-y-3 pt-0">
		<div class="space-y-2">
			{#if job.education_level}
				<p class="text-sm">
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
		</div>
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
			{#if job.place_of_posting}
				<span>{job.place_of_posting}</span>
			{/if}
			{#if ageLabel}
				<span>Age: {ageLabel}</span>
			{/if}
			{#if applyByLabel}
				<span
					class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide {applyByClass}"
				>
					Apply by {applyByLabel}
				</span>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
