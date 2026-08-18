<script lang="ts">
	import { page } from '$app/state';
	import { filtersToHref } from '$lib/jobs-utils';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';

	type InterestLeaf = {
		label: string;
		count: number;
		degree_areas?: string[];
		q?: string;
	};

	type InterestBranch = {
		label: string;
		count: number;
		children: InterestLeaf[];
	};

	let {
		tree
	}: {
		tree: InterestBranch[];
	} = $props();

	const activeDegreeAreas = $derived(
		page.url.searchParams
			.getAll('degree_areas')
			.flatMap((value) => value.split(',').map((part) => part.trim().toLowerCase()))
			.filter(Boolean)
	);
	const activeQuery = $derived(page.url.searchParams.get('q')?.trim().toLowerCase() ?? '');

	function formatCount(value: number): string {
		return value.toLocaleString('en-PK');
	}

	function isLeafActive(leaf: InterestLeaf): boolean {
		if (leaf.q) {
			return activeQuery === leaf.q.trim().toLowerCase();
		}
		if (!leaf.degree_areas?.length) return false;
		return leaf.degree_areas.some((area) => activeDegreeAreas.includes(area.toLowerCase()));
	}

	function isBranchActive(branch: InterestBranch): boolean {
		return branch.children.some((leaf) => isLeafActive(leaf));
	}
</script>

<section
	class="rounded-xl bg-sidebar p-3 text-sidebar-foreground shadow-xs ring-1 ring-sidebar-border"
	aria-labelledby="job-interest-tree-heading"
>
	<div class="px-2">
		<h2 id="job-interest-tree-heading" class="text-xs font-bold tracking-wide text-muted-foreground uppercase">
			Browse by interest
		</h2>
		<p class="mt-1 text-xs text-muted-foreground">
			Open a category and jump straight to jobs that match your background.
		</p>
	</div>

	<div class="mt-3 max-h-[calc(100svh-10rem)] space-y-1 overflow-y-auto overscroll-contain pr-1">
		{#each tree as branch (branch.label)}
			{@const branchActive = isBranchActive(branch)}
			<details
				class="group rounded-lg border border-sidebar-border/70 bg-background/70"
				open={branchActive}
			>
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sidebar-accent [&::-webkit-details-marker]:hidden"
				>
					<span class="flex min-w-0 flex-1 items-center gap-2">
						<span
							class="inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground"
							aria-hidden="true"
						>
							<PlusIcon class="size-3 group-open:hidden" />
							<MinusIcon class="hidden size-3 group-open:block" />
						</span>
						<span class="min-w-0 truncate">{branch.label}</span>
					</span>
					<span class="shrink-0 text-xs text-muted-foreground">({formatCount(branch.count)})</span>
				</summary>

				<ul class="space-y-1 px-2 pb-2">
					{#each branch.children as leaf (branch.label + ':' + leaf.label)}
						{@const active = isLeafActive(leaf)}
						<li>
							<a
								href={filtersToHref({
									degree_areas: leaf.degree_areas ?? [],
									q: leaf.q ?? null
								})}
								class={active
									? 'flex items-center justify-between gap-3 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary'
									: 'flex items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm hover:bg-sidebar-accent'}
								aria-current={active ? 'page' : undefined}
							>
								<span class="min-w-0 truncate text-left">{leaf.label}</span>
								<span class="shrink-0 text-xs text-muted-foreground"
									>({formatCount(leaf.count)})</span
								>
							</a>
						</li>
					{/each}
				</ul>
			</details>
		{/each}
	</div>
</section>
