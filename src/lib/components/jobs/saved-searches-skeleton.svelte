<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<section
	class="space-y-3 rounded-lg border border-border bg-card p-4"
	aria-hidden="true"
>
	<div class="flex items-center justify-between gap-2">
		<Skeleton class="h-4 w-28" />
		<Skeleton class="h-8 w-32" />
	</div>
	<Skeleton class="h-4 w-full max-w-xs" />
	<div class="space-y-2">
		<Skeleton class="h-11 w-full" />
		<Skeleton class="h-11 w-full" />
	</div>
</section>
