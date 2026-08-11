<script lang="ts">
	import FilterPanelAsync from '$lib/components/jobs/filter-panel-async.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import FilterIcon from '@lucide/svelte/icons/sliders-horizontal';
	import XIcon from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import type { JobSort } from '$lib/jobs-utils';

	type FilterOptions = {
		degree_areas: string[];
		degrees: string[];
		education_levels: string[];
		grades: string[];
		places: string[];
		domiciles: string[];
	};

	type Filters = {
		degree_areas: string[];
		education_level: string | null;
		grade: string | null;
		age: number | null;
		place_of_posting: string | null;
		domicile: string | null;
		department?: string | null;
		collar?: string | null;
		has_salary?: boolean;
		q: string | null;
		show_expired: boolean;
		sort: JobSort;
	};

	let {
		open = $bindable(false),
		filters,
		options,
		resultCount,
		activeFilterCount = 0,
		clearHref = '/',
		children
	}: {
		open?: boolean;
		filters: Filters;
		options: Promise<FilterOptions>;
		resultCount: number;
		activeFilterCount?: number;
		/** Destination when clearing filters from the main page control */
		clearHref?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
	{#if activeFilterCount > 0}
		<Button href={clearHref} variant="outline" class="w-full sm:w-auto">
			<XIcon data-icon="inline-start" />
			Clear filters
			<span class="text-muted-foreground">({activeFilterCount})</span>
		</Button>
	{/if}
	<Dialog.Root bind:open>
		<Dialog.Trigger
			class="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm shadow-xs hover:bg-muted sm:w-auto sm:justify-between"
		>
			<span class="inline-flex items-center gap-2">
				<FilterIcon class="size-4" />
				Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
			</span>
		</Dialog.Trigger>
		<Dialog.Content
			class="fixed inset-y-0 left-0 right-auto top-0 flex h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 border-r border-border p-0 shadow-lg ring-0 data-closed:slide-out-to-left data-open:slide-in-from-left data-closed:zoom-out-100 data-open:zoom-in-100 sm:max-w-md"
		>
			<Dialog.Header class="shrink-0 border-b border-border px-6 py-4 text-left">
				<Dialog.Title>Filters</Dialog.Title>
				<Dialog.Description>Narrow jobs by eligibility and location.</Dialog.Description>
			</Dialog.Header>
			<div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4">
				<FilterPanelAsync {filters} {options} {resultCount} />
				{#if children}
					{@render children()}
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
