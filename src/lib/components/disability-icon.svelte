<script lang="ts">
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
	<span
		class="group relative inline-flex shrink-0 {className}"
		aria-label="Disability quota — persons with disabilities encouraged to apply"
		title="Disability quota"
	>
		<span
			class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
			role="tooltip"
		>
			Disability quota
		</span>
		<AccessibilityIcon
			class="size-4 text-teal-600 dark:text-teal-400"
			aria-hidden="true"
		/>
	</span>
{/if}
