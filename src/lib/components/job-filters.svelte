<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { filtersToHref, type FilterParams, type JobSort } from '$lib/jobs-utils';

	type Options = {
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
		q: string | null;
		show_expired: boolean;
		sort: JobSort;
	};

	let {
		filters,
		options,
		resultCount
	}: {
		filters: Filters;
		options: Options;
		resultCount: number;
	} = $props();

	// Local draft for the keyword input (debounced); everything else navigates on change.
	let qDraft = $state('');
	let ageDraft = $state('');
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		qDraft = filters.q ?? '';
		ageDraft = filters.age != null ? String(filters.age) : '';
	});

	function navigate(next: Partial<Filters & { page?: number }>) {
		const merged: FilterParams = {
			degree_areas: next.degree_areas ?? filters.degree_areas,
			education_level:
				next.education_level !== undefined ? next.education_level : filters.education_level,
			grade: next.grade !== undefined ? next.grade : filters.grade,
			age: next.age !== undefined ? next.age : filters.age,
			place_of_posting:
				next.place_of_posting !== undefined ? next.place_of_posting : filters.place_of_posting,
			domicile: next.domicile !== undefined ? next.domicile : filters.domicile,
			q: next.q !== undefined ? next.q : filters.q,
			show_expired:
				next.show_expired !== undefined ? next.show_expired : filters.show_expired,
			sort: next.sort ?? filters.sort,
			page: next.page
		};
		goto(filtersToHref(merged), { keepFocus: true, noScroll: true });
	}

	function onQInput(value: string) {
		qDraft = value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			navigate({ q: value.trim() || null, page: 1 });
		}, 300);
	}

	function toggleDegree(area: string) {
		const current = filters.degree_areas;
		const exists = current.some((a) => a.toLowerCase() === area.toLowerCase());
		const next = exists
			? current.filter((a) => a.toLowerCase() !== area.toLowerCase())
			: [...current, area];
		navigate({ degree_areas: next, page: 1 });
	}

	function clearAll() {
		goto('/', { keepFocus: true });
	}

	const activeCount = $derived(
		filters.degree_areas.length +
			(filters.education_level ? 1 : 0) +
			(filters.grade ? 1 : 0) +
			(filters.age ? 1 : 0) +
			(filters.place_of_posting ? 1 : 0) +
			(filters.domicile ? 1 : 0) +
			(filters.q ? 1 : 0) +
			(filters.show_expired ? 1 : 0)
	);

	const degreeOptions = $derived(
		[...new Set([...options.degree_areas, ...options.degrees])].slice(0, 50)
	);
</script>

<div class="space-y-6">
	<section class="space-y-4 rounded-lg border border-border bg-card p-4 shadow-xs">
		<div>
			<h2 class="text-base font-semibold">Find jobs matching your background</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Filter by degree, education, grade, and age to see postings you're eligible for.
			</p>
		</div>

		<div class="space-y-2">
			<Label>Degree areas</Label>
			<div class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-input p-2">
				{#each degreeOptions as area (area)}
					{@const selected = filters.degree_areas.some(
						(a) => a.toLowerCase() === area.toLowerCase()
					)}
					<button
						type="button"
						class="rounded-full border px-2.5 py-1 text-xs transition-colors {selected
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-border bg-background hover:bg-muted'}"
						aria-pressed={selected}
						onclick={() => toggleDegree(area)}
					>
						{area}
					</button>
				{/each}
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<Label for="education_level">Education level</Label>
				<Select.Root
					type="single"
					value={filters.education_level ?? undefined}
					onValueChange={(v) => navigate({ education_level: v || null, page: 1 })}
				>
					<Select.Trigger id="education_level" class="w-full">
						{filters.education_level ?? 'Any education level'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="Any education level">Any education level</Select.Item>
						{#each options.education_levels as level (level)}
							<Select.Item value={level} label={level}>{level}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label for="grade">Grade</Label>
				<Select.Root
					type="single"
					value={filters.grade ?? undefined}
					onValueChange={(v) => navigate({ grade: v || null, page: 1 })}
				>
					<Select.Trigger id="grade" class="w-full">
						{filters.grade ?? 'Any grade'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="Any grade">Any grade</Select.Item>
						{#each options.grades as g (g)}
							<Select.Item value={g} label={g}>{g}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="space-y-2">
			<Label for="age">Your age</Label>
			<Input
				id="age"
				type="number"
				min="1"
				max="80"
				inputmode="numeric"
				placeholder="e.g. 28"
				bind:value={ageDraft}
				onblur={() => {
					const n = Number.parseInt(ageDraft, 10);
					navigate({ age: Number.isFinite(n) && n > 0 ? n : null, page: 1 });
				}}
			/>
			<p class="text-xs text-muted-foreground">
				Shows jobs whose age range includes your age (or has no age limit).
			</p>
		</div>
	</section>

	<section class="space-y-4 rounded-lg border border-dashed border-border p-4">
		<h2 class="text-sm font-semibold text-muted-foreground">Refine further</h2>

		<div class="space-y-2">
			<Label for="q">Keyword</Label>
			<Input
				id="q"
				type="search"
				placeholder="Search all fields…"
				value={qDraft}
				oninput={(e) => onQInput(e.currentTarget.value)}
			/>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<Label for="place">Place of posting</Label>
				<Select.Root
					type="single"
					value={filters.place_of_posting ?? undefined}
					onValueChange={(v) => navigate({ place_of_posting: v || null, page: 1 })}
				>
					<Select.Trigger id="place" class="w-full">
						{filters.place_of_posting ?? 'Any place'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="Any place">Any place</Select.Item>
						{#each options.places as place (place)}
							<Select.Item value={place} label={place}>{place}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label for="domicile">Domicile</Label>
				<Select.Root
					type="single"
					value={filters.domicile ?? undefined}
					onValueChange={(v) => navigate({ domicile: v || null, page: 1 })}
				>
					<Select.Trigger id="domicile" class="w-full">
						{filters.domicile ?? 'Any domicile'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="Any domicile">Any domicile</Select.Item>
						{#each options.domiciles as d (d)}
							<Select.Item value={d} label={d}>{d}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="space-y-2">
			<Label for="sort">Sort</Label>
			<Select.Root
				type="single"
				value={filters.sort}
				onValueChange={(v) =>
					navigate({ sort: v === 'closing_soon' ? 'closing_soon' : 'newest', page: 1 })}
			>
				<Select.Trigger id="sort" class="w-full">
					{filters.sort === 'closing_soon' ? 'Closing soon' : 'Newest'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="newest" label="Newest">Newest</Select.Item>
					<Select.Item value="closing_soon" label="Closing soon">Closing soon</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<label class="flex items-center gap-2 text-sm">
			<input
				type="checkbox"
				class="size-4 rounded border-input"
				checked={filters.show_expired}
				onchange={(e) => navigate({ show_expired: e.currentTarget.checked, page: 1 })}
			/>
			Show expired postings
		</label>
	</section>

	<div class="flex flex-wrap items-center gap-2">
		<p class="text-sm text-muted-foreground">
			{resultCount.toLocaleString()} result{resultCount === 1 ? '' : 's'}
			{#if activeCount}
				· {activeCount} filter{activeCount === 1 ? '' : 's'}
			{/if}
		</p>
		{#if activeCount}
			<Button variant="ghost" size="sm" onclick={clearAll}>Clear filters</Button>
		{/if}
	</div>
</div>
