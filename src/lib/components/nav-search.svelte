<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';

	let draft = $state('');

	$effect(() => {
		draft = page.url.searchParams.get('q') ?? '';
	});

	function listingPath(): string {
		const path = page.url.pathname;
		if (path === '/') return '/';
		if (
			path.startsWith('/jobs/') ||
			path === '/privacy' ||
			path === '/terms' ||
			path === '/about' ||
			path === '/contact'
		) {
			return '/';
		}
		return path;
	}

	function submit(event: Event) {
		event.preventDefault();
		const q = draft.trim();
		const params = new URLSearchParams(page.url.search);
		if (q) params.set('q', q);
		else params.delete('q');
		params.delete('page');

		const qs = params.toString();
		const href = qs ? `${listingPath()}?${qs}` : listingPath();
		goto(href, { keepFocus: true, noScroll: true });
	}
</script>

<form
	class="flex min-w-0 flex-1 items-center gap-1.5 md:w-80 md:flex-none"
	role="search"
	aria-label="Search jobs"
	onsubmit={submit}
>
	<div class="relative min-w-0 flex-1">
		<SearchIcon
			class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
			aria-hidden="true"
		/>
		<Input
			type="search"
			name="q"
			value={draft}
			oninput={(e) => (draft = e.currentTarget.value)}
			placeholder="Search jobs…"
			class="h-9 w-full pl-8"
			autocomplete="off"
			enterkeyhint="search"
		/>
	</div>
	<Button type="submit" size="sm" variant="secondary" class="shrink-0">
		Search
	</Button>
</form>
