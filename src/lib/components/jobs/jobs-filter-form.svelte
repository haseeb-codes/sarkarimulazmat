<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import {
		DOMICILE_REGIONS,
		selectedDomicileRegions,
		type DomicileRegionKey
	} from '$lib/domicile-regions';
	import {
		AGE_MAX_PRESETS,
		QUALIFICATION_LEVELS,
		filtersToHref,
		formatQualificationLevel,
		selectedQualificationLevels,
		type AgeMaxPreset,
		type FilterParams,
		BPS_GRADE_GROUPS,
		formatGradeFilter
	} from '$lib/jobs-utils';

	type Options = {
		grades: string[];
		specializations: string[];
		salary_max: number;
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

	let ageMaxDraft = $state<AgeMaxPreset | null>(null);
	let qualificationDraft = $state<number | null>(null);
	let gradeDraft = $state<string | null>(null);
	let domicileRegionDraft = $state<DomicileRegionKey | null>(null);
	let degreeAreasDraft = $state<string[]>([]);
	let specializationSearch = $state('');
	let specializationOpen = $state(false);
	let permanentOnlyDraft = $state(false);

	const specializationOptions = $derived(options.specializations ?? []);

	$effect(() => {
		if (!specializationOpen) specializationSearch = '';
	});

	$effect(() => {
		ageMaxDraft = filters.age_max ?? null;
		gradeDraft = filters.grade ?? null;
		const regions = selectedDomicileRegions(filters).filter((key) => key !== 'any');
		domicileRegionDraft = regions[0] ?? null;
		degreeAreasDraft = [...(filters.degree_areas ?? [])];
		permanentOnlyDraft = Boolean(filters.permanent_only);
		const levels = selectedQualificationLevels(filters);
		qualificationDraft = levels.length ? levels[0]! : null;
	});

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

	function setGrade(next: string | null) {
		gradeDraft = next;
		navigate({ grade: next });
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
			<Label for="{idPrefix}filter-permanent" class="cursor-pointer">Permanent jobs only</Label>
			<p class="text-xs text-muted-foreground">Show jobs with employment type Permanent.</p>
		</div>
		<button
			id="{idPrefix}filter-permanent"
			type="button"
			role="switch"
			aria-checked={permanentOnlyDraft}
			onclick={() => setPermanentOnly(!permanentOnlyDraft)}
			class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background {permanentOnlyDraft
				? 'bg-primary'
				: 'bg-input'}"
		>
			<span
				aria-hidden="true"
				class="pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform {permanentOnlyDraft
					? 'translate-x-5'
					: 'translate-x-0'}"
			></span>
		</button>
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
		<Label for="{idPrefix}filter-domicile">Domicile</Label>
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
		<Label id="{idPrefix}filter-qualification-label">Qualification level</Label>
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
</div>
