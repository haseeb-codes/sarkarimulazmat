<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import JobsFilterFormAsync from '$lib/components/jobs/jobs-filter-form-async.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import {
		clearDrawerFilterPatch,
		drawerFilterActiveCount,
		effectiveDrawerFilters,
		filtersToHref,
		type FilterParams
	} from '$lib/jobs-utils';
	import type { Snippet } from 'svelte';
	import FilterIcon from '@lucide/svelte/icons/sliders-horizontal';

	type FilterOptions = {
		grades: string[];
		salary_max: number;
	};

	let {
		filters,
		options,
		resultCount,
		children
	}: {
		filters: FilterParams;
		options: Promise<FilterOptions>;
		resultCount: number;
		children?: Snippet;
	} = $props();

	let open = $state(false);

	const displayFilters = $derived(
		effectiveDrawerFilters(filters, navigating.to?.url, page.url.pathname)
	);

	const activeCount = $derived(drawerFilterActiveCount(displayFilters));

	const filtersLabel = $derived(activeCount ? `Filters (${activeCount})` : 'Filters');

	function clearFilters() {
		goto(filtersToHref({ ...filters, ...clearDrawerFilterPatch() }, page.url.pathname), {
			keepFocus: true,
			noScroll: true
		});
	}

	$effect(() => {
		const to = navigating.to;
		if (to && to.url.pathname !== page.url.pathname) open = false;
	});
</script>

<div class="min-w-0">
	<Drawer.Root bind:open direction="left" handleOnly>
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<Button variant="outline" size="sm" onclick={() => (open = true)}>
				<FilterIcon data-icon="inline-start" />
				{filtersLabel}
			</Button>
			{#if activeCount}
				<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
			{/if}
		</div>

		<Drawer.Content class="flex max-h-svh flex-col gap-0 sm:max-w-md">
			<Drawer.Header class="shrink-0 border-b border-border text-left">
				<Drawer.Title>Filters</Drawer.Title>
				<Drawer.Description>Narrow jobs by keyword, age, salary, domicile, tags, and grade.</Drawer.Description>
			</Drawer.Header>
			<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
				<JobsFilterFormAsync {filters} {options} {resultCount} />
			</div>
		</Drawer.Content>
	</Drawer.Root>

	{@render children?.()}
</div>
