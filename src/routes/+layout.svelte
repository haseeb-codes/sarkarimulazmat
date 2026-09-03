<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import logo from '$lib/assets/logo.png';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { isJobCategoryShareSlug } from '$lib/job-category-pages';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import UserNavMenu from '$lib/components/user-nav-menu.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { data, children } = $props();

	/** Shareable snapshot and social-image pages — no site chrome. */
	const isShareSnapshot = $derived(isJobCategoryShareSlug(page.url.pathname.slice(1)));
	const isSocialImageRoute = $derived(page.url.pathname.startsWith('/social/'));
	const isBarePage = $derived(isShareSnapshot || isSocialImageRoute);
	const isJobsPage = $derived(
		page.route.id === '/' || page.route.id === '/[slug]' || page.route.id === '/jobs/[slug]'
	);
	const isTagsPage = $derived(page.url.pathname === '/tags');
	const isAdsPage = $derived(page.url.pathname === '/ads' || page.url.pathname.startsWith('/ad/'));
	const isAboutPage = $derived(page.url.pathname === '/about');
	const isContactPage = $derived(page.url.pathname === '/contact');
	const isSignedIn = $derived(Boolean(data.session?.user));
	const profileHref = $derived(data.profileComplete ? '/profile' : '/onboarding');
	const userName = $derived(data.profile?.name ?? data.session?.user?.name ?? null);
	const userEmail = $derived(data.profile?.email ?? data.session?.user?.email ?? null);

	let mobileNavOpen = $state(false);

	afterNavigate(() => {
		mobileNavOpen = false;
	});

	const navLinks = $derived([
		{ href: '/', label: 'Jobs', active: isJobsPage },
		{ href: '/ads', label: 'Ads', active: isAdsPage },
		{ href: '/about', label: 'About', active: isAboutPage },
		{ href: '/contact', label: 'Contact', active: isContactPage },
		{ href: '/tags', label: 'Tags', active: isTagsPage }
	]);

	function navLinkClass(active: boolean, mobile = false) {
		const base = mobile
			? 'block rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
			: 'rounded-md px-2.5 py-1 text-xs font-medium transition-colors lg:px-3 lg:py-1.5 lg:text-sm';
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

{#if isBarePage}
	{@render children()}
{:else}
	<div class="flex min-h-svh flex-col">
		<!-- One shared width shell so header / main / footer edges always match. -->
		<div class="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 sm:px-4">
			<header
				class="sticky top-0 z-40 border-b border-border bg-background"
			>
				<div class="flex h-12 w-full items-center gap-2 md:h-14 md:gap-3">
					<a
						href="/"
						class="flex min-w-0 shrink items-center gap-2 text-base font-semibold tracking-tight text-primary lg:text-lg"
					>
						<img src={logo} alt="" class="h-7 w-7 shrink-0 md:h-8 md:w-8" width="32" height="32" />
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
					</nav>

					<div class="ml-auto flex items-center gap-0.5 md:ml-0 md:gap-1">
						<UserNavMenu
							{isSignedIn}
							{profileHref}
							{userName}
							{userEmail}
						/>
						<div class="hidden border-l border-border pl-1 md:block">
							<ThemeToggle />
						</div>

						<!-- Mobile: hamburger -->
						<Button
							variant="ghost"
							size="icon"
							class="md:hidden"
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

			<!-- relative z-0 keeps page content (e.g. CSS-column cards) under the sticky header -->
			<main class="relative z-0 w-full flex-1 py-2 sm:py-4 md:py-8">
				{@render children()}
			</main>

			<footer class="border-t border-border py-4 text-sm text-muted-foreground sm:py-6">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<p>
						A unified portal for all government jobs in Pakistan — filter by age, education, gender,
						domicile, and more.
					</p>
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
