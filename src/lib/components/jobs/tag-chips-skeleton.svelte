<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<section class="space-y-2" aria-hidden="true">
	<Skeleton class="h-4 w-16" />
	<div class="flex flex-wrap gap-2">
		{#each Array(12) as _, i (i)}
			<Skeleton class="h-9 w-28 rounded-md" />
		{/each}
	</div>
</section>
