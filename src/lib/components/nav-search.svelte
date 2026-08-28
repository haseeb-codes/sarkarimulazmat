<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { debounce, SEARCH_DEBOUNCE_MS } from '$lib/debounce';
	import SearchIcon from '@lucide/svelte/icons/search';

	let draft = $state('');
	let focused = $state(false);
	let pendingCommit: string | null = null;

	$effect(() => {
		const urlQ = page.url.searchParams.get('q') ?? '';

		if (pendingCommit !== null) {
			if (urlQ === pendingCommit) {
				pendingCommit = null;
				if (!focused) draft = urlQ;
			}
			return;
		}

		if (focused) return;
		draft = urlQ;
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

	function navigate(q: string | null) {
		const committed = q ?? '';
		const urlQ = page.url.searchParams.get('q') ?? '';
		if (committed === urlQ) {
			pendingCommit = null;
			return;
		}
		pendingCommit = committed;
		const params = new URLSearchParams(page.url.search);
		if (committed) params.set('q', committed);
		else params.delete('q');
		params.delete('page');

		const qs = params.toString();
		const href = qs ? `${listingPath()}?${qs}` : listingPath();
		goto(href, { keepFocus: true, noScroll: true, replaceState: true });
	}

	const scheduleCommit = debounce(
		() => navigate(draft.trim() || null),
		SEARCH_DEBOUNCE_MS
	);

	onDestroy(() => scheduleCommit.cancel());

	function submit(event: Event) {
		event.preventDefault();
		scheduleCommit.cancel();
		navigate(draft.trim() || null);
	}

	function onBlur() {
		scheduleCommit.cancel();
		navigate(draft.trim() || null);
		focused = false;
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
			bind:value={draft}
			oninput={scheduleCommit}
			onfocus={() => (focused = true)}
			onblur={onBlur}
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
