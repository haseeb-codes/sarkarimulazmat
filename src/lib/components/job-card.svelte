<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import MultiValueBadges from '$lib/components/multi-value-badges.svelte';
	import {
		formatAgeRange,
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
	const href = $derived(`/jobs/${job.row_id}`);
</script>

<Card.Root
	class="transition-colors hover:border-primary/40 {expired ? 'opacity-70' : ''}"
>
	<a {href} class="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
		<Card.Header class="gap-2 pb-3">
			<div class="flex flex-wrap items-start justify-between gap-2">
				<Card.Title class="text-base leading-snug md:text-lg">
					{job.title ?? 'Untitled posting'}
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
		</div>
		<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
			{#if job.place_of_posting}
				<span>{job.place_of_posting}</span>
			{/if}
			{#if job.domicile}
				<span>Domicile: {job.domicile}</span>
			{/if}
			{#if ageLabel}
				<span>Age: {ageLabel}</span>
			{/if}
			{#if job.last_date_to_apply}
				<span>Apply by {job.last_date_to_apply}</span>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
