<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		browseShownCount,
		browseViewMode,
		setBrowseViewMode,
		type BrowseViewMode
	} from '$lib/browse-view-mode';
	import { filtersToHref, selectedCollars, type FilterParams } from '$lib/jobs-utils';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import DicesIcon from '@lucide/svelte/icons/dices';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import ListIcon from '@lucide/svelte/icons/list';

	type ResultsSortOption = 'closing_soon' | 'newest' | 'salary';
	type CollarFilterOption = 'white' | 'grey' | 'blue';
	type ToolbarDropdownOption = ResultsSortOption | CollarFilterOption;

	const RESULTS_SORT_OPTIONS = [
		{ value: 'closing_soon', label: 'Closing soon' },
		{ value: 'newest', label: 'Newly Posted' }
	] as const;

	const SALARY_SORT_OPTION = { value: 'salary', label: 'Salary' } as const;

	const COLLAR_FILTER_OPTIONS = [
		{ value: 'white', label: 'Educated Jobs' },
		{ value: 'grey', label: 'Skilled Jobs' },
		{ value: 'blue', label: 'Labor Jobs' }
	] as const;

	let {
		filters,
		total = null,
		countLoading = false,
		loading = false,
		error = null,
		totalPages = 1
	}: {
		filters: FilterParams;
		total?: number | null;
		countLoading?: boolean;
		loading?: boolean;
		error?: string | null;
		totalPages?: number;
	} = $props();

	const viewMode = $derived($browseViewMode);
	const shown = $derived($browseShownCount);

	const currentPage = $derived(Math.max(1, filters.page ?? 1));
	const pages = $derived(Math.max(1, totalPages));
	const showPageJump = $derived(!error && pages > 1);

	let pageInput = $state('1');

	$effect(() => {
		pageInput = String(currentPage);
	});

	const resultsSort = $derived.by((): ResultsSortOption => {
		if (filters.sort === 'closing_soon') return 'closing_soon';
		if (filters.sort === 'salary') return 'salary';
		return 'newest';
	});

	const activeCollar = $derived.by((): CollarFilterOption | null => {
		const collars = selectedCollars(filters);
		return collars.length === 1 ? collars[0] : null;
	});

	const dropdownValue = $derived.by((): ToolbarDropdownOption => {
		if (activeCollar) return activeCollar;
		return resultsSort;
	});

	const dropdownLabel = $derived.by(() => {
		if (activeCollar) {
			return (
				COLLAR_FILTER_OPTIONS.find((o) => o.value === activeCollar)?.label ?? 'Educated Jobs'
			);
		}
		if (resultsSort === 'salary') return SALARY_SORT_OPTION.label;
		return RESULTS_SORT_OPTIONS.find((o) => o.value === resultsSort)?.label ?? 'Newly Posted';
	});

	function setViewMode(next: BrowseViewMode) {
		setBrowseViewMode(next);
	}

	function goToPage(target: number) {
		const next = Math.min(pages, Math.max(1, Math.round(target)));
		if (next === currentPage && !loading) return;
		goto(
			filtersToHref(
				{
					...filters,
					page: next
				},
				page.url.pathname
			),
			{
				keepFocus: true,
				noScroll: true
			}
		);
	}

	function submitPageJump(event: Event) {
		event.preventDefault();
		const parsed = Number.parseInt(pageInput.trim(), 10);
		if (!Number.isFinite(parsed)) {
			pageInput = String(currentPage);
			return;
		}
		goToPage(parsed);
	}

	function goRandomPage() {
		if (pages <= 1) return;
		let next = Math.floor(Math.random() * pages) + 1;
		if (next === currentPage) {
			next = next >= pages ? 1 : next + 1;
		}
		goToPage(next);
	}

	function onDropdownChange(next: string) {
		const collarOption = COLLAR_FILTER_OPTIONS.find((o) => o.value === next);
		if (collarOption) {
			goto(
				filtersToHref(
					{
						...filters,
						collar: [collarOption.value],
						page: 1
					},
					page.url.pathname
				),
				{
					keepFocus: true,
					noScroll: true
				}
			);
			return;
		}

		const option = next as ResultsSortOption;
		goto(
			filtersToHref(
				{
					...filters,
					sort: option,
					collar: [],
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
	class="flex flex-nowrap items-center justify-between gap-1 border-t border-border bg-background py-0.5 sm:gap-1.5 sm:py-1"
>
	<div class="min-w-0 shrink truncate">
		{#if countLoading || total == null}
			<Skeleton class="h-3.5 w-16 sm:w-24" />
		{:else if !error && shown > 0 && shown < total}
			<p class="truncate text-[11px] text-muted-foreground sm:text-xs">
				<span class="hidden sm:inline">Jobs </span>
				<span class="font-semibold text-foreground">{shown.toLocaleString()}</span>
				<span class="text-muted-foreground">/</span>
				<span class="font-semibold text-foreground">{total.toLocaleString()}</span>
			</p>
		{:else if !error && shown > 0}
			<p class="truncate text-[11px] text-muted-foreground sm:text-xs">
				<span class="font-semibold text-foreground">{total.toLocaleString()}</span>
				<span class="hidden sm:inline"> job{total === 1 ? '' : 's'}</span>
			</p>
		{/if}
	</div>

	{#if showPageJump}
		<div
			class="inline-flex shrink-0 items-center rounded-md border border-border"
			role="navigation"
			aria-label="Results pages"
		>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="hidden size-6 shrink-0 px-0 sm:inline-flex"
				disabled={loading || currentPage <= 1}
				onclick={() => goToPage(1)}
				aria-label="First page"
			>
				<ChevronsLeftIcon class="size-3" aria-hidden="true" />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="size-6 shrink-0 px-0"
				disabled={loading || currentPage <= 1}
				onclick={() => goToPage(currentPage - 1)}
				aria-label="Previous page"
			>
				<ChevronLeftIcon class="size-3" aria-hidden="true" />
			</Button>

			<form class="inline-flex items-center gap-0.5" onsubmit={submitPageJump}>
				<label class="sr-only" for="browse-page-jump">Go to page</label>
				<Input
					id="browse-page-jump"
					type="number"
					inputmode="numeric"
					min={1}
					max={pages}
					bind:value={pageInput}
					disabled={loading}
					class="h-6 w-8 border-0 px-0.5 text-center text-[11px] tabular-nums shadow-none focus-visible:ring-1 sm:w-10 sm:text-xs"
					aria-label="Page number"
				/>
				<span class="whitespace-nowrap pr-0.5 text-[11px] text-muted-foreground tabular-nums sm:text-xs">
					/{pages.toLocaleString()}
				</span>
			</form>

			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="size-6 shrink-0 px-0"
				disabled={loading || currentPage >= pages}
				onclick={() => goToPage(currentPage + 1)}
				aria-label="Next page"
			>
				<ChevronRightIcon class="size-3" aria-hidden="true" />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="hidden size-6 shrink-0 px-0 sm:inline-flex"
				disabled={loading || currentPage >= pages}
				onclick={() => goToPage(pages)}
				aria-label="Last page"
			>
				<ChevronsRightIcon class="size-3" aria-hidden="true" />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="size-6 shrink-0 px-0"
				disabled={loading}
				onclick={goRandomPage}
				aria-label="Random page"
				title="Jump to a random page"
			>
				<DicesIcon class="size-3" aria-hidden="true" />
			</Button>
		</div>
	{/if}

	<div class="flex shrink-0 items-center gap-1">
		<div
			class="hidden rounded-md border border-border p-0.5 lg:inline-flex"
			role="group"
			aria-label="Results layout"
		>
			<Button
				type="button"
				variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-6 gap-1 px-1.5 text-xs"
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
				class="h-6 gap-1 px-1.5 text-xs"
				aria-pressed={viewMode === 'list'}
				onclick={() => setViewMode('list')}
			>
				<ListIcon class="size-3.5" aria-hidden="true" />
				<span class="hidden xl:inline">List</span>
			</Button>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="inline-flex h-6 max-w-[7.5rem] items-center gap-0.5 rounded-md px-1 text-[11px] text-foreground hover:bg-muted sm:max-w-none sm:gap-1 sm:px-1.5 sm:text-xs lg:px-2"
				aria-label="Sort by {dropdownLabel}"
			>
				<ArrowUpDownIcon class="size-3 shrink-0 text-muted-foreground sm:hidden" aria-hidden="true" />
				<span class="hidden text-muted-foreground sm:inline">Sort by:</span>
				<span class="truncate font-medium">{dropdownLabel}</span>
				<ChevronDownIcon class="size-3 shrink-0 text-muted-foreground sm:size-3.5" aria-hidden="true" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="min-w-52">
				<DropdownMenu.RadioGroup value={dropdownValue} onValueChange={onDropdownChange}>
					{#each RESULTS_SORT_OPTIONS as option (option.value)}
						<DropdownMenu.RadioItem value={option.value}>
							{option.label}
						</DropdownMenu.RadioItem>
					{/each}
					<DropdownMenu.Separator />
					{#each COLLAR_FILTER_OPTIONS as option (option.value)}
						<DropdownMenu.RadioItem value={option.value}>
							{option.label}
						</DropdownMenu.RadioItem>
					{/each}
					<DropdownMenu.Separator />
					<DropdownMenu.RadioItem value={SALARY_SORT_OPTION.value}>
						{SALARY_SORT_OPTION.label}
					</DropdownMenu.RadioItem>
				</DropdownMenu.RadioGroup>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
