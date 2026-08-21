<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import DualRangeSlider from '$lib/components/jobs/dual-range-slider.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getJobCategoryTagLabel, getJobCategoryTags } from '$lib/job-category-pages';
	import {
		DOMICILE_REGIONS,
		selectedDomicileRegions,
		type DomicileRegionKey
	} from '$lib/domicile-regions';
	import {
		AGE_MAX_PRESETS,
		QUALIFICATION_LEVEL_MAX,
		QUALIFICATION_LEVEL_MIN,
		SALARY_FILTER_MIN,
		clearDrawerFilterPatch,
		drawerFilterActiveCount,
		filtersToHref,
		formatQualificationLevel,
		formatSalaryFilter,
		resolvedQualificationFrom,
		resolvedQualificationTo,
		resolvedSalaryFrom,
		resolvedSalaryTo,
		selectedTags,
		type AgeMaxPreset,
		type FilterParams
	} from '$lib/jobs-utils';

	type Options = {
		grades: string[];
		salary_max: number;
	};

	let {
		filters,
		options,
		resultCount,
		idPrefix = ''
	}: {
		filters: FilterParams;
		options: Options;
		resultCount: number;
		idPrefix?: string;
	} = $props();

	const salaryMax = $derived(Math.max(0, options.salary_max || 0));
	const salaryStep = $derived(salaryMax >= 100_000 ? 1000 : 100);

	let salaryRange = $state<[number, number]>([SALARY_FILTER_MIN, SALARY_FILTER_MIN]);
	let ageMaxDraft = $state<AgeMaxPreset | null>(null);
	let qualificationRange = $state<[number, number]>([
		QUALIFICATION_LEVEL_MIN,
		QUALIFICATION_LEVEL_MAX
	]);
	let tagSearch = $state('');
	let tagOpen = $state(false);
	let keywordDraft = $state('');
	let gradeDraft = $state<string | null>(null);
	let domicileRegionDraft = $state<DomicileRegionKey[]>([]);
	let tagsDraft = $state<string[]>([]);
	let keywordDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	const tagOptions = $derived(getJobCategoryTags());

	$effect(() => {
		if (!tagOpen) tagSearch = '';
	});

	$effect(() => {
		keywordDraft = filters.keyword ?? '';
		ageMaxDraft = filters.age_max ?? null;
		gradeDraft = filters.grade ?? null;
		domicileRegionDraft = selectedDomicileRegions(filters);
		tagsDraft = selectedTags(filters);
		qualificationRange = [
			resolvedQualificationFrom(filters),
			resolvedQualificationTo(filters)
		];
		salaryRange = [resolvedSalaryFrom(filters), resolvedSalaryTo(filters, salaryMax)];
	});

	const optimisticFilters = $derived({
		...filters,
		keyword: keywordDraft.trim() || null,
		age_max: ageMaxDraft,
		age_from: null,
		age_to: null,
		age: null,
		include_no_max_age: true,
		qualification_from:
			qualificationRange[0] > QUALIFICATION_LEVEL_MIN ? qualificationRange[0] : null,
		qualification_to:
			qualificationRange[1] < QUALIFICATION_LEVEL_MAX ? qualificationRange[1] : null,
		qualification_level: null,
		grade: gradeDraft,
		domicile: [],
		domicile_region: domicileRegionDraft,
		tag: tagsDraft,
		salary_from: salaryRange[0] > SALARY_FILTER_MIN ? salaryRange[0] : null,
		salary_to: salaryMax > 0 && salaryRange[1] < salaryMax ? salaryRange[1] : null,
		min_salary: null,
		has_salary: false
	} satisfies FilterParams);

	const activeCount = $derived(drawerFilterActiveCount(optimisticFilters, salaryMax));

	const gradeOptions = $derived.by(() => {
		const grades = new Map<string, string>();
		for (const grade of options.grades) {
			grades.set(grade.toLowerCase(), grade);
		}
		if (filters.grade) {
			const key = filters.grade.toLowerCase();
			if (!grades.has(key)) grades.set(key, filters.grade);
		}
		if (gradeDraft) {
			const key = gradeDraft.toLowerCase();
			if (!grades.has(key)) grades.set(key, gradeDraft);
		}
		return [...grades.values()].sort((a, b) =>
			a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })
		);
	});

	const filteredTagOptions = $derived.by(() => {
		const query = tagSearch.trim().toLowerCase();
		if (!query) return tagOptions;
		const selected = new Set(tagsDraft.map((slug) => slug.toLowerCase()));
		return tagOptions.filter(
			(tag) =>
				selected.has(tag.slug.toLowerCase()) ||
				tag.label.toLowerCase().includes(query) ||
				tag.slug.toLowerCase().includes(query)
		);
	});

	const tagTriggerLabel = $derived(
		tagsDraft.length === 0
			? 'Any tag'
			: tagsDraft.length === 1
				? getJobCategoryTagLabel(tagsDraft[0])
				: `${tagsDraft.length} selected`
	);

	function navigate(patch: Partial<FilterParams>) {
		goto(filtersToHref({ ...filters, ...patch, page: 1 }, page.url.pathname), {
			keepFocus: true,
			noScroll: true
		});
	}

	function onKeywordInput(value: string) {
		keywordDraft = value;
		clearTimeout(keywordDebounceTimer);
		keywordDebounceTimer = setTimeout(() => {
			navigate({ keyword: value.trim() || null });
		}, 300);
	}

	function setAgeMax(next: AgeMaxPreset | null) {
		ageMaxDraft = next;
		navigate({
			age_max: next,
			age: null,
			age_from: null,
			age_to: null,
			include_no_max_age: true
		});
	}

	function chipClass(selected: boolean): string {
		return selected
			? 'rounded-full border border-primary bg-primary px-2.5 py-1 text-xs text-primary-foreground'
			: 'rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted';
	}

	function commitSalaryRange(next: [number, number]) {
		salaryRange = next;
		const from = next[0] > SALARY_FILTER_MIN ? next[0] : null;
		const to = salaryMax > 0 && next[1] < salaryMax ? next[1] : null;
		navigate({
			salary_from: from,
			salary_to: to,
			min_salary: null,
			has_salary: false
		});
	}

	function setGrade(next: string | null) {
		gradeDraft = next;
		navigate({ grade: next });
	}

	function isDomicileAnySelected(): boolean {
		return (
			domicileRegionDraft.length === 0 ||
			(domicileRegionDraft.length === 1 && domicileRegionDraft[0] === 'any')
		);
	}

	function clearDomicileRegions() {
		domicileRegionDraft = [];
		navigate({ domicile_region: [], domicile: [] });
	}

	function toggleDomicileRegion(key: DomicileRegionKey) {
		if (key === 'any') {
			clearDomicileRegions();
			return;
		}

		const next = domicileRegionDraft.includes(key)
			? domicileRegionDraft.filter((k) => k !== key)
			: [...domicileRegionDraft.filter((k) => k !== 'any'), key];
		domicileRegionDraft = next;
		navigate({ domicile_region: next, domicile: [] });
	}

	function setTags(next: string[]) {
		tagsDraft = next;
		navigate({ tag: next });
	}

	function commitQualificationRange(next: [number, number]) {
		qualificationRange = next;
		const from = next[0] > QUALIFICATION_LEVEL_MIN ? next[0] : null;
		const to = next[1] < QUALIFICATION_LEVEL_MAX ? next[1] : null;
		navigate({
			qualification_from: from,
			qualification_to: to,
			qualification_level: null
		});
	}

	function clearDrawerFilters() {
		ageMaxDraft = null;
		qualificationRange = [QUALIFICATION_LEVEL_MIN, QUALIFICATION_LEVEL_MAX];
		keywordDraft = '';
		gradeDraft = null;
		domicileRegionDraft = [];
		tagsDraft = [];
		salaryRange = [SALARY_FILTER_MIN, salaryMax > 0 ? salaryMax : SALARY_FILTER_MIN];
		navigate(clearDrawerFilterPatch());
	}
</script>

<div class="space-y-5">
	<div class="space-y-2">
		<Label for="{idPrefix}filter-keyword">Keyword</Label>
		<Input
			id="{idPrefix}filter-keyword"
			type="search"
			placeholder="Search title, department, program…"
			value={keywordDraft}
			oninput={(e) => onKeywordInput(e.currentTarget.value)}
		/>
		<p class="text-xs text-muted-foreground">
			Matches job title, department, or project/program name.
		</p>
	</div>

	<Separator />

	<div class="space-y-2">
		<Label id="{idPrefix}filter-age-label">Max age</Label>
		<div class="flex flex-wrap gap-1.5">
			<button
				type="button"
				class={chipClass(ageMaxDraft == null)}
				aria-pressed={ageMaxDraft == null}
				onclick={() => setAgeMax(null)}
			>
				Any
			</button>
			{#each AGE_MAX_PRESETS as years (years)}
				<button
					type="button"
					class={chipClass(ageMaxDraft === years)}
					aria-pressed={ageMaxDraft === years}
					onclick={() => setAgeMax(years)}
				>
					{years}y
				</button>
			{/each}
			<button
				type="button"
				class={chipClass(ageMaxDraft === '60plus')}
				aria-pressed={ageMaxDraft === '60plus'}
				onclick={() => setAgeMax('60plus')}
			>
				60+
			</button>
		</div>
		<p class="text-xs text-muted-foreground">
			{#if ageMaxDraft === '60plus'}
				Jobs whose listed maximum age is 60 or above.
			{:else if ageMaxDraft}
				Jobs whose listed maximum age is {ageMaxDraft} or under.
			{:else}
				Filter by the posting’s maximum age limit.
			{/if}
		</p>
	</div>

	<Separator />

	<div class="space-y-3">
		<Label id="{idPrefix}filter-qualification-label">Qualification level</Label>
		<DualRangeSlider
			min={QUALIFICATION_LEVEL_MIN}
			max={QUALIFICATION_LEVEL_MAX}
			bind:value={qualificationRange}
			onValueCommit={commitQualificationRange}
			formatValue={formatQualificationLevel}
			loAriaLabel="Minimum qualification"
			hiAriaLabel="Maximum qualification"
		/>
		<p class="text-xs text-muted-foreground">
			{#if qualificationRange[0] > QUALIFICATION_LEVEL_MIN || qualificationRange[1] < QUALIFICATION_LEVEL_MAX}
				Jobs requiring qualification from {formatQualificationLevel(qualificationRange[0])} to {formatQualificationLevel(qualificationRange[1])}.
			{:else}
				Filter by the posting’s required qualification level.
			{/if}
		</p>
	</div>

	<Separator />

	<div class="space-y-3">
		<Label id="{idPrefix}filter-salary-label">Salary range</Label>
		{#if salaryMax > 0}
			<DualRangeSlider
				min={SALARY_FILTER_MIN}
				max={salaryMax}
				step={salaryStep}
				bind:value={salaryRange}
				onValueCommit={commitSalaryRange}
				formatValue={formatSalaryFilter}
				loAriaLabel="Minimum salary"
				hiAriaLabel="Maximum salary"
			/>
			<p class="text-xs text-muted-foreground">
				{#if salaryRange[0] <= SALARY_FILTER_MIN}
					Jobs without a listed salary are included while the minimum is Rs. 0.
				{:else}
					Only jobs with a listed salary in this range.
				{/if}
			</p>
		{:else}
			<p class="text-sm text-muted-foreground">No listed salaries to filter by.</p>
		{/if}
	</div>

	<Separator />

	<div class="space-y-2">
		<Label id="{idPrefix}filter-domicile-label">Domicile</Label>
		<div class="flex flex-wrap gap-1.5">
			<button
				type="button"
				class={chipClass(isDomicileAnySelected())}
				aria-pressed={isDomicileAnySelected()}
				onclick={clearDomicileRegions}
			>
				Any
			</button>
			{#each DOMICILE_REGIONS.filter((region) => region.key !== 'any') as region (region.key)}
				<button
					type="button"
					class={chipClass(domicileRegionDraft.includes(region.key))}
					aria-pressed={domicileRegionDraft.includes(region.key)}
					onclick={() => toggleDomicileRegion(region.key)}
				>
					{region.label}
				</button>
			{/each}
		</div>
		<p class="text-xs text-muted-foreground">
			{#if isDomicileAnySelected() && domicileRegionDraft.length === 0}
				All domicile regions included.
			{:else if isDomicileAnySelected()}
				Jobs open to any domicile.
			{:else if domicileRegionDraft.length === 1}
				Jobs open to {DOMICILE_REGIONS.find((r) => r.key === domicileRegionDraft[0])?.label}.
			{:else}
				Jobs open to {domicileRegionDraft.length} selected regions.
			{/if}
		</p>
	</div>

	<Separator />

	<div class="space-y-2">
		<Label for="{idPrefix}filter-tag">Tags</Label>
		<DropdownMenu.Root bind:open={tagOpen}>
			<DropdownMenu.Trigger
				id="{idPrefix}filter-tag"
				class="flex h-9 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
			>
				<span class="truncate">{tagTriggerLabel}</span>
				<ChevronDownIcon class="size-4 shrink-0 text-muted-foreground" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="max-h-72 w-(--bits-dropdown-menu-anchor-width) p-0" align="start">
				<div class="sticky top-0 z-10 border-b bg-popover p-2">
					<Input
						id="{idPrefix}filter-tag-search"
						type="search"
						placeholder="Search tags…"
						aria-label="Search tags"
						class="h-8"
						bind:value={tagSearch}
						onkeydown={(e) => e.stopPropagation()}
					/>
				</div>
				<DropdownMenu.CheckboxGroup value={tagsDraft} onValueChange={setTags}>
					<div class="max-h-52 overflow-y-auto p-1">
						{#each filteredTagOptions as tag (tag.slug)}
							<DropdownMenu.CheckboxItem value={tag.slug} class="whitespace-normal">
								{tag.label}
							</DropdownMenu.CheckboxItem>
						{:else}
							<p class="px-2 py-3 text-sm text-muted-foreground">No matching tags.</p>
						{/each}
					</div>
				</DropdownMenu.CheckboxGroup>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<p class="text-xs text-muted-foreground">
			Same tags as the <a href="/tags" class="underline underline-offset-2">Browse by tag</a> page.
		</p>
	</div>

	<Separator />

	<div class="space-y-2">
		<Label for="{idPrefix}filter-grade">Grade</Label>
		<Select.Root
			type="single"
			value={gradeDraft ?? ''}
			onValueChange={(v) => setGrade(v || null)}
		>
			<Select.Trigger id="{idPrefix}filter-grade" class="w-full">
				{gradeDraft ?? 'Any'}
			</Select.Trigger>
			<Select.Content class="max-h-72">
				<Select.Item value="" label="Any">Any</Select.Item>
				{#each gradeOptions as g (g)}
					<Select.Item value={g} label={g}>{g}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<Separator />

	<div class="flex flex-wrap items-center gap-2 pt-1">
		<p class="text-sm text-muted-foreground">
			{resultCount.toLocaleString()} job{resultCount === 1 ? '' : 's'}
			{#if activeCount}
				· {activeCount} filter{activeCount === 1 ? '' : 's'}
			{/if}
		</p>
		{#if activeCount}
			<Button variant="ghost" size="sm" onclick={clearDrawerFilters}>Clear</Button>
		{/if}
	</div>
</div>
