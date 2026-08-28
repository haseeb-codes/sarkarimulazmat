<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { adDetailHref } from '$lib/ads-utils';
	import { debounce, SEARCH_DEBOUNCE_MS } from '$lib/debounce';
	import { formatDateLabel } from '$lib/jobs-utils';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import type { ListAd } from '$lib/server/ad-list-dto';

	let { data } = $props();

	let draft = $state('');
	let focused = $state(false);
	let pendingCommit: string | null = null;

	const urlQ = $derived(page.url.searchParams.get('q') ?? '');

	$effect(() => {
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

	function navigate(q: string | null) {
		const committed = q ?? '';
		if (committed === urlQ) {
			pendingCommit = null;
			return;
		}
		pendingCommit = committed;
		const params = new URLSearchParams();
		if (committed) params.set('q', committed);
		const qs = params.toString();
		goto(qs ? `/ads?${qs}` : '/ads', { keepFocus: true, noScroll: true, replaceState: true });
	}

	const scheduleCommit = debounce(
		() => navigate(draft.trim() || null),
		SEARCH_DEBOUNCE_MS
	);

	onDestroy(() => scheduleCommit.cancel());

	function commitNow(event?: Event) {
		event?.preventDefault();
		scheduleCommit.cancel();
		navigate(draft.trim() || null);
	}

	function onBlur() {
		scheduleCommit.cancel();
		navigate(draft.trim() || null);
		focused = false;
	}

	const isFiltered = $derived(Boolean(urlQ) || data.page > 1);

	const title = $derived(
		urlQ
			? `Job ads matching “${urlQ}” — Sarkari Mulazmat`
			: 'Job Advertisements — Sarkari Mulazmat'
	);

	const description = $derived(
		urlQ
			? `Search results for “${urlQ}” in government job newspaper advertisements on Sarkari Mulazmat.`
			: 'Browse government job newspaper advertisements in Pakistan — ad codes, headlines, and vacancy counts.'
	);

	const canonical = $derived(new URL('/ads', page.url.origin).href);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Job Advertisements',
		description,
		url: canonical,
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: data.total,
			itemListElement: data.ads.map((ad, index) => ({
				'@type': 'ListItem',
				position: (data.page - 1) * data.pageSize + index + 1,
				url: new URL(adDetailHref(ad.ad_slug), page.url.origin).href,
				name: ad.ad_headline ?? ad.ad_slug
			}))
		}
	});

	const breadcrumbLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: new URL('/', page.url.origin).href
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: 'Job advertisements',
				item: canonical
			}
		]
	});

	const cardLinkClass =
		'group flex h-full min-h-11 flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5';

	function pageHref(nextPage: number) {
		const params = new URLSearchParams();
		if (urlQ) params.set('q', urlQ);
		if (nextPage > 1) params.set('page', String(nextPage));
		const qs = params.toString();
		return qs ? `/ads?${qs}` : '/ads';
	}

	function vacancyLabel(count: number | null) {
		if (count == null) return '—';
		return `${count.toLocaleString('en-PK')} ${count === 1 ? 'vacancy' : 'vacancies'}`;
	}
</script>

{#snippet adPostedBy(ad: ListAd)}
	{#if ad.posted_by}
		<p class="mt-1 text-xs text-muted-foreground">{ad.posted_by}</p>
	{/if}
{/snippet}

{#snippet lastDateLabel(ad: ListAd)}
	{#if ad.last_date_to_apply}
		{formatDateLabel(ad.last_date_to_apply)}
	{:else}
		—
	{/if}
{/snippet}

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if isFiltered}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:card" content="summary" />
	{#if !data.error && data.ads.length > 0}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>`}
</svelte:head>

<div class="space-y-4 sm:space-y-6">
	<div class="space-y-4">
		<div class="space-y-2">
			<a href="/" class="text-sm text-muted-foreground hover:text-foreground">← All jobs</a>
			<h1>Job advertisements</h1>
			<p class="max-w-2xl text-sm text-muted-foreground sm:text-base">
				Browse newspaper job ads published on Sarkari Mulazmat. Open an ad to see every posting extracted
				from that notice.
			</p>
		</div>

		<form
			class="relative max-w-2xl"
			role="search"
			aria-label="Search advertisements"
			onsubmit={commitNow}
		>
			<SearchIcon
				class="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-primary"
				aria-hidden="true"
			/>
			<Input
				id="ads-search"
				type="search"
				name="q"
				bind:value={draft}
				oninput={scheduleCommit}
				onfocus={() => (focused = true)}
				onblur={onBlur}
				placeholder="Search by headline, ad code, or description…"
				class="h-12 w-full rounded-xl border-border bg-card pl-11 text-base shadow-sm md:text-base {urlQ
					? 'pr-36'
					: 'pr-24'}"
				autocomplete="off"
				enterkeyhint="search"
				aria-controls="ads-results"
			/>
			{#if urlQ}
				<a
					href="/ads"
					class="absolute top-1/2 right-[5.75rem] inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Clear search and show all advertisements"
				>
					<XIcon class="size-4" aria-hidden="true" />
				</a>
			{/if}
			<Button
				type="submit"
				class="absolute top-1/2 right-2 h-9 -translate-y-1/2 px-3"
				aria-label="Search advertisements"
			>
				Search
			</Button>
		</form>

		{#if urlQ}
			<p class="text-sm text-muted-foreground">
				Showing results for “{urlQ}”.
				<a href="/ads" class="font-medium text-primary underline-offset-2 hover:underline">
					View all advertisements
				</a>
			</p>
		{/if}
	</div>

	{#if data.error}
		<div
			class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			role="alert"
		>
			{data.error}
		</div>
	{:else if data.ads.length === 0}
		<div
			id="ads-results"
			class="rounded-lg border border-dashed border-border px-4 py-10 text-center sm:px-6 sm:py-12"
		>
			{#if urlQ}
				<p class="font-medium">No advertisements match “{urlQ}”</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Try a shorter phrase, ad code, or department name from the headline.
				</p>
				<Button href="/ads" variant="outline" size="sm" class="mt-4">Clear search</Button>
			{:else}
				<p class="font-medium">No advertisements found</p>
				<p class="mt-1 text-sm text-muted-foreground">Check back later for new job ads.</p>
			{/if}
		</div>
	{:else}
		<p id="ads-results" class="text-sm text-muted-foreground">
			{#if urlQ}
				{data.total.toLocaleString('en-PK')} result{data.total === 1 ? '' : 's'} for “{urlQ}”
				<span class="mx-1">·</span>
				<a href="/ads" class="font-medium text-primary underline-offset-2 hover:underline">
					View all
				</a>
			{:else}
				{data.total.toLocaleString('en-PK')} advertisement{data.total === 1 ? '' : 's'}
			{/if}
			{#if data.totalPages > 1}
				· page {data.page} of {data.totalPages}
			{/if}
		</p>

		<!-- Mobile / tablet: card list -->
		<ul class="grid gap-3 md:hidden" aria-label="Job advertisements">
			{#each data.ads as ad (ad.ad_slug)}
				<li>
					<a href={adDetailHref(ad.ad_slug)} class={cardLinkClass}>
						<span class="font-semibold text-foreground">{ad.ad_headline ?? ad.ad_slug}</span>
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
							{#if ad.ad_code}
								<span class="break-all">{ad.ad_code}</span>
							{/if}
							<span class="tabular-nums font-medium text-primary underline-offset-2 group-hover:underline">
								{vacancyLabel(ad.vacancies)}
							</span>
							<span class="tabular-nums">
								<span class="font-medium text-foreground/80">Last date:</span>
								{@render lastDateLabel(ad)}
							</span>
						</div>
						{@render adPostedBy(ad)}
					</a>
				</li>
			{/each}
		</ul>

		<!-- Desktop: table -->
		<div class="hidden overflow-x-auto rounded-xl border border-border md:block">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border bg-muted/40">
					<tr>
						<th class="px-4 py-3 font-semibold lg:px-5" scope="col">Ad code</th>
						<th class="px-4 py-3 font-semibold lg:px-5" scope="col">Headline</th>
						<th class="px-4 py-3 font-semibold whitespace-nowrap lg:px-5" scope="col">Last date</th>
						<th class="px-4 py-3 text-right font-semibold lg:px-5" scope="col">Vacancies</th>
					</tr>
				</thead>
				<tbody>
					{#each data.ads as ad (ad.ad_slug)}
						<tr class="border-b border-border last:border-b-0 hover:bg-muted/30">
							<td class="max-w-[12rem] px-4 py-3 align-top break-words text-muted-foreground lg:max-w-none lg:px-5 lg:whitespace-nowrap">
								{ad.ad_code ?? '—'}
							</td>
							<td class="min-w-0 px-4 py-3 align-top lg:px-5">
								<a
									href={adDetailHref(ad.ad_slug)}
									class="font-medium text-foreground hover:text-primary hover:underline"
								>
									{ad.ad_headline ?? ad.ad_slug}
								</a>
								{@render adPostedBy(ad)}
							</td>
							<td class="px-4 py-3 align-top whitespace-nowrap tabular-nums text-muted-foreground lg:px-5">
								{@render lastDateLabel(ad)}
							</td>
							<td class="px-4 py-3 align-top text-right tabular-nums lg:px-5">
								<a
									href={adDetailHref(ad.ad_slug)}
									class="font-medium text-foreground hover:text-primary hover:underline"
									aria-label="View {vacancyLabel(ad.vacancies)} for {ad.ad_headline ?? ad.ad_slug}"
								>
									{ad.vacancies ?? '—'}
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<nav class="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="Advertisement pages">
			{#if data.totalPages > 1}
				{#if data.page > 1}
					<a
						href={pageHref(data.page - 1)}
						class="inline-flex h-8 min-w-24 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium shadow-xs hover:bg-muted"
					>
						Previous
					</a>
				{/if}
				<span class="w-full text-center text-sm text-muted-foreground sm:w-auto">
					Page {data.page} of {data.totalPages}
				</span>
				{#if data.page < data.totalPages}
					<a
						href={pageHref(data.page + 1)}
						class="inline-flex h-8 min-w-24 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium shadow-xs hover:bg-muted"
					>
						Next
					</a>
				{/if}
			{/if}
		</nav>
	{/if}
</div>
