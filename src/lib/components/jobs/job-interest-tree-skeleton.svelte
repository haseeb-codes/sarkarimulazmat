<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<section class="rounded-xl bg-sidebar p-3 shadow-xs ring-1 ring-sidebar-border" aria-hidden="true">
	<div class="px-2">
		<Skeleton class="h-3 w-28" />
		<Skeleton class="mt-2 h-3 w-40" />
	</div>

	<div class="mt-3 space-y-2">
		{#each [4, 5, 4, 3, 5] as count, section (section)}
			<div class="rounded-lg border border-sidebar-border/70 bg-background/70 px-3 py-2">
				<div class="flex items-center justify-between gap-3">
					<Skeleton class="h-4 w-32" />
					<Skeleton class="h-4 w-10" />
				</div>
				<div class="mt-2 space-y-1">
					{#each Array(count) as _, i (i)}
						<div class="flex items-center justify-between gap-3 px-3 py-1.5">
							<Skeleton class="h-4 w-24" />
							<Skeleton class="h-4 w-8" />
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>
