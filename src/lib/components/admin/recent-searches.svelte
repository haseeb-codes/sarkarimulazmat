<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { AdminSearchRow } from '$lib/admin-types';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import SearchIcon from '@lucide/svelte/icons/search';

	let {
		promise
	}: {
		promise: Promise<AdminSearchRow[]>;
	} = $props();

	let expandedId = $state<string | null>(null);
	let query = $state('');
	let rows = $state<AdminSearchRow[] | null>(null);

	$effect(() => {
		let cancelled = false;
		rows = null;
		promise.then((value) => {
			if (!cancelled) rows = value;
		});
		return () => {
			cancelled = true;
		};
	});

	const filteredRows = $derived.by(() => {
		if (!rows) return null;
		const q = query.trim().toLowerCase();
		if (!q) return rows;
		return rows.filter((row) => rowMatchesQuery(row, q));
	});

	function rowMatchesQuery(row: AdminSearchRow, q: string): boolean {
		const haystacks = [
			row.ip_address,
			row.path,
			row.href,
			row.keyword,
			row.sort,
			row.device_type,
			row.browser,
			row.browser_version,
			row.os,
			...row.params.map((p) => p.label),
			...row.filters.map((f) => `${f.category} ${f.label}`)
		];
		return haystacks.some((value) => value?.toLowerCase().includes(q));
	}

	function formatAbsolute(d: Date | string): string {
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toLocaleString('en-PK', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	function formatRelative(d: Date | string): string {
		const date = typeof d === 'string' ? new Date(d) : d;
		const diffMs = Date.now() - date.getTime();
		const sec = Math.round(diffMs / 1000);
		if (sec < 45) return 'just now';
		const min = Math.round(sec / 60);
		if (min < 60) return `${min}m ago`;
		const hr = Math.round(min / 60);
		if (hr < 24) return `${hr}h ago`;
		const day = Math.round(hr / 24);
		if (day < 14) return `${day}d ago`;
		return formatAbsolute(date);
	}

	function deviceLabel(row: AdminSearchRow): string {
		const browser = [row.browser, row.browser_version].filter(Boolean).join(' ');
		return [row.device_type, browser || null, row.os].filter(Boolean).join(' · ') || 'Unknown device';
	}

	function toggle(id: string) {
		expandedId = expandedId === id ? null : id;
	}
</script>

<div class="overflow-hidden rounded-2xl border border-border">
	<div class="space-y-3 border-b border-border px-4 py-3">
		<div>
			<h3 class="text-sm font-semibold">Recent searches</h3>
			<p class="text-xs text-muted-foreground">
				Latest searches with query params as used. Click a param to open that search.
			</p>
		</div>
		<label class="relative block">
			<span class="sr-only">Filter recent searches</span>
			<SearchIcon
				class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
				aria-hidden="true"
			/>
			<Input
				type="search"
				placeholder="Filter by param, IP, path, device…"
				class="h-9 pl-8"
				bind:value={query}
				autocomplete="off"
			/>
		</label>
	</div>

	{#if filteredRows == null}
		<div class="space-y-3 p-4">
			{#each Array.from({ length: 6 }) as _, i (i)}
				<div class="space-y-2 rounded-xl border border-border/60 p-3">
					<Skeleton class="h-4 w-40" />
					<Skeleton class="h-6 w-full" />
				</div>
			{/each}
		</div>
	{:else if filteredRows.length === 0}
		<p class="px-4 py-8 text-center text-sm text-muted-foreground">
			{query.trim() ? 'No searches match your filter.' : 'No searches yet.'}
		</p>
	{:else}
		<ul class="divide-y divide-border">
			{#each filteredRows as row (row.id)}
				{@const open = expandedId === row.id}
				{@const href = row.href}
				<li class="px-3 py-3 sm:px-4">
					<div class="flex w-full items-start gap-3 text-left">
						<button
							type="button"
							class="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-transform {open
								? 'rotate-180'
								: ''}"
							onclick={() => toggle(row.id)}
							aria-expanded={open}
							aria-label={open ? 'Collapse search details' : 'Expand search details'}
						>
							<ChevronDownIcon class="size-3.5" />
						</button>

						<div class="min-w-0 flex-1 space-y-2">
							<button
								type="button"
								class="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left"
								onclick={() => toggle(row.id)}
								aria-expanded={open}
							>
								<time
									class="text-xs text-muted-foreground"
									datetime={new Date(row.created_at).toISOString()}
									title={formatAbsolute(row.created_at)}
								>
									{formatRelative(row.created_at)}
								</time>
								<span
									class="rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums {row.result_count ===
									0
										? 'bg-destructive/10 text-destructive'
										: 'bg-muted text-foreground'}"
								>
									{row.result_count.toLocaleString('en-PK')}
									{row.result_count === 1 ? 'result' : 'results'}
								</span>
								{#if row.ip_address}
									<span class="font-mono text-xs text-muted-foreground" title="IP address">
										{row.ip_address}
									</span>
								{/if}
								{#if row.params.length === 0 && row.filter_count === 0}
									<span class="text-xs text-muted-foreground">No filters (browse all)</span>
								{:else}
									<span class="text-xs text-muted-foreground">
										{row.params.length || row.filter_count}
										{(row.params.length || row.filter_count) === 1 ? 'param' : 'params'}
									</span>
								{/if}
							</button>

							{#if row.params.length}
								<div class="flex flex-wrap gap-1.5" aria-label="Search params">
									{#each row.params as param, i (`${param.key}:${param.value}:${i}`)}
										{#if href}
											<a
												href={href}
												class="inline-flex max-w-full"
												target="_blank"
												rel="noopener noreferrer"
												title="Open search"
											>
												<Badge
													variant="outline"
													class="max-w-full truncate font-mono text-[11px] font-normal hover:border-primary hover:text-primary"
												>
													{param.label}
												</Badge>
											</a>
										{:else}
											<Badge
												variant="outline"
												class="max-w-full truncate font-mono text-[11px] font-normal"
												title={param.key}
											>
												{param.label}
											</Badge>
										{/if}
									{/each}
									{#if href}
										<a
											href={href}
											class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
											target="_blank"
											rel="noopener noreferrer"
											aria-label="Open full search"
										>
											Open
											<ExternalLinkIcon class="size-3 shrink-0" />
										</a>
									{/if}
								</div>
							{:else if row.filters.length}
								<div class="flex flex-wrap gap-1.5" aria-label="Applied filters">
									{#each row.filters as chip (chip.id)}
										{#if href}
											<a
												href={href}
												class="inline-flex max-w-full"
												target="_blank"
												rel="noopener noreferrer"
												title="Open search"
											>
												<Badge
													variant="outline"
													class="max-w-full truncate font-normal hover:border-primary hover:text-primary"
													title={chip.category}
												>
													{chip.label}
												</Badge>
											</a>
										{:else}
											<Badge
												variant="outline"
												class="max-w-full truncate font-normal"
												title={chip.category}
											>
												{chip.label}
											</Badge>
										{/if}
									{/each}
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">Default listing — no filters applied.</p>
							{/if}
						</div>
					</div>

					{#if open}
						<div
							class="mt-2 ml-9 space-y-1.5 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
						>
							<p>
								<span class="font-medium text-foreground">When:</span>
								{formatAbsolute(row.created_at)}
							</p>
							<p>
								<span class="font-medium text-foreground">IP:</span>
								<span class="font-mono">{row.ip_address ?? '—'}</span>
							</p>
							<p>
								<span class="font-medium text-foreground">Device:</span>
								{deviceLabel(row)}
							</p>
							{#if row.sort}
								<p>
									<span class="font-medium text-foreground">Sort:</span>
									{row.sort}
								</p>
							{/if}
							<p class="flex flex-wrap items-center gap-1">
								<span class="font-medium text-foreground">Path:</span>
								{#if href}
									<a
										href={href}
										class="inline-flex items-center gap-1 text-primary hover:underline"
										target="_blank"
										rel="noopener noreferrer"
									>
										<span class="break-all font-mono">{href}</span>
										<ExternalLinkIcon class="size-3 shrink-0" />
									</a>
								{:else}
									<span class="font-mono">{row.path ?? '—'}</span>
								{/if}
							</p>
							{#if row.filters.length}
								<p>
									<span class="font-medium text-foreground">Categories:</span>
									{[...new Set(row.filters.map((f) => f.category))].join(', ')}
								</p>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
