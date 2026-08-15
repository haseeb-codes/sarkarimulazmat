<script lang="ts">
	import { page } from '$app/state';
	import { filtersToHref } from '$lib/jobs-utils';

	let {
		educationLevels
	}: {
		educationLevels: { label: string; count: number }[];
	} = $props();

	const activeEducation = $derived(page.url.searchParams.get('education_level'));

	const chipClass =
		'inline-flex h-9 items-center gap-1 rounded-md border border-border bg-card px-3 text-sm transition-colors hover:bg-muted';
	const chipActiveClass =
		'inline-flex h-9 items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary';

	function formatCount(n: number): string {
		return n.toLocaleString('en-PK');
	}
</script>

{#if educationLevels.length}
	<section class="space-y-2" aria-labelledby="education-chips-heading">
		<h2 id="education-chips-heading" class="text-sm font-bold tracking-wide text-muted-foreground uppercase">
			Education level
		</h2>
		<ul class="flex flex-wrap gap-2">
			{#each educationLevels as level (level.label)}
				<li>
					<a
						href={filtersToHref({ education_level: level.label })}
						class={activeEducation === level.label ? chipActiveClass : chipClass}
						aria-current={activeEducation === level.label ? 'page' : undefined}
					>
						{level.label}
						<span class="text-muted-foreground tabular-nums">({formatCount(level.count)})</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
