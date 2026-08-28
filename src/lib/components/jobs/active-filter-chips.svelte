<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		activeFilterChips,
		filtersToHref,
		type FilterParams
	} from '$lib/jobs-utils';
	import XIcon from '@lucide/svelte/icons/x';

	let { filters }: { filters: FilterParams } = $props();

	const chips = $derived(activeFilterChips(filters));

	function clearChip(clear: Partial<FilterParams>) {
		goto(filtersToHref({ ...filters, ...clear, page: 1 }, page.url.pathname), {
			keepFocus: true,
			noScroll: true
		});
	}

	function clearAll() {
		goto(page.url.pathname, {
			keepFocus: true,
			noScroll: true
		});
	}
</script>

{#if chips.length}
	<div class="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Active filters">
		{#each chips as chip (chip.id)}
			<button
				type="button"
				class="inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-border bg-muted/60 py-0 pr-1 pl-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
				onclick={() => clearChip(chip.clear)}
				aria-label="Remove filter {chip.label}"
			>
				<span class="min-w-0 truncate">{chip.label}</span>
				<span
					class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
					aria-hidden="true"
				>
					<XIcon class="size-3" />
				</span>
			</button>
		{/each}
		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-7 px-2 text-xs text-destructive hover:text-destructive"
			onclick={clearAll}
		>
			Clear all
		</Button>
	</div>
{/if}
