<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { onFilterLinkClick } from '$lib/filter-nav';
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let {
		savedSearches,
		canSave,
		saveMessage
	}: {
		savedSearches: { id: string; label: string; href: string }[];
		canSave: boolean;
		saveMessage?: string | null;
	} = $props();
</script>

<section class="space-y-3 rounded-lg border border-border bg-card p-4" aria-labelledby="saved-heading">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 id="saved-heading" class="text-sm font-semibold">Saved searches</h2>
		{#if canSave}
			<form method="POST" action="?/saveSearch" use:enhance>
				<Button type="submit" variant="outline" size="sm">
					<BookmarkIcon class="size-4" data-icon="inline-start" />
					Save this search
				</Button>
			</form>
		{/if}
	</div>

	{#if saveMessage}
		<p class="text-xs text-muted-foreground" role="status">{saveMessage}</p>
	{/if}

	{#if savedSearches.length === 0}
		<p class="text-sm text-muted-foreground">
			Save a filter set to re-run it later — no account needed.
		</p>
	{:else}
		<ul class="space-y-2">
			{#each savedSearches as item (item.id)}
				<li class="flex items-center gap-2">
					<a
						href={item.href}
						data-sveltekit-noscroll
						onclick={onFilterLinkClick}
						class="min-h-11 flex-1 truncate rounded-md px-2 py-2 text-sm hover:bg-muted"
					>
						{item.label}
					</a>
					<form method="POST" action="?/deleteSearch" use:enhance class="shrink-0">
						<input type="hidden" name="id" value={item.id} />
						<Button
							type="submit"
							variant="ghost"
							size="icon-sm"
							aria-label="Delete saved search: {item.label}"
						>
							<Trash2Icon class="size-4" />
						</Button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>
