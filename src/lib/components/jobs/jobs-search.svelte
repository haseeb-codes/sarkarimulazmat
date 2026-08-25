<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { filtersToHref, type FilterParams } from '$lib/jobs-utils';
	import SearchIcon from '@lucide/svelte/icons/search';

	let { filters }: { filters: FilterParams } = $props();

	let draft = $state(filters.q ?? '');
	let focused = $state(false);
	/** Trimmed q we navigated to; blocks stale/in-flight URL sync from wiping the input. */
	let pendingCommit: string | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

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

	onDestroy(() => clearTimeout(debounceTimer));

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

	function scheduleCommit() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => navigate(draft.trim() || null), 300);
	}

	function commitNow(event?: Event) {
		event?.preventDefault();
		clearTimeout(debounceTimer);
		navigate(draft.trim() || null);
	}

	function onFocus() {
		focused = true;
	}

	function onBlur() {
		clearTimeout(debounceTimer);
		navigate(draft.trim() || null);
		focused = false;
	}
</script>

<form
	class="rounded-xl border-2 border-primary/25 bg-primary/5 p-3 shadow-sm sm:p-4"
	role="search"
	aria-label="Search jobs"
	onsubmit={commitNow}
>
	<label for="jobs-search" class="mb-2 block text-sm font-semibold text-foreground">
		Search jobs
	</label>
	<div class="relative">
		<SearchIcon
			class="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-primary"
			aria-hidden="true"
		/>
		<Input
			id="jobs-search"
			type="search"
			name="q"
			bind:value={draft}
			oninput={scheduleCommit}
			onfocus={onFocus}
			onblur={onBlur}
			placeholder="Title, department, grade, donor, degree…"
			class="h-12 border-primary/30 bg-background pl-11 text-base shadow-none focus-visible:border-primary"
			autocomplete="off"
			enterkeyhint="search"
		/>
	</div>
</form>
