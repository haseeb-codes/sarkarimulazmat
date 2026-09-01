<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLSelectAttributes> & {
		children?: import('svelte').Snippet;
	} = $props();
</script>

<select
	bind:this={ref}
	data-slot="native-select"
	class={cn(
		'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base text-foreground shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 disabled:cursor-not-allowed disabled:opacity-50 outline-none',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</select>
