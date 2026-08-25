<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { badgeFilterHref, splitMultiValue, type JobSort } from '$lib/jobs-utils';

	let {
		value,
		sort = 'newest',
		clickable = true,
		param = 'degree_areas',
		class: className = '',
		containerClass = 'flex min-w-0 flex-wrap gap-1.5'
	}: {
		value: string | null | undefined;
		sort?: JobSort;
		clickable?: boolean;
		param?: 'degree_areas' | 'domicile' | 'place_of_posting' | 'education_level' | 'program';
		class?: string;
		containerClass?: string;
	} = $props();

	const parts = $derived(
		splitMultiValue(value).filter((p) => p.toUpperCase() !== 'NA' && p !== '-')
	);
</script>

{#if parts.length}
	<span class={containerClass}>
		{#each parts as part (part)}
			{#if clickable}
				<Badge
					variant="outline"
					href={badgeFilterHref(part, sort, param)}
					aria-label="Filter by {part}"
					class="underline-offset-2 hover:underline {className}"
				>
					{part}
				</Badge>
			{:else}
				<Badge variant="secondary" class={className}>{part}</Badge>
			{/if}
		{/each}
	</span>
{/if}
