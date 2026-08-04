<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	let { children } = $props();
</script>

<!-- Default light; track={false} so OS preference does not override first visit. -->
<ModeWatcher defaultMode="light" track={false} />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-svh flex-col">
	<header class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
		<div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
			<a href="/" class="text-lg font-semibold tracking-tight text-primary">
				Sarkari Nokri
			</a>
			<nav class="flex items-center gap-1" aria-label="Site">
				<ThemeToggle />
			</nav>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">
		{@render children()}
	</main>

	<footer class="border-t border-border py-6">
		<div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
			<p>Government jobs in Pakistan — filter by your background.</p>
			<p>
				<a href="/privacy" class="hover:text-foreground hover:underline">Privacy</a>
				<span class="mx-2">·</span>
				<a href="/terms" class="hover:text-foreground hover:underline">Terms</a>
			</p>
		</div>
	</footer>
</div>
