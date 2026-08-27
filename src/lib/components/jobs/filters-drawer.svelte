<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import JobsFilterForm from '$lib/components/jobs/jobs-filter-form.svelte';
	import JobsSearch from '$lib/components/jobs/jobs-search.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { STATIC_DRAWER_FILTER_OPTIONS } from '$lib/filter-static-options';
	import {
		drawerFilterActiveCount,
		effectiveDrawerFilters,
		urlHasSearchParams,
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
	let resultsRegion = $state<HTMLElement | null>(null);
	/** Keep results height while listing swaps so the window doesn't clamp to top. */
	let resultsMinHeight = $state<number | null>(null);

	const browseUrl = $derived(
		navigating.to?.url.pathname === page.url.pathname ? navigating.to.url : page.url
	);

	const displayFilters = $derived(
		effectiveDrawerFilters(filters, browseUrl, page.url.pathname)
	);

	const activeCount = $derived(drawerFilterActiveCount(displayFilters));

	/** Any query param — show Clear even for q / sort / tags outside the drawer form. */
	const hasSearchParams = $derived(urlHasSearchParams(browseUrl));

	const filtersLabel = $derived(activeCount ? `Filters (${activeCount})` : 'Filters');

	function isBrowsePath(pathname: string): boolean {
		return pathname === '/' || /^\/[^/]+$/.test(pathname);
	}

	/** Bring results back under sticky search/header — never jump the whole page to y=0. */
	function scrollResultsToTop() {
		const el = resultsRegion;
		if (!el) return;
		const margin = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
		const targetY = window.scrollY + el.getBoundingClientRect().top - margin;
		if (window.scrollY > targetY + 1) {
			window.scrollTo({ top: Math.max(0, targetY), behavior: 'auto' });
		}
	}

	function lockResultsHeight() {
		const el = resultsRegion;
		if (!el) return;
		resultsMinHeight = Math.max(el.offsetHeight, Math.ceil(window.innerHeight * 0.5));
	}

	function clearFilters() {
		goto(page.url.pathname, {
			keepFocus: true,
			noScroll: true
		});
	}

	beforeNavigate(({ from, to }) => {
		if (!from || !to) return;
		const sameBrowse =
			isBrowsePath(from.url.pathname) &&
			isBrowsePath(to.url.pathname) &&
			(from.url.pathname === to.url.pathname
				? from.url.search !== to.url.search
				: true);
		if (!sameBrowse) return;
		// Path-only change to a different browse page (e.g. tag chip) still locks height.
		if (from.url.pathname === to.url.pathname && from.url.search === to.url.search) return;
		lockResultsHeight();
	});

	$effect(() => {
		const to = navigating.to;
		if (!to) {
			// Navigation finished — release height lock after layout settles.
			if (resultsMinHeight != null) {
				const id = requestAnimationFrame(() => {
					resultsMinHeight = null;
				});
				return () => cancelAnimationFrame(id);
			}
			return;
		}
		if (to.url.pathname !== page.url.pathname) {
			open = false;
			if (isBrowsePath(to.url.pathname) && isBrowsePath(page.url.pathname)) {
				scrollResultsToTop();
			}
			return;
		}
		// Same path, query changed (filter / search / clear) — reset results scroll only.
		if (to.url.search !== page.url.search) {
			scrollResultsToTop();
		}
	});
</script>

<!--
  Layout:
  - Navbar + page description sit above this block.
  - Two columns: filters (left) | search + results (right).
  - Window scrolls results; search sticks under the site header;
    results header sticks under search; filters stick under the header.
  - On filter/search URL changes, scroll only enough to bring the results
    region under the sticky chrome (not document top).
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
			<Button
				variant="ghost"
				size="sm"
				class="h-7 px-2 text-xs text-destructive hover:text-destructive {!hasSearchParams
					? 'invisible pointer-events-none'
					: ''}"
				disabled={!hasSearchParams}
				tabindex={hasSearchParams ? 0 : -1}
				aria-hidden={!hasSearchParams}
				onclick={clearFilters}
			>
				Clear
			</Button>
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
								class="h-12 min-w-12 gap-1.5 px-3"
								onclick={() => (open = true)}
								aria-label={filtersLabel}
							>
								<FilterIcon class="size-4" aria-hidden="true" />
								<span
									class="inline-flex min-w-4 justify-center text-sm font-medium tabular-nums {!activeCount
										? 'invisible'
										: ''}"
									aria-hidden={!activeCount}
								>
									{activeCount || 0}
								</span>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="h-12 px-2 text-destructive hover:text-destructive {!hasSearchParams
									? 'invisible pointer-events-none'
									: ''}"
								disabled={!hasSearchParams}
								tabindex={hasSearchParams ? 0 : -1}
								aria-hidden={!hasSearchParams}
								onclick={clearFilters}
							>
								Clear
							</Button>
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

		<div
			bind:this={resultsRegion}
			class="relative z-0 isolate scroll-mt-[var(--browse-results-header-offset,8rem)]"
			style:min-height={resultsMinHeight != null ? `${resultsMinHeight}px` : undefined}
		>
			{@render children?.()}
		</div>
	</div>
</div>
