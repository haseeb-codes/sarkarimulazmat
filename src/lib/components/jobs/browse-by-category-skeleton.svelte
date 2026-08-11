<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<section class="space-y-3" aria-hidden="true">
	<Skeleton class="h-5 w-44" />
	{#each Array(2) as _, row (row)}
		<div class="space-y-1.5">
			<Skeleton class="h-3 w-24" />
			<div class="flex flex-wrap gap-2">
				{#each Array(row === 0 ? 6 : 5) as __, i (i)}
					<Skeleton class="h-9 w-24 rounded-md" />
				{/each}
			</div>
		</div>
	{/each}
</section>
