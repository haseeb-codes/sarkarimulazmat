<script lang="ts">
	import { browser } from '$app/environment';
	import { Portal } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		label,
		side = 'top',
		class: className = '',
		children
	}: {
		label: string;
		side?: 'top' | 'bottom';
		class?: string;
		children: Snippet;
	} = $props();

	let anchor = $state<HTMLElement | null>(null);
	let open = $state(false);
	let style = $state('');

	function position() {
		if (!anchor) return;
		const rect = anchor.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;

		if (side === 'top') {
			style = `top:${rect.top - 4}px;left:${centerX}px;transform:translate(-50%,-100%);`;
		} else {
			style = `top:${rect.bottom + 4}px;left:${centerX}px;transform:translate(-50%,0);`;
		}
	}

	function show() {
		position();
		open = true;
	}

	function hide() {
		open = false;
	}

	$effect(() => {
		if (!open || !browser) return;

		const reposition = () => position();
		window.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', reposition);

		return () => {
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', reposition);
		};
	});
</script>

<span
	bind:this={anchor}
	role="group"
	class="relative inline-flex {className}"
	onmouseenter={show}
	onmouseleave={hide}
	onfocusin={show}
	onfocusout={hide}
>
	{@render children()}
</span>

{#if browser && open}
	<Portal>
		<span
			role="tooltip"
			class="pointer-events-none fixed z-50 max-w-72 rounded-md bg-foreground px-2 py-1 text-center text-xs font-medium text-background shadow-sm"
			{style}
		>
			{label}
		</span>
	</Portal>
{/if}
