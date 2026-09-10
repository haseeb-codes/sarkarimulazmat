<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/state';
	import ShieldIcon from '@lucide/svelte/icons/shield';

	let { children } = $props();

	const isLogin = $derived(page.url.pathname.startsWith('/admin/login'));
</script>

{#if isLogin}
	{@render children()}
{:else}
	<div class="flex min-h-svh flex-col bg-background">
		<header class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
			<div class="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-3 sm:px-4">
				<div class="flex min-w-0 items-center gap-2">
					<span
						class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"
						aria-hidden="true"
					>
						<ShieldIcon class="size-4" />
					</span>
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold tracking-tight">Admin</p>
						<p class="truncate text-xs text-muted-foreground">Collected data summary</p>
					</div>
				</div>

				<div class="ml-auto flex items-center gap-2">
					<a
						href="/"
						class="hidden text-xs text-muted-foreground hover:text-foreground sm:inline"
					>
						View site
					</a>
					<ThemeToggle />
					<form method="POST" action="/admin?/logout">
						<Button type="submit" variant="outline" size="sm">Log out</Button>
					</form>
				</div>
			</div>
		</header>

		<main class="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
			{@render children()}
		</main>
	</div>
{/if}
