<script lang="ts">
	import InfoIcon from '@lucide/svelte/icons/info';
	import { QUOTA_INFO_TEXT } from '$lib/profile-quota';

	let open = $state(false);
</script>

<div class="relative">
	<button
		type="button"
		class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		aria-label="Why we ask for religion and disability"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<InfoIcon class="size-4" aria-hidden="true" />
	</button>
	{#if open}
		<div
			class="absolute top-full right-0 z-10 mt-2 w-64 rounded-md border border-border bg-popover p-3 text-sm leading-relaxed text-muted-foreground shadow-md"
			role="tooltip"
		>
			{QUOTA_INFO_TEXT}
		</div>
	{/if}
</div>
