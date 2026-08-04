<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let { count = 5 }: { count?: number } = $props();
</script>

<div class="space-y-4" aria-hidden="true">
	<div class="flex items-baseline justify-between gap-2">
		<Skeleton class="h-5 w-24" />
		<Skeleton class="h-4 w-28" />
	</div>
	<ul class="space-y-3">
		{#each Array(count) as _, i (i)}
			<li>
				<Card.Root>
					<Card.Header class="gap-2 pb-3">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<Skeleton class="h-5 w-3/4 max-w-md" />
							<Skeleton class="h-5 w-16 rounded-full" />
						</div>
						<Skeleton class="h-4 w-1/2 max-w-xs" />
					</Card.Header>
					<Card.Content class="space-y-3 pt-0">
						<Skeleton class="h-4 w-2/3 max-w-sm" />
						<div class="flex flex-wrap gap-1.5">
							<Skeleton class="h-5 w-20 rounded-full" />
							<Skeleton class="h-5 w-24 rounded-full" />
							<Skeleton class="h-5 w-16 rounded-full" />
						</div>
						<div class="flex flex-wrap gap-4">
							<Skeleton class="h-4 w-24" />
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-20" />
						</div>
					</Card.Content>
				</Card.Root>
			</li>
		{/each}
	</ul>
</div>
