<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		browseShownCount,
		browseViewMode,
		setBrowseViewMode,
		type BrowseViewMode
	} from '$lib/browse-view-mode';
	import { filtersToHref, type FilterParams } from '$lib/jobs-utils';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import ListIcon from '@lucide/svelte/icons/list';

	type ResultsSortOption = 'closing_soon' | 'newest';

	const RESULTS_SORT_OPTIONS = [
		{ value: 'closing_soon', label: 'Closing soon' },
		{ value: 'newest', label: 'Newly Posted' }
	] as const;

	let {
		filters,
		total = null,
		loading = false,
		error = null
	}: {
		filters: FilterParams;
		total?: number | null;
		loading?: boolean;
		error?: string | null;
	} = $props();

	const viewMode = $derived($browseViewMode);
	const shown = $derived($browseShownCount);

	const resultsSort = $derived.by((): ResultsSortOption => {
		if (filters.sort === 'closing_soon') return 'closing_soon';
		return 'newest';
	});

	const resultsSortLabel = $derived(
		RESULTS_SORT_OPTIONS.find((o) => o.value === resultsSort)?.label ?? 'Newly Posted'
	);

	function setViewMode(next: BrowseViewMode) {
		setBrowseViewMode(next);
	}

	function setResultsSort(next: string) {
		const option = next as ResultsSortOption;
		goto(
			filtersToHref(
				{
					...filters,
					sort: option === 'closing_soon' ? 'closing_soon' : 'newest',
					page: 1
				},
				page.url.pathname
			),
			{
				keepFocus: true,
				noScroll: true
			}
		);
	}
</script>

<div
	class="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background px-0 py-1"
>
	<div class="flex min-w-0 flex-nowrap items-center gap-x-2 lg:gap-x-3">
		{#if loading || total == null}
			<Skeleton class="h-3.5 w-24 shrink-0" />
		{:else if !error && shown > 0 && shown < total}
			<p class="whitespace-nowrap text-xs text-muted-foreground">
				Jobs <span class="font-semibold text-foreground">{shown.toLocaleString()}</span> of
				<span class="font-semibold text-foreground">{total.toLocaleString()}</span>
			</p>
		{:else if !error && shown > 0}
			<p class="whitespace-nowrap text-xs text-muted-foreground">
				<span class="font-semibold text-foreground">{total.toLocaleString()}</span> job{total === 1
					? ''
					: 's'}
			</p>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-1.5 lg:gap-2">
		<div
			class="hidden lg:inline-flex rounded-md border border-border p-0.5"
			role="group"
			aria-label="Results layout"
		>
			<Button
				type="button"
				variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 gap-1 px-2 text-xs"
				aria-pressed={viewMode === 'masonry'}
				onclick={() => setViewMode('masonry')}
			>
				<LayoutGridIcon class="size-3.5" aria-hidden="true" />
				<span class="hidden xl:inline">Grid</span>
			</Button>
			<Button
				type="button"
				variant={viewMode === 'list' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 gap-1 px-2 text-xs"
				aria-pressed={viewMode === 'list'}
				onclick={() => setViewMode('list')}
			>
				<ListIcon class="size-3.5" aria-hidden="true" />
				<span class="hidden xl:inline">List</span>
			</Button>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs text-foreground hover:bg-muted lg:gap-1.5 lg:px-2"
			>
				<span class="text-muted-foreground">Sort by:</span>
				<span class="font-medium">{resultsSortLabel}</span>
				<ChevronDownIcon class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="min-w-52">
				<DropdownMenu.RadioGroup value={resultsSort} onValueChange={setResultsSort}>
					{#each RESULTS_SORT_OPTIONS as option (option.value)}
						<DropdownMenu.RadioItem value={option.value}>
							{option.label}
						</DropdownMenu.RadioItem>
					{/each}
				</DropdownMenu.RadioGroup>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
