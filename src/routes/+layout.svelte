<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import logo from '$lib/assets/logo.png';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { isJobCategoryShareSlug } from '$lib/job-category-pages';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();

	/** Shareable snapshot pages — no site chrome so the full page fits one screenshot. */
	const isShareSnapshot = $derived(isJobCategoryShareSlug(page.url.pathname.slice(1)));
	const isTagsPage = $derived(page.url.pathname === '/tags');
	const isAboutPage = $derived(page.url.pathname === '/about');
	const isContactPage = $derived(page.url.pathname === '/contact');

	let mobileNavOpen = $state(false);

	afterNavigate(() => {
		mobileNavOpen = false;
	});

	const navLinks = $derived([
		{ href: '/about', label: 'About', active: isAboutPage },
		{ href: '/contact', label: 'Contact', active: isContactPage },
		{ href: '/tags', label: 'Tags', active: isTagsPage }
	]);

	function navLinkClass(active: boolean, mobile = false) {
		const base = mobile
			? 'block rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
			: 'rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
		return active
			? `${base} bg-primary/10 text-primary`
			: `${base} text-muted-foreground hover:bg-muted hover:text-foreground`;
	}
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
						class="flex min-w-0 shrink items-center gap-2 text-base font-semibold tracking-tight text-primary sm:text-lg"
					>
						<img src={logo} alt="" class="h-8 w-8 shrink-0" width="32" height="32" />
						<span class="truncate">Sarkari Mulazmat</span>
					</a>

					<!-- Desktop nav -->
					<nav class="ml-auto hidden items-center gap-1 md:flex" aria-label="Site">
						{#each navLinks as link (link.href)}
							<a
								href={link.href}
								class={navLinkClass(link.active)}
								aria-current={link.active ? 'page' : undefined}
							>
								{link.label}
							</a>
						{/each}
						<div class="ml-1 border-l border-border pl-1">
							<ThemeToggle />
						</div>
					</nav>

					<!-- Mobile: hamburger -->
					<div class="ml-auto flex items-center md:hidden">
						<Button
							variant="ghost"
							size="icon"
							onclick={() => (mobileNavOpen = !mobileNavOpen)}
							aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
							aria-expanded={mobileNavOpen}
							aria-controls="mobile-nav"
						>
							{#if mobileNavOpen}
								<XIcon class="size-5" />
							{:else}
								<MenuIcon class="size-5" />
							{/if}
						</Button>
					</div>
				</div>

				{#if mobileNavOpen}
					<nav
						id="mobile-nav"
						class="border-t border-border py-2 md:hidden"
						aria-label="Site"
					>
						{#each navLinks as link (link.href)}
							<a
								href={link.href}
								class={navLinkClass(link.active, true)}
								aria-current={link.active ? 'page' : undefined}
							>
								{link.label}
							</a>
						{/each}
						<div class="mt-1 flex items-center justify-between rounded-md px-3 py-2">
							<span class="text-sm font-medium text-muted-foreground">Theme</span>
							<ThemeToggle />
						</div>
					</nav>
				{/if}
			</header>

			<main class="w-full flex-1 py-6 md:py-8">
				{@render children()}
			</main>

			<footer class="border-t border-border py-6 text-sm text-muted-foreground">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<p>Government jobs in Pakistan — filter by your background.</p>
					<p>
						<a href="/about" class="hover:text-foreground hover:underline">About</a>
						<span class="mx-2">·</span>
						<a href="/contact" class="hover:text-foreground hover:underline">Contact</a>
						<span class="mx-2">·</span>
						<a href="/privacy" class="hover:text-foreground hover:underline">Privacy</a>
						<span class="mx-2">·</span>
						<a href="/terms" class="hover:text-foreground hover:underline">Terms</a>
					</p>
				</div>
			</footer>
		</div>
	</div>
{/if}
