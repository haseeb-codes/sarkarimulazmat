<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<div class="space-y-5" aria-hidden="true">
	<div class="flex items-center justify-between gap-3">
		<div class="space-y-1">
			<Skeleton class="h-4 w-32" />
			<Skeleton class="h-3 w-40" />
		</div>
		<Skeleton class="h-6 w-11 rounded-full" />
	</div>
	<div class="space-y-2">
		<Skeleton class="h-4 w-20" />
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
	<div class="space-y-2">
		<Skeleton class="h-4 w-20" />
		<Skeleton class="h-9 w-full" />
	</div>
	<div class="space-y-2">
		<Skeleton class="h-4 w-28" />
		<div class="flex flex-wrap gap-1.5">
			{#each Array(5) as _, i (i)}
				<Skeleton class="h-7 w-14 rounded-full" />
			{/each}
		</div>
	</div>
	<div class="space-y-2">
		<Skeleton class="h-4 w-36" />
		<Skeleton class="h-9 w-full" />
	</div>
	<div class="flex flex-wrap items-center gap-x-5 gap-y-2">
		<div class="flex items-center gap-2">
			<Skeleton class="h-6 w-11 rounded-full" />
			<Skeleton class="h-4 w-20" />
		</div>
		<div class="flex items-center gap-2">
			<Skeleton class="h-6 w-11 rounded-full" />
			<Skeleton class="h-4 w-36" />
		</div>
	</div>
</div>
