<script lang="ts">
	import ForceLightMode from '$lib/components/jobs/force-light-mode.svelte';

	let { children } = $props();
</script>

<ForceLightMode>
	<div class="flex min-h-svh items-start justify-center bg-slate-100 py-0 md:py-8">
		{@render children()}
	</div>
</ForceLightMode>
