<script lang="ts">
	import SavedSearches from '$lib/components/saved-searches.svelte';
	import SavedSearchesSkeleton from '$lib/components/jobs/saved-searches-skeleton.svelte';

	type SavedSearchItem = { id: string; label: string; href: string };

	let {
		savedSearches,
		canSave,
		saveMessage
	}: {
		savedSearches: Promise<SavedSearchItem[]>;
		canSave: boolean;
		saveMessage?: string | null;
	} = $props();
</script>

{#snippet pending()}
	<SavedSearchesSkeleton />
{/snippet}

{#snippet failed(error: unknown)}
	<div class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
		Could not load saved searches.
		<span class="sr-only">{String(error)}</span>
	</div>
{/snippet}

<svelte:boundary {pending} {failed}>
	{#await savedSearches}
		<SavedSearchesSkeleton />
	{:then items}
		<SavedSearches savedSearches={items} {canSave} {saveMessage} />
	{:catch error}
		{@render failed(error)}
	{/await}
</svelte:boundary>
