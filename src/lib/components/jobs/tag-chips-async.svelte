<script lang="ts">
	import TagChips from '$lib/components/jobs/tag-chips.svelte';
	import TagChipsSkeleton from '$lib/components/jobs/tag-chips-skeleton.svelte';

	type TagCount = { slug: string; label: string; count: number };

	let {
		tags
	}: {
		/** Streamed from load — must not be awaited in +page.server.ts. */
		tags: Promise<TagCount[]> | TagCount[];
	} = $props();
</script>

{#snippet pending()}
	<TagChipsSkeleton />
{/snippet}

{#snippet failed(error: unknown)}
	<div
		class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		role="alert"
	>
		Could not load tags.
		<span class="sr-only">{String(error)}</span>
	</div>
{/snippet}

<svelte:boundary {pending} {failed}>
	{#await tags}
		<TagChipsSkeleton />
	{:then resolved}
		<TagChips tags={resolved} />
	{:catch error}
		{@render failed(error)}
	{/await}
</svelte:boundary>
