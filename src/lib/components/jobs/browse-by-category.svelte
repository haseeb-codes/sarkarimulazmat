<script lang="ts">
	import { page } from '$app/state';
	import { filtersToHref } from '$lib/jobs-utils';

	type CategoryLink = {
		slug: string;
		label: string;
		count: number;
	};

	type CountLink = {
		label: string;
		count: number;
	};

	let {
		categories,
		educationLevels
	}: {
		categories: CategoryLink[];
		educationLevels: CountLink[];
	} = $props();

	const activeEducation = $derived(page.url.searchParams.get('education_level'));
	const path = $derived(page.url.pathname);

	const chipClass =
		'inline-flex h-9 items-center gap-1 rounded-md border border-border bg-card px-3 text-sm transition-colors hover:bg-muted';
	const chipActiveClass =
		'inline-flex h-9 items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary';

	function formatCount(n: number): string {
		return n.toLocaleString('en-PK');
	}
</script>

<section class="space-y-3" aria-labelledby="browse-categories-heading">
	<h2 id="browse-categories-heading" class="text-base font-semibold">Browse by category</h2>

	{#if categories.length}
		<div class="space-y-1.5">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Topics</p>
			<ul class="flex flex-wrap gap-2">
				{#each categories as cat (cat.slug)}
					<li>
						<a
							href="/{cat.slug}"
							class={path === `/${cat.slug}` ? chipActiveClass : chipClass}
						>
							{cat.label}
							<span class="text-muted-foreground tabular-nums">({formatCount(cat.count)})</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if educationLevels.length}
		<div class="space-y-1.5">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Education level
			</p>
			<ul class="flex flex-wrap gap-2">
				{#each educationLevels as level (level.label)}
					<li>
						<a
							href={filtersToHref({ education_level: level.label })}
							class={activeEducation === level.label ? chipActiveClass : chipClass}
							aria-current={activeEducation === level.label ? 'page' : undefined}
						>
							{level.label}
							<span class="text-muted-foreground tabular-nums"
								>({formatCount(level.count)})</span
							>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>
