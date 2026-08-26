<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import JobsFilterForm from '$lib/components/jobs/jobs-filter-form.svelte';
	import JobsSearch from '$lib/components/jobs/jobs-search.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { STATIC_DRAWER_FILTER_OPTIONS } from '$lib/filter-static-options';
	import {
		clearDrawerFilterPatch,
		drawerFilterActiveCount,
		effectiveDrawerFilters,
		filtersToHref,
		type FilterParams
	} from '$lib/jobs-utils';
	import type { Snippet } from 'svelte';
	import FilterIcon from '@lucide/svelte/icons/sliders-horizontal';

	let {
		filters,
		resultCount = null,
		children
	}: {
		filters: FilterParams;
		/** null while job listing is still loading */
		resultCount?: number | null;
		children?: Snippet;
	} = $props();

	let open = $state(false);

	const displayFilters = $derived(
		effectiveDrawerFilters(filters, navigating.to?.url ?? page.url, page.url.pathname)
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

<!--
  Layout:
  - Navbar + page description sit above this block.
  - Two columns: filters (left) | search + results (right).
  - Window scrolls results; search sticks under the site header;
    results header sticks under search; filters stick under the header.
-->
<div
	class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6"
	style="--browse-search-offset: 3.5rem; --browse-filters-offset: 3.5rem; --browse-results-header-offset: 8rem;"
>
	<aside
		class="hidden w-72 shrink-0 self-start overflow-y-auto rounded-lg border border-border bg-muted/40 lg:sticky lg:top-[var(--browse-filters-offset)] lg:block lg:max-h-[calc(100svh-var(--browse-filters-offset)-1rem)] xl:w-80"
	>
		<div
			class="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-muted/80 px-4 py-3"
		>
			<h2 class="text-sm font-semibold tracking-tight">
				Filters
				<span class="font-normal text-muted-foreground">
					·
					{#if resultCount == null}
						<Skeleton class="inline-block h-3.5 w-16 align-middle" />
					{:else}
						{resultCount.toLocaleString()} job{resultCount === 1 ? '' : 's'}
					{/if}
				</span>
			</h2>
			{#if activeCount}
				<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={clearFilters}>
					Clear
				</Button>
			{/if}
		</div>
		<div class="px-4 py-4">
			<JobsFilterForm
				filters={displayFilters}
				options={STATIC_DRAWER_FILTER_OPTIONS}
				idPrefix="sidebar-"
			/>
		</div>
	</aside>

	<div class="min-w-0 flex-1 space-y-4">
		<div
			class="sticky top-[var(--browse-search-offset)] z-30 isolate border-b border-border bg-background py-3 transform-gpu"
		>
			<div class="flex items-center gap-2">
				<div class="shrink-0 lg:hidden">
					<Drawer.Root bind:open direction="left" handleOnly shouldScaleBackground={false}>
						<div class="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								class="h-12 gap-1.5 {activeCount ? 'px-3' : 'w-12 px-0'}"
								onclick={() => (open = true)}
								aria-label={filtersLabel}
							>
								<FilterIcon class="size-4" aria-hidden="true" />
								{#if activeCount}
									<span class="text-sm font-medium tabular-nums">{activeCount}</span>
								{/if}
							</Button>
							{#if activeCount}
								<Button variant="ghost" size="sm" class="h-12 px-2" onclick={clearFilters}>
									Clear
								</Button>
							{/if}
						</div>

						{#if open}
							<Drawer.Content class="flex max-h-svh flex-col gap-0 sm:max-w-md">
								<Drawer.Header class="shrink-0 border-b border-border text-left">
									<Drawer.Title>
										Filters
										<span class="font-normal text-muted-foreground">
											·
											{#if resultCount == null}
												<Skeleton class="inline-block h-3.5 w-16 align-middle" />
											{:else}
												{resultCount.toLocaleString()} job{resultCount === 1 ? '' : 's'}
											{/if}
										</span>
									</Drawer.Title>
									<Drawer.Description>
										Narrow jobs by age, qualification, degree specialization, BPS grade, permanent
										jobs, and domicile.
									</Drawer.Description>
								</Drawer.Header>
								<div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
									<JobsFilterForm
										filters={displayFilters}
										options={STATIC_DRAWER_FILTER_OPTIONS}
										idPrefix="drawer-"
									/>
								</div>
							</Drawer.Content>
						{/if}
					</Drawer.Root>
				</div>

				<div class="min-w-0 flex-1">
					<JobsSearch {filters} />
				</div>
			</div>
		</div>

		<div class="relative z-0 isolate">
			{@render children?.()}
		</div>
	</div>
</div>
