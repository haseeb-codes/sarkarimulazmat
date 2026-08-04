<script lang="ts">
	import { mode, toggleMode } from 'mode-watcher';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { Button } from '$lib/components/ui/button/index.js';

	const isDark = $derived(mode.current === 'dark');
</script>

<Button
	variant="ghost"
	size="icon"
	onclick={toggleMode}
	aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if isDark}
		<SunIcon class="size-4" />
	{:else}
		<MoonIcon class="size-4" />
	{/if}
</Button>
