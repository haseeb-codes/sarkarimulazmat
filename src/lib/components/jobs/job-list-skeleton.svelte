<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let { count = 9, showHeader = true }: { count?: number; showHeader?: boolean } = $props();

	/** Alternate block counts so the skeleton already reads as masonry. */
	const variants = [
		{ lines: 2, badges: 2 },
		{ lines: 3, badges: 4 },
		{ lines: 1, badges: 1 },
		{ lines: 2, badges: 3 },
		{ lines: 4, badges: 5 },
		{ lines: 2, badges: 2 },
		{ lines: 1, badges: 2 },
		{ lines: 3, badges: 3 },
		{ lines: 2, badges: 1 }
	] as const;
</script>

<div class="space-y-4" aria-hidden="true">
	{#if showHeader}
		<div class="flex items-baseline justify-between gap-2">
			<Skeleton class="h-5 w-24" />
			<Skeleton class="h-4 w-28" />
		</div>
	{/if}
	<ul class="columns-1 gap-3 sm:columns-2 lg:columns-3">
		{#each Array(count) as _, i (i)}
			{@const variant = variants[i % variants.length]}
			<li class="mb-3 break-inside-avoid">
				<Card.Root size="sm">
					<Card.Header class="gap-1.5 pb-2">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<Skeleton class="h-5 w-3/4 max-w-[14rem]" />
							<Skeleton class="h-5 w-14 rounded-full" />
						</div>
						<Skeleton class="h-4 w-1/2 max-w-[10rem]" />
					</Card.Header>
					<Card.Content class="space-y-2.5 pt-0">
						{#each Array(variant.lines) as __, lineIdx (lineIdx)}
							<Skeleton class="h-3.5 w-full max-w-[12rem]" />
						{/each}
						<div class="flex flex-wrap gap-1.5">
							{#each Array(variant.badges) as __, badgeIdx (badgeIdx)}
								<Skeleton class="h-5 w-16 rounded-full" />
							{/each}
						</div>
						<div class="flex flex-wrap gap-3">
							<Skeleton class="h-3.5 w-20" />
							<Skeleton class="h-3.5 w-24" />
						</div>
					</Card.Content>
				</Card.Root>
			</li>
		{/each}
	</ul>
</div>
