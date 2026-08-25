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
		QUALIFICATION_LEVELS,
		SALARY_FILTER_MIN,
		clearDrawerFilterPatch,
		drawerFilterActiveCount,
		filtersToHref,
		formatQualificationLevel,
		formatSalaryFilter,
		selectedQualificationLevels,
		resolvedSalaryFrom,
		resolvedSalaryTo,
		selectedTags,
		type AgeMaxPreset,
		type FilterParams,
		BPS_GRADE_GROUPS,
		formatGradeFilter} from '$lib/jobs-utils';

	type Options = {
		grades: string[];
		specializations: string[];
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
	let qualificationDraft = $state<number | null>(null);
	let tagSearch = $state('');
	let tagOpen = $state(false);
	let gradeDraft = $state<string | null>(null);
	let domicileRegionDraft = $state<DomicileRegionKey[]>([]);
	let tagsDraft = $state<string[]>([]);
	let degreeAreasDraft = $state<string[]>([]);
	let specializationSearch = $state('');
	let specializationOpen = $state(false);

	const tagOptions = $derived(getJobCategoryTags());
	const specializationOptions = $derived(options.specializations ?? []);

	$effect(() => {
		if (!tagOpen) tagSearch = '';
	});

	$effect(() => {
		if (!specializationOpen) specializationSearch = '';
	});

	$effect(() => {
		ageMaxDraft = filters.age_max ?? null;
		gradeDraft = filters.grade ?? null;
		domicileRegionDraft = selectedDomicileRegions(filters);
		tagsDraft = selectedTags(filters);
		degreeAreasDraft = [...(filters.degree_areas ?? [])];
		const levels = selectedQualificationLevels(filters);
		qualificationDraft = levels.length ? levels[0]! : null;
		salaryRange = [resolvedSalaryFrom(filters), resolvedSalaryTo(filters, salaryMax)];
	});

	const optimisticFilters = $derived({
		...filters,
		age_max: ageMaxDraft,
		age_from: null,
		age_to: null,
		age: null,
		include_no_max_age: true,
		qualification: qualificationDraft == null ? [] : [qualificationDraft],
		qualification_from: null,
		qualification_to: null,
		qualification_level: null,
		grade: gradeDraft,
		degree_areas: degreeAreasDraft,
		domicile: [],
		domicile_region: domicileRegionDraft,
		tag: tagsDraft,
		salary_from: salaryRange[0] > SALARY_FILTER_MIN ? salaryRange[0] : null,
		salary_to: salaryMax > 0 && salaryRange[1] < salaryMax ? salaryRange[1] : null,
		min_salary: null,
		has_salary: false
	} satisfies FilterParams);

	const activeCount = $derived(drawerFilterActiveCount(optimisticFilters, salaryMax));


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

	const filteredSpecializationOptions = $derived.by(() => {
		const query = specializationSearch.trim().toLowerCase();
		const selected = new Set(degreeAreasDraft.map((v) => v.toLowerCase()));
		const base = new Map<string, string>();
		for (const label of specializationOptions) {
			base.set(label.toLowerCase(), label);
		}
		for (const label of degreeAreasDraft) {
			const key = label.toLowerCase();
			if (!base.has(key)) base.set(key, label);
		}
		const all = [...base.values()].sort((a, b) =>
			a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })
		);
		if (!query) return all;
		return all.filter(
			(label) => selected.has(label.toLowerCase()) || label.toLowerCase().includes(query)
		);
	});

	const specializationTriggerLabel = $derived(
		degreeAreasDraft.length === 0
			? 'Any specialization'
			: degreeAreasDraft.length === 1
				? degreeAreasDraft[0]
				: `${degreeAreasDraft.length} selected`
	);

	function navigate(patch: Partial<FilterParams>) {
		goto(filtersToHref({ ...filters, ...patch, page: 1 }, page.url.pathname), {
			keepFocus: true,
			noScroll: true
		});
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

	function setDegreeAreas(next: string[]) {
		degreeAreasDraft = next;
		navigate({ degree_areas: next });
	}

	function setQualification(next: number | null) {
		qualificationDraft = next;
		navigate({
			qualification: next == null ? [] : [next],
			qualification_from: null,
			qualification_to: null,
			qualification_level: null
		});
	}

	function clearDrawerFilters() {
		ageMaxDraft = null;
		qualificationDraft = null;
		gradeDraft = null;
		degreeAreasDraft = [];
		domicileRegionDraft = [];
		tagsDraft = [];
		salaryRange = [SALARY_FILTER_MIN, salaryMax > 0 ? salaryMax : SALARY_FILTER_MIN];
		navigate(clearDrawerFilterPatch());
	}
</script>

<div class="space-y-5">
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

	<div class="space-y-2">
		<Label id="{idPrefix}filter-qualification-label">Qualification level</Label>
		<div class="flex flex-wrap gap-1.5" role="group" aria-labelledby="{idPrefix}filter-qualification-label">
			<button
				type="button"
				class={chipClass(qualificationDraft == null)}
				aria-pressed={qualificationDraft == null}
				onclick={() => setQualification(null)}
			>
				Any
			</button>
			{#each QUALIFICATION_LEVELS as level (level)}
				<button
					type="button"
					class={chipClass(qualificationDraft === level)}
					aria-pressed={qualificationDraft === level}
					onclick={() => setQualification(level)}
				>
					{formatQualificationLevel(level)}
				</button>
			{/each}
		</div>
		<p class="text-xs text-muted-foreground">
			{#if qualificationDraft == null}
				All qualification levels included.
			{:else}
				Jobs requiring {formatQualificationLevel(qualificationDraft)}.
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
		<Label for="{idPrefix}filter-specialization">Degree specialization</Label>
		<DropdownMenu.Root bind:open={specializationOpen}>
			<DropdownMenu.Trigger
				id="{idPrefix}filter-specialization"
				class="flex h-9 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
			>
				<span class="truncate">{specializationTriggerLabel}</span>
				<ChevronDownIcon class="size-4 shrink-0 text-muted-foreground" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="max-h-72 w-(--bits-dropdown-menu-anchor-width) p-0" align="start">
				<div class="sticky top-0 z-10 border-b bg-popover p-2">
					<Input
						id="{idPrefix}filter-specialization-search"
						type="search"
						placeholder="Search specializations..."
						aria-label="Search degree specializations"
						class="h-8"
						bind:value={specializationSearch}
						onkeydown={(e) => e.stopPropagation()}
					/>
				</div>
				<DropdownMenu.CheckboxGroup value={degreeAreasDraft} onValueChange={setDegreeAreas}>
					<div class="max-h-52 overflow-y-auto p-1">
						{#each filteredSpecializationOptions as label (label)}
							<DropdownMenu.CheckboxItem value={label} class="whitespace-normal">
								{label}
							</DropdownMenu.CheckboxItem>
						{:else}
							<p class="px-2 py-3 text-sm text-muted-foreground">No matching specializations.</p>
						{/each}
					</div>
				</DropdownMenu.CheckboxGroup>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<p class="text-xs text-muted-foreground">
			All unique degree specializations from current job postings.
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
		<Label for="{idPrefix}filter-grade">BPS grade</Label>
		<Select.Root
			type="single"
			value={gradeDraft ?? ''}
			onValueChange={(v) => setGrade(v || null)}
		>
			<Select.Trigger id="{idPrefix}filter-grade" class="w-full">
				{formatGradeFilter(gradeDraft) ?? 'Any'}
			</Select.Trigger>
			<Select.Content class="max-h-72">
				<Select.Item value="" label="Any">Any</Select.Item>
				{#each BPS_GRADE_GROUPS as group (group.key)}
					<Select.Item value={group.key} label={group.label}>{group.label}</Select.Item>
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
