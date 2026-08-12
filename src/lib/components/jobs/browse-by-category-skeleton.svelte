<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<div class="space-y-3 lg:flex lg:h-full lg:flex-col lg:gap-3 lg:space-y-0" aria-hidden="true">
	{#each [4, 3, 4, 4, 4, 3] as count, section (section)}
		<section
			class="rounded-xl bg-sidebar p-3 shadow-xs ring-1 ring-sidebar-border lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
		>
			<Skeleton class="mx-2 h-3 w-24 shrink-0" />
			<div class="mt-1.5 max-h-40 space-y-0 overflow-hidden lg:max-h-none lg:min-h-0 lg:flex-1">
				{#each Array(count) as _, i (i)}
					<div class="flex items-center justify-between gap-2 px-2 py-1.5">
						<Skeleton class="h-4 w-28" />
						<Skeleton class="h-4 w-8" />
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>
