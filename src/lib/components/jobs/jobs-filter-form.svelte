<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { debounce, SEARCH_DEBOUNCE_MS } from '$lib/debounce';
	import {
		DOMICILE_REGIONS,
		selectedDomicileRegions,
		type DomicileRegionKey
	} from '$lib/domicile-regions';
	import {
		AGE_FILTER_DEFAULT,
		AGE_FILTER_MAX,
		AGE_FILTER_MIN,
		QUALIFICATION_LEVELS,
		COLLAR_LEVELS,
		collarLevelDescription,
		enabledCollarLevels,
		filtersToHref,
		formatQualificationLevel,
		formatCollarLevel,
		isAgeFilterActive,
		resolvedUserAge,
		selectedQualificationLevels,
		type CollarLevel,
		type FilterParams,
		BPS_GRADE_GROUPS,
		formatGradeFilter,
		SHOW_COLLAR_LEVEL_FILTERS
	} from '$lib/jobs-utils';
	import InfoIcon from '@lucide/svelte/icons/info';
	type Options = {
		portals: string[];
		specializations: string[];
	};

	let {
		filters,
		options,
		idPrefix = ''
	}: {
		filters: FilterParams;
		options: Options;
		idPrefix?: string;
	} = $props();

	let ageEnabledDraft = $state(false);
	let ageSliderDraft = $state(AGE_FILTER_DEFAULT);
	let qualificationDraft = $state<number | null>(null);
	let gradeDraft = $state<string | null>(null);
	let portalDraft = $state<string | null>(null);
	let domicileRegionDraft = $state<DomicileRegionKey | null>(null);
	let degreeAreasDraft = $state<string[]>([]);
	let specializationSearch = $state('');
	let debouncedSpecializationSearch = $state('');
	let specializationOpen = $state(false);
	let permanentOnlyDraft = $state(false);
	let womenOnlyDraft = $state(false);
	let transgenderApplicableDraft = $state(false);
	let disabilityQuotaDraft = $state(false);
	let minorityQuotaDraft = $state(false);
	let showExpiredDraft = $state(false);
	let collarDraft = $state<CollarLevel[]>([...COLLAR_LEVELS]);
	let openCollarInfo = $state<CollarLevel | null>(null);

	const specializationOptions = $derived(options.specializations ?? []);

	const syncSpecializationSearch = debounce((value: string) => {
		debouncedSpecializationSearch = value;
	}, SEARCH_DEBOUNCE_MS);

	const scheduleAgeCommit = debounce((next: number) => {
		setUserAge(next);
	}, SEARCH_DEBOUNCE_MS);

	onDestroy(() => {
		syncSpecializationSearch.cancel();
		scheduleAgeCommit.cancel();
	});

	function onSpecializationSearchInput(value: string) {
		specializationSearch = value;
		syncSpecializationSearch(value);
	}

	$effect(() => {
		if (!specializationOpen) {
			specializationSearch = '';
			debouncedSpecializationSearch = '';
			syncSpecializationSearch.cancel();
		}
	});

	$effect(() => {
		ageEnabledDraft = isAgeFilterActive(filters);
		ageSliderDraft = isAgeFilterActive(filters) ? resolvedUserAge(filters) : AGE_FILTER_DEFAULT;
		gradeDraft = filters.grade ?? null;
		portalDraft = filters.portal ?? null;
		const regions = selectedDomicileRegions(filters).filter((key) => key !== 'any');
		domicileRegionDraft = regions[0] ?? null;
		degreeAreasDraft = [...(filters.degree_areas ?? [])];
		permanentOnlyDraft = Boolean(filters.permanent_only);
		womenOnlyDraft = Boolean(filters.women_only);
		transgenderApplicableDraft = Boolean(filters.transgender_applicable);
		disabilityQuotaDraft = Boolean(filters.disability_quota);
		minorityQuotaDraft = Boolean(filters.minority_quota);
		showExpiredDraft = Boolean(filters.show_expired);
		collarDraft = enabledCollarLevels(filters);
		const levels = selectedQualificationLevels(filters);
		qualificationDraft = levels.length ? levels[0]! : null;
	});

	const filteredSpecializationOptions = $derived.by(() => {
		const query = debouncedSpecializationSearch.trim().toLowerCase();
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

	function setAgeFilterEnabled(on: boolean) {
		ageEnabledDraft = on;
		if (on) {
			navigate({
				age: ageSliderDraft,
				age_max: null,
				age_from: null,
				age_to: null,
				include_no_max_age: true
			});
		} else {
			navigate({
				age: null,
				age_max: null,
				age_from: null,
				age_to: null,
				include_no_max_age: true
			});
		}
	}

	function setUserAge(next: number) {
		const age = Math.min(AGE_FILTER_MAX, Math.max(AGE_FILTER_MIN, Math.round(next)));
		ageSliderDraft = age;
		if (!ageEnabledDraft) return;
		navigate({
			age,
			age_max: null,
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

	function setGrade(next: string | null) {
		gradeDraft = next;
		navigate({ grade: next });
	}

	function setPortal(next: string | null) {
		portalDraft = next;
		navigate({ portal: next });
	}

	function setDomicileRegion(next: string | null) {
		if (!next || next === 'any') {
			domicileRegionDraft = null;
			navigate({ domicile_region: [], domicile: [] });
			return;
		}
		domicileRegionDraft = next as DomicileRegionKey;
		navigate({ domicile_region: [next], domicile: [] });
	}

	function setDegreeAreas(next: string[]) {
		degreeAreasDraft = next;
		navigate({ degree_areas: next });
	}

	function setPermanentOnly(next: boolean) {
		permanentOnlyDraft = next;
		navigate({ permanent_only: next });
	}

	function setWomenOnly(next: boolean) {
		womenOnlyDraft = next;
		navigate({ women_only: next });
	}

	function setTransgenderApplicable(next: boolean) {
		transgenderApplicableDraft = next;
		navigate({ transgender_applicable: next });
	}

	function setDisabilityQuota(next: boolean) {
		disabilityQuotaDraft = next;
		navigate({ disability_quota: next });
	}

	function setMinorityQuota(next: boolean) {
		minorityQuotaDraft = next;
		navigate({ minority_quota: next });
	}

	function setShowExpired(next: boolean) {
		showExpiredDraft = next;
		navigate({ show_expired: next });
	}

	function setCollarEnabled(level: CollarLevel, on: boolean) {
		const next = new Set(collarDraft);
		if (on) next.add(level);
		else next.delete(level);
		// Keep at least one level on so results stay meaningful.
		if (next.size === 0) return;
		const enabled = COLLAR_LEVELS.filter((l) => next.has(l));
		collarDraft = enabled;
		navigate({
			collar: enabled.length === COLLAR_LEVELS.length ? [] : enabled
		});
	}

	function toggleCollarInfo(level: CollarLevel, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		openCollarInfo = openCollarInfo === level ? null : level;
	}

	function switchClass(on: boolean): string {
		return `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
			on ? 'bg-primary' : 'bg-input'
		}`;
	}

	function switchThumbClass(on: boolean): string {
		return `pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
			on ? 'translate-x-5' : 'translate-x-0'
		}`;
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
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between gap-3">
		<div class="min-w-0 space-y-0.5">
			<Label for="{idPrefix}filter-permanent" class="cursor-pointer text-xs lg:text-sm"
				>Permanent jobs only</Label
			>
			<p class="text-xs text-muted-foreground">Show jobs with employment type Permanent.</p>
		</div>
		<button
			id="{idPrefix}filter-permanent"
			type="button"
			role="switch"
			aria-label="Permanent jobs only"
			aria-checked={permanentOnlyDraft}
			onclick={() => setPermanentOnly(!permanentOnlyDraft)}
			class={switchClass(permanentOnlyDraft)}
		>
			<span aria-hidden="true" class={switchThumbClass(permanentOnlyDraft)}></span>
		</button>
	</div>

	<Separator />

	<div class="space-y-2">
		<Label for="{idPrefix}filter-grade" class="text-xs lg:text-sm">BPS grade</Label>
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

	<div class="space-y-3">
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0 space-y-0.5">
				<Label for="{idPrefix}filter-age-toggle" class="cursor-pointer text-xs lg:text-sm"
					>Filter by age</Label
				>
				<p class="text-xs text-muted-foreground">
					Show jobs with no age limit, or where you meet the posting’s age requirements.
				</p>
			</div>
			<button
				id="{idPrefix}filter-age-toggle"
				type="button"
				role="switch"
				aria-label="Filter by age"
				aria-checked={ageEnabledDraft}
				onclick={() => setAgeFilterEnabled(!ageEnabledDraft)}
				class={switchClass(ageEnabledDraft)}
			>
				<span aria-hidden="true" class={switchThumbClass(ageEnabledDraft)}></span>
			</button>
		</div>

		{#if ageEnabledDraft}
			<div class="space-y-2">
				<div class="flex items-center justify-between gap-2 text-xs lg:text-sm">
					<Label for="{idPrefix}filter-age-slider" class="text-xs lg:text-sm">Your age</Label>
					<span class="font-medium tabular-nums">{ageSliderDraft}</span>
				</div>
				<input
					id="{idPrefix}filter-age-slider"
					type="range"
					min={AGE_FILTER_MIN}
					max={AGE_FILTER_MAX}
					step="1"
					value={ageSliderDraft}
					aria-valuemin={AGE_FILTER_MIN}
					aria-valuemax={AGE_FILTER_MAX}
					aria-valuenow={ageSliderDraft}
					class="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
					oninput={(e) => {
						const age = Number(e.currentTarget.value);
						ageSliderDraft = age;
						scheduleAgeCommit(age);
					}}
					onchange={(e) => {
						scheduleAgeCommit.cancel();
						setUserAge(Number(e.currentTarget.value));
					}}
				/>
				<div class="flex justify-between text-xs text-muted-foreground tabular-nums">
					<span>{AGE_FILTER_MIN}</span>
					<span>{AGE_FILTER_MAX}</span>
				</div>
			</div>
		{/if}
	</div>

	<Separator />

	<div class="space-y-2">
		<Label for="{idPrefix}filter-domicile" class="text-xs lg:text-sm">Domicile</Label>
		<Select.Root
			type="single"
			value={domicileRegionDraft ?? ''}
			onValueChange={(v) => setDomicileRegion(v || null)}
		>
			<Select.Trigger id="{idPrefix}filter-domicile" class="w-full">
				{DOMICILE_REGIONS.find((r) => r.key === domicileRegionDraft)?.label ?? 'Any'}
			</Select.Trigger>
			<Select.Content class="max-h-72">
				<Select.Item value="" label="Any">Any</Select.Item>
				{#each DOMICILE_REGIONS.filter((region) => region.key !== 'any') as region (region.key)}
					<Select.Item value={region.key} label={region.label}>{region.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<Separator />

	<div class="space-y-2">
		<Label for="{idPrefix}filter-portal" class="text-xs lg:text-sm">Job Portal</Label>
		<Select.Root
			type="single"
			value={portalDraft ?? ''}
			onValueChange={(v) => setPortal(v || null)}
		>
			<Select.Trigger id="{idPrefix}filter-portal" class="w-full min-w-0 text-left">
				<span class="min-w-0 flex-1 truncate text-left">{portalDraft ?? 'Any'}</span>
			</Select.Trigger>
			<Select.Content class="max-h-72 w-(--bits-select-anchor-width)">
				<Select.Item value="" label="Any">Any</Select.Item>
				{#each options.portals as portal (portal)}
					<Select.Item value={portal} label={portal}>{portal}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<p class="text-xs text-muted-foreground">
			Match the selected portal against the posting source title.
		</p>
	</div>

	<Separator />

	<div class="space-y-2">
		<Label id="{idPrefix}filter-qualification-label" class="text-xs lg:text-sm"
			>Qualification level</Label
		>
		<div
			class="flex flex-wrap gap-1.5"
			role="group"
			aria-labelledby="{idPrefix}filter-qualification-label"
		>
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

	<div class="space-y-2">
		<Label for="{idPrefix}filter-specialization" class="text-xs lg:text-sm"
			>Degree specialization</Label
		>
		<DropdownMenu.Root bind:open={specializationOpen}>
			<DropdownMenu.Trigger
				id="{idPrefix}filter-specialization"
				class="flex h-9 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:text-sm dark:bg-input/30"
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
						value={specializationSearch}
						oninput={(e) => onSpecializationSearchInput(e.currentTarget.value)}
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
			Filter by degree or degree area listed on the posting.
		</p>
	</div>

	{#if SHOW_COLLAR_LEVEL_FILTERS}
		<Separator />

		<div class="space-y-2">
			<Label id="{idPrefix}filter-level-label" class="text-xs lg:text-sm">Level</Label>
			<div
				class="flex flex-wrap items-center gap-x-5 gap-y-2"
				role="group"
				aria-labelledby="{idPrefix}filter-level-label"
			>
				{#each COLLAR_LEVELS as level (level)}
					{@const on = collarDraft.includes(level)}
					{@const infoOpen = openCollarInfo === level}
					<div class="flex items-center gap-2">
						<button
							id="{idPrefix}filter-collar-{level}"
							type="button"
							role="switch"
							aria-label={formatCollarLevel(level)}
							aria-checked={on}
							onclick={() => setCollarEnabled(level, !on)}
							class={switchClass(on)}
						>
							<span aria-hidden="true" class={switchThumbClass(on)}></span>
						</button>
						<Label
							for="{idPrefix}filter-collar-{level}"
							class="cursor-pointer text-xs font-normal lg:text-sm"
						>
							{formatCollarLevel(level)}
						</Label>
						<span class="group relative inline-flex">
							<button
								type="button"
								class="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								aria-label="About {formatCollarLevel(level)}"
								aria-expanded={infoOpen}
								aria-controls="{idPrefix}collar-info-{level}"
								onclick={(e) => toggleCollarInfo(level, e)}
								onblur={() => {
									if (openCollarInfo === level) openCollarInfo = null;
								}}
							>
								<InfoIcon class="size-3.5" aria-hidden="true" />
							</button>
							<span
								id="{idPrefix}collar-info-{level}"
								role="tooltip"
								class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-52 -translate-x-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-left text-xs leading-snug font-normal text-background shadow-sm transition-opacity {infoOpen
									? 'opacity-100'
									: 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}"
							>
								{collarLevelDescription(level)}
							</span>
						</span>
					</div>
				{/each}
			</div>
			<p class="text-xs text-muted-foreground">
				{#if collarDraft.length === COLLAR_LEVELS.length}
					All job levels included.
				{:else}
					Showing {collarDraft.map(formatCollarLevel).join(', ')}.
				{/if}
			</p>
		</div>
	{/if}

	<Separator />

	<div class="flex flex-wrap items-center gap-x-5 gap-y-2">
		<div class="flex items-center gap-2">
			<button
				id="{idPrefix}filter-women"
				type="button"
				role="switch"
				aria-label="Women"
				aria-checked={womenOnlyDraft}
				onclick={() => setWomenOnly(!womenOnlyDraft)}
				class={switchClass(womenOnlyDraft)}
			>
				<span aria-hidden="true" class={switchThumbClass(womenOnlyDraft)}></span>
			</button>
			<Label for="{idPrefix}filter-women" class="cursor-pointer text-xs font-normal lg:text-sm">
				Women
			</Label>
		</div>
		<div class="flex items-center gap-2">
			<button
				id="{idPrefix}filter-transgender"
				type="button"
				role="switch"
				aria-label="Transgender"
				aria-checked={transgenderApplicableDraft}
				onclick={() => setTransgenderApplicable(!transgenderApplicableDraft)}
				class={switchClass(transgenderApplicableDraft)}
			>
				<span aria-hidden="true" class={switchThumbClass(transgenderApplicableDraft)}></span>
			</button>
			<Label for="{idPrefix}filter-transgender" class="cursor-pointer text-xs font-normal lg:text-sm">
				Transgender
			</Label>
		</div>
		<div class="flex items-center gap-2">
			<button
				id="{idPrefix}filter-minority"
				type="button"
				role="switch"
				aria-label="Minority"
				aria-checked={minorityQuotaDraft}
				onclick={() => setMinorityQuota(!minorityQuotaDraft)}
				class={switchClass(minorityQuotaDraft)}
			>
				<span aria-hidden="true" class={switchThumbClass(minorityQuotaDraft)}></span>
			</button>
			<Label for="{idPrefix}filter-minority" class="cursor-pointer text-xs font-normal lg:text-sm">
				Minority
			</Label>
		</div>
		<div class="flex items-center gap-2">
			<button
				id="{idPrefix}filter-disability"
				type="button"
				role="switch"
				aria-label="Disability"
				aria-checked={disabilityQuotaDraft}
				onclick={() => setDisabilityQuota(!disabilityQuotaDraft)}
				class={switchClass(disabilityQuotaDraft)}
			>
				<span aria-hidden="true" class={switchThumbClass(disabilityQuotaDraft)}></span>
			</button>
			<Label for="{idPrefix}filter-disability" class="cursor-pointer text-xs font-normal lg:text-sm">
				Disability
			</Label>
		</div>
	</div>

	<Separator />

	<div class="flex items-center justify-between gap-3">
		<div class="min-w-0 space-y-0.5">
			<Label for="{idPrefix}filter-show-expired" class="cursor-pointer text-xs lg:text-sm"
				>Include Expired Job</Label
			>
			<p class="text-xs text-muted-foreground">
				When off, only active jobs are listed. Turn on to include inactive postings too.
			</p>
		</div>
		<button
			id="{idPrefix}filter-show-expired"
			type="button"
			role="switch"
			aria-label="Include Expired Job"
			aria-checked={showExpiredDraft}
			onclick={() => setShowExpired(!showExpiredDraft)}
			class={switchClass(showExpiredDraft)}
		>
			<span aria-hidden="true" class={switchThumbClass(showExpiredDraft)}></span>
		</button>
	</div>
</div>
