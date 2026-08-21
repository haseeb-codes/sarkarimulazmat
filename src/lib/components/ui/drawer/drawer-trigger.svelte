<script lang="ts">
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		child,
		children,
		...restProps
	}: DrawerPrimitive.TriggerProps = $props();
</script>

<DrawerPrimitive.Trigger bind:ref data-slot="drawer-trigger" {child} {...restProps}>
	{@render children?.()}
</DrawerPrimitive.Trigger>
