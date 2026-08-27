<script lang="ts">
	import { onFilterLinkClick } from '$lib/filter-nav';

	let {
		tags
	}: {
		tags: { slug: string; label: string; count: number }[];
	} = $props();

	const chipClass =
		'inline-flex h-9 items-center gap-1 rounded-md border border-border bg-card px-3 text-sm transition-colors hover:bg-muted';

	function formatCount(n: number): string {
		return n.toLocaleString('en-PK');
	}
</script>

{#if tags.length}
	<section class="space-y-2" aria-labelledby="tag-chips-heading">
		<h2 id="tag-chips-heading" class="text-sm font-bold tracking-wide text-muted-foreground uppercase">
			<a href="/tags" class="hover:text-foreground">Tags</a>
		</h2>
		<ul class="flex flex-wrap gap-2">
			{#each tags as tag (tag.slug)}
				<li>
					<a
						href="/{tag.slug}"
						data-sveltekit-noscroll
						onclick={onFilterLinkClick}
						class={chipClass}
					>
						{tag.label}
						<span class="text-muted-foreground tabular-nums">({formatCount(tag.count)})</span>
					</a>
				</li>
			{/each}
			<li>
				<a href="/tags" class="{chipClass} font-medium text-primary">View all →</a>
			</li>
		</ul>
	</section>
{/if}
