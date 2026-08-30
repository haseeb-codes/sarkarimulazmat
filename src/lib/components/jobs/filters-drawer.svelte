<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import ActiveFilterChips from '$lib/components/jobs/active-filter-chips.svelte';
	import BrowseResultsToolbar from '$lib/components/jobs/browse-results-toolbar.svelte';
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
	import PanelLeftCloseIcon from '@lucide/svelte/icons/panel-left-close';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		filters,
		resultCount = null,
		countLoading = false,
		listingLoading = false,
		listingError = null,
		children
	}: {
		filters: FilterParams;
		/** null while the result count is still loading */
		resultCount?: number | null;
		countLoading?: boolean;
		listingLoading?: boolean;
		listingError?: string | null;
		children?: Snippet;
	} = $props();

	let open = $state(false);
	let sidebarVisible = $state(true);
	let resultsRegion = $state<HTMLElement | null>(null);
	let searchChrome = $state<HTMLElement | null>(null);
	/** Keep results height while listing swaps so the window doesn't clamp to top. */
	let resultsMinHeight = $state<number | null>(null);
	/** Measured sticky chrome height for scroll-margin. */
	let searchChromeHeight = $state(0);
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

	const chipFilters = $derived({ ...filters, ...displayFilters });
	const resultsHeaderOffset = $derived(
		searchChromeHeight > 0
			? `calc(var(--browse-search-offset) + ${searchChromeHeight}px)`
			: '8rem'
	);

	$effect(() => {
		const el = searchChrome;
		if (!el || typeof ResizeObserver === 'undefined') return;

		const update = () => {
			searchChromeHeight = el.offsetHeight;
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	});

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
  - Window scrolls results; search + results toolbar stick as one unit under the site header.
  - On filter/search URL changes, scroll only enough to bring the results
    region under the sticky chrome (not document top).
-->
<div
	class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6"
	style="--browse-search-offset: 3.5rem; --browse-filters-offset: 3.5rem; --browse-results-header-offset: {resultsHeaderOffset};"
>
	<aside
		class="hidden w-72 shrink-0 self-start overflow-y-auto rounded-lg border border-border bg-muted/40 lg:sticky lg:top-[var(--browse-filters-offset)] lg:max-h-[calc(100svh-var(--browse-filters-offset)-1rem)] xl:w-80 {sidebarVisible
			? 'lg:block'
			: ''}"
	>
		<div
			class="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-muted/80 px-4 py-3"
		>
			<h2 class="text-xs font-semibold tracking-tight lg:text-sm">
				Filters
				<span class="font-normal text-muted-foreground">
					·
					{#if countLoading || resultCount == null}
						<Skeleton class="inline-block h-3.5 w-16 align-middle" />
					{:else}
						{resultCount.toLocaleString()} job{resultCount === 1 ? '' : 's'}
					{/if}
				</span>
			</h2>
			<div class="flex shrink-0 items-center gap-0.5">
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
				<Button
					variant="ghost"
					size="icon-sm"
					class="hidden lg:inline-flex"
					aria-label="Hide filters"
					onclick={() => (sidebarVisible = false)}
				>
					<PanelLeftCloseIcon class="size-4" aria-hidden="true" />
				</Button>
			</div>
		</div>
		<div class="px-4 py-4">
			<JobsFilterForm
				filters={displayFilters}
				options={STATIC_DRAWER_FILTER_OPTIONS}
				idPrefix="sidebar-"
			/>
		</div>
	</aside>

	<div class="min-w-0 flex-1">
		<div
			bind:this={searchChrome}
			class="sticky z-30 border-b border-border bg-background"
			style="top: var(--browse-search-offset)"
		>
			<div class="py-2 lg:py-3">
				<div class="flex items-center gap-1.5 lg:gap-2">
					<div class="shrink-0">
						{#if !sidebarVisible}
							<Button
								variant="outline"
								size="sm"
								class="hidden h-9 w-9 px-0 lg:inline-flex {hasSearchParams
									? 'border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive'
									: ''}"
								onclick={() => (sidebarVisible = true)}
								aria-label={filtersLabel}
							>
								<FilterIcon class="size-3.5" aria-hidden="true" />
							</Button>
						{/if}

						<div class="lg:hidden">
							<Drawer.Root bind:open direction="left" handleOnly shouldScaleBackground={false}>
								<Button
									variant="outline"
									size="sm"
									class="h-9 w-9 px-0 {hasSearchParams
										? 'border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive'
										: ''}"
									onclick={() => (open = true)}
									aria-label={filtersLabel}
								>
									<FilterIcon class="size-3.5" aria-hidden="true" />
								</Button>

								{#if open}
									<Drawer.Content class="flex max-h-svh flex-col gap-0 sm:max-w-md">
										<Drawer.Header class="shrink-0 border-b border-border text-left">
											<div class="flex items-start justify-between gap-2">
												<Drawer.Title>
													Filters
													<span class="font-normal text-muted-foreground">
														·
														{#if countLoading || resultCount == null}
															<Skeleton class="inline-block h-3.5 w-16 align-middle" />
														{:else}
															{resultCount.toLocaleString()} job{resultCount === 1 ? '' : 's'}
														{/if}
													</span>
												</Drawer.Title>
												<div class="flex shrink-0 items-center gap-0.5">
													{#if hasSearchParams}
														<Button
															variant="ghost"
															size="sm"
															class="h-7 px-2 text-xs text-destructive hover:text-destructive"
															onclick={clearFilters}
														>
															Clear
														</Button>
													{/if}
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label="Close filters"
														onclick={() => (open = false)}
													>
														<XIcon class="size-4" aria-hidden="true" />
													</Button>
												</div>
											</div>
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
					</div>

					<div class="min-w-0 flex-1">
						<JobsSearch filters={chipFilters} />
					</div>
				</div>
				<ActiveFilterChips filters={chipFilters} />
			</div>
			<BrowseResultsToolbar
				filters={chipFilters}
				total={resultCount}
				countLoading={countLoading}
				loading={listingLoading}
				error={listingError}
			/>
		</div>

		<div
			bind:this={resultsRegion}
			class="relative z-0 isolate mt-4 scroll-mt-[var(--browse-results-header-offset,8rem)]"
			style:min-height={resultsMinHeight != null ? `${resultsMinHeight}px` : undefined}
		>
			{@render children?.()}
		</div>
	</div>
</div>