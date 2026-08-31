<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLLabelAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		required = false,
		children,
		...restProps
	}: WithElementRef<HTMLLabelAttributes> & { required?: boolean } = $props();
</script>

<label
	bind:this={ref}
	data-slot="label"
	class={cn(
		'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	{#if required}
		<span class="text-destructive" aria-hidden="true">*</span>
		<span class="sr-only">(required)</span>
	{/if}
</label>
