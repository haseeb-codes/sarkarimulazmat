<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<div class="space-y-5" aria-hidden="true">
	<div class="space-y-2">
		<Skeleton class="h-4 w-16" />
		<Skeleton class="h-9 w-full" />
	</div>
	<div class="space-y-2">
		<Skeleton class="h-4 w-16" />
		<div class="flex flex-wrap gap-1.5">
			{#each Array(5) as _, i (i)}
				<Skeleton class="h-7 w-12 rounded-full" />
			{/each}
		</div>
	</div>
	<div class="space-y-3">
		<Skeleton class="h-4 w-24" />
		<Skeleton class="h-6 w-full" />
		<div class="flex justify-between">
			<Skeleton class="h-3 w-10" />
			<Skeleton class="h-3 w-14" />
		</div>
	</div>
	<div class="space-y-3">
		<Skeleton class="h-4 w-32" />
		<Skeleton class="h-6 w-full" />
		<div class="flex justify-between">
			<Skeleton class="h-3 w-12" />
			<Skeleton class="h-3 w-8" />
		</div>
	</div>
	<div class="space-y-2">
		<Skeleton class="h-4 w-20" />
		<div class="flex flex-wrap gap-1.5">
			{#each Array(8) as _, i (i)}
				<Skeleton class="h-7 w-16 rounded-full" />
			{/each}
		</div>
	</div>
	<div class="space-y-2">
		<Skeleton class="h-4 w-10" />
		<Skeleton class="h-9 w-full" />
	</div>
	<div class="space-y-2">
		<Skeleton class="h-4 w-12" />
		<Skeleton class="h-9 w-full" />
	</div>
</div>
