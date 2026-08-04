<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<div class="space-y-6" aria-hidden="true">
	<section class="space-y-4 rounded-lg border border-border bg-card p-4 shadow-xs">
		<div class="space-y-2">
			<Skeleton class="h-5 w-56" />
			<Skeleton class="h-4 w-full max-w-xs" />
		</div>
		<div class="space-y-2">
			<Skeleton class="h-4 w-24" />
			<div class="flex flex-wrap gap-1.5 rounded-md border border-input p-2">
				{#each Array(8) as _, i (i)}
					<Skeleton class="h-7 w-20 rounded-full" />
				{/each}
			</div>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<Skeleton class="h-4 w-28" />
				<Skeleton class="h-9 w-full" />
			</div>
			<div class="space-y-2">
				<Skeleton class="h-4 w-16" />
				<Skeleton class="h-9 w-full" />
			</div>
		</div>
		<div class="space-y-2">
			<Skeleton class="h-4 w-16" />
			<Skeleton class="h-9 w-full" />
		</div>
	</section>
	<section class="space-y-4 rounded-lg border border-dashed border-border p-4">
		<Skeleton class="h-4 w-24" />
		<Skeleton class="h-9 w-full" />
		<div class="grid gap-4 sm:grid-cols-2">
			<Skeleton class="h-9 w-full" />
			<Skeleton class="h-9 w-full" />
		</div>
		<Skeleton class="h-9 w-full" />
	</section>
</div>
