<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<section class="space-y-2" aria-hidden="true">
	<Skeleton class="h-4 w-32" />
	<div class="flex flex-wrap gap-2">
		{#each Array(8) as _, i (i)}
			<Skeleton class="h-9 w-24 rounded-md" />
		{/each}
	</div>
</section>
