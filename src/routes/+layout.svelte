<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import logo from '$lib/assets/logo.png';
	import { page } from '$app/state';
	import { isJobCategoryShareSlug } from '$lib/job-category-pages';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	let { children } = $props();

	/** Shareable snapshot pages — no site chrome so the full page fits one screenshot. */
	const isShareSnapshot = $derived(isJobCategoryShareSlug(page.url.pathname.slice(1)));
	const isTagsPage = $derived(page.url.pathname === '/tags');
</script>

<!-- Default light; track={false} so OS preference does not override first visit. -->
<ModeWatcher defaultMode="light" track={false} />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if isShareSnapshot}
	{@render children()}
{:else}
<div class="flex min-h-svh flex-col">
	<!-- One shared width shell so header / main / footer edges always match. -->
	<div class="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4">
		<header
			class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
		>
			<div class="flex h-14 w-full items-center gap-3">
				<a
					href="/"
					class="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-primary"
				>
					<img src={logo} alt="" class="h-8 w-8" width="32" height="32" />
					<span class="hidden sm:inline">Sarkari Mulazmat</span>
				</a>
			<div class="ml-auto flex shrink-0 items-center gap-2">
				<a
					href="/tags"
					class="shrink-0 rounded-full border px-3 py-1 text-sm font-semibold transition-colors {isTagsPage
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-primary/30 bg-primary/10 text-primary hover:border-primary/50 hover:bg-primary/20'}"
					aria-current={isTagsPage ? 'page' : undefined}
				>
					Tags
				</a>
				<nav class="flex items-center gap-1" aria-label="Site">
					<ThemeToggle />
				</nav>
			</div>
			</div>
		</header>

		<main class="w-full flex-1 py-6 md:py-8">
			{@render children()}
		</main>

		<footer class="border-t border-border py-6 text-sm text-muted-foreground">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<p>Government jobs in Pakistan — filter by your background.</p>
				<p>
					<a href="/privacy" class="hover:text-foreground hover:underline">Privacy</a>
					<span class="mx-2">·</span>
					<a href="/terms" class="hover:text-foreground hover:underline">Terms</a>
				</p>
			</div>
		</footer>
	</div>
</div>
{/if}
