<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { debounce, SEARCH_DEBOUNCE_MS } from '$lib/debounce';
	import { filtersToHref, type FilterParams } from '$lib/jobs-utils';
	import SearchIcon from '@lucide/svelte/icons/search';

	let { filters }: { filters: FilterParams } = $props();

	let draft = $state('');
	let focused = $state(false);
	/** Trimmed q we navigated to; blocks stale/in-flight URL sync from wiping the input. */
	let pendingCommit: string | null = null;

	$effect(() => {
		const urlQ = filters.q ?? '';

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

	const scheduleCommit = debounce(
		() => navigate(draft.trim() || null),
		SEARCH_DEBOUNCE_MS
	);

	onDestroy(() => scheduleCommit.cancel());

	function navigate(q: string | null) {
		const committed = q ?? '';
		if (committed === (filters.q ?? '')) {
			pendingCommit = null;
			return;
		}
		pendingCommit = committed;
		goto(filtersToHref({ ...filters, q, page: 1 }, page.url.pathname), {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	function commitNow(event?: Event) {
		event?.preventDefault();
		scheduleCommit.cancel();
		navigate(draft.trim() || null);
	}

	function onFocus() {
		focused = true;
	}

	function onBlur() {
		scheduleCommit.cancel();
		navigate(draft.trim() || null);
		focused = false;
	}
</script>

<form
	class="flex h-9 overflow-hidden rounded-md border border-border bg-background shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/50 lg:h-10 lg:rounded-lg lg:border-2 lg:focus-within:ring-3 xl:h-12"
	role="search"
	aria-label="Search jobs"
	onsubmit={commitNow}
>
	<label for="jobs-search" class="sr-only">Search jobs</label>
	<Input
		id="jobs-search"
		type="search"
		name="q"
		bind:value={draft}
		oninput={scheduleCommit}
		onfocus={onFocus}
		onblur={onBlur}
		placeholder="Title, department, grade, donor, degree…"
		class="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 lg:px-3 xl:px-4"
		autocomplete="off"
		enterkeyhint="search"
	/>
	<Button
		type="submit"
		class="h-full shrink-0 rounded-none px-2.5 lg:px-4 xl:px-5"
		aria-label="Search"
	>
		<SearchIcon class="size-3.5 lg:size-4" aria-hidden="true" />
		<span class="hidden lg:inline">Search</span>
	</Button>
</form>
