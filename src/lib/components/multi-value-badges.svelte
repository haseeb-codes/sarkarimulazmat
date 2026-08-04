<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { badgeFilterHref, splitMultiValue, type JobSort } from '$lib/jobs-utils';

	let {
		value,
		sort = 'newest',
		clickable = true
	}: {
		value: string | null | undefined;
		sort?: JobSort;
		clickable?: boolean;
	} = $props();

	const parts = $derived(
		splitMultiValue(value).filter((p) => p.toUpperCase() !== 'NA' && p !== '-')
	);
</script>

{#if parts.length}
	<div class="flex flex-wrap gap-1.5">
		{#each parts as part (part)}
			{#if clickable}
				<Badge
					variant="outline"
					href={badgeFilterHref(part, sort)}
					aria-label="Filter by {part}"
					class="underline-offset-2 hover:underline"
				>
					{part}
				</Badge>
			{:else}
				<Badge variant="secondary">{part}</Badge>
			{/if}
		{/each}
	</div>
{/if}
