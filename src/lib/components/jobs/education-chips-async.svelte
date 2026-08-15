<script lang="ts">
	import EducationChips from '$lib/components/jobs/education-chips.svelte';
	import EducationChipsSkeleton from '$lib/components/jobs/education-chips-skeleton.svelte';

	let {
		browse
	}: {
		browse: Promise<{ educationLevels: { label: string; count: number }[] }>;
	} = $props();
</script>

{#snippet pending()}
	<EducationChipsSkeleton />
{/snippet}

{#snippet failed(error: unknown)}
	<div
		class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		role="alert"
	>
		Could not load education levels.
		<span class="sr-only">{String(error)}</span>
	</div>
{/snippet}

<svelte:boundary {pending} {failed}>
	{#await browse}
		<EducationChipsSkeleton />
	{:then data}
		<EducationChips educationLevels={data.educationLevels} />
	{:catch error}
		{@render failed(error)}
	{/await}
</svelte:boundary>
