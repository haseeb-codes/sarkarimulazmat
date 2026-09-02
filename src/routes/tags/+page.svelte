<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { SITE_NAME } from '$lib/job-category-pages';
	import { homeHrefFromUrl } from '$lib/jobs-utils';
	import { Input } from '$lib/components/ui/input/index.js';
	import { debounce, SEARCH_DEBOUNCE_MS } from '$lib/debounce';
	import SearchIcon from '@lucide/svelte/icons/search';

	let { data } = $props();

	const title = `Browse Government Jobs by Tag — ${SITE_NAME}`;
	const description =
		'Browse government jobs in Pakistan by qualification, field, and role — MBA, MBBS, engineering, teaching, nursing, and more.';
	const canonical = $derived(new URL('/tags', page.url.origin).href);
	const homeHref = $derived(homeHrefFromUrl(page.url));

	const tags = $derived(data.tags);
	let queryInput = $state('');
	let debouncedQuery = $state('');

	const syncDebouncedQuery = debounce((value: string) => {
		debouncedQuery = value;
	}, SEARCH_DEBOUNCE_MS);

	onDestroy(() => syncDebouncedQuery.cancel());

	function onQueryInput(value: string) {
		queryInput = value;
		syncDebouncedQuery(value);
	}

	const filteredTags = $derived.by(() => {
		const q = debouncedQuery.trim().toLowerCase();
		if (!q) return tags;
		return tags.filter(
			(tag) => tag.label.toLowerCase().includes(q) || tag.slug.toLowerCase().includes(q)
		);
	});

	const linkClass =
		'flex h-full min-h-11 flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
</svelte:head>

<div class="space-y-6">
	<div class="space-y-4">
		<div class="space-y-2">
			<a href={homeHref} class="text-sm text-muted-foreground hover:text-foreground">← All jobs</a>
			<h1>Browse by tag</h1>
			<p class="max-w-2xl text-muted-foreground">
				Jump to curated job lists by qualification, profession, or role. Each page shows active
				government openings matching that tag.
			</p>
		</div>

		<div class="relative max-w-2xl">
			<SearchIcon
				class="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-primary"
				aria-hidden="true"
			/>
			<Input
				id="tag-search"
				type="search"
				value={queryInput}
				oninput={(e) => onQueryInput(e.currentTarget.value)}
				placeholder="Search tags by name or slug…"
				class="h-12 w-full rounded-xl border-border bg-card pl-11 text-base shadow-sm md:text-base"
				autocomplete="off"
				aria-label="Search tags"
				aria-controls="job-tags-list"
			/>
		</div>
	</div>

	<section aria-labelledby="job-tags-heading">
		<h2 id="job-tags-heading" class="text-sm font-bold tracking-wide text-muted-foreground uppercase">
			{#if debouncedQuery.trim()}
				{filteredTags.length} of {tags.length} job tags
			{:else}
				{tags.length} job tags
			{/if}
		</h2>

		{#if filteredTags.length === 0}
			<p class="mt-3 text-sm text-muted-foreground">No tags match “{debouncedQuery.trim()}”.</p>
		{:else}
			<ul id="job-tags-list" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredTags as tag (tag.slug)}
					<li>
						<a href="/{tag.slug}" class={linkClass}>
							<span class="font-semibold text-foreground">
								{tag.label} <span class="text-xs font-medium text-primary/90">({tag.count.toLocaleString('en-PK')})</span>
							</span>
							<span class="mt-0.5 text-xs text-muted-foreground">/{tag.slug}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
