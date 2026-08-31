<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<section class="space-y-1.5" aria-hidden="true">
	<Skeleton class="h-3 w-12" />
	<div class="flex flex-wrap gap-1.5">
		{#each Array(9) as _, i (i)}
			<Skeleton class="h-7 w-24 rounded-md" />
		{/each}
	</div>
</section>
