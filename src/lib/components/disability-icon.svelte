<script lang="ts">
	import PortalTooltip from '$lib/components/portal-tooltip.svelte';
	import AccessibilityIcon from '@lucide/svelte/icons/accessibility';

	let {
		show = false,
		class: className = ''
	}: {
		show?: boolean;
		class?: string;
	} = $props();
</script>

{#if show}
	<PortalTooltip
		label="Disabled"
		class="shrink-0 {className}"
	>
		<span aria-label="Disabled — persons with disabilities encouraged to apply">
			<AccessibilityIcon
				class="size-4 text-teal-600 dark:text-teal-400"
				aria-hidden="true"
			/>
		</span>
	</PortalTooltip>
{/if}
