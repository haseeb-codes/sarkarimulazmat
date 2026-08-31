<script lang="ts">
	import { browser } from '$app/environment';
	import PortalTooltip from '$lib/components/portal-tooltip.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { HOME_PAGE_PORTALS } from '$lib/job-portals';
	import { onFilterLinkClick } from '$lib/filter-nav';
	import { filtersToHref } from '$lib/jobs-utils';

	let {
		showIntro = true,
		showPortals = true
	}: {
		showIntro?: boolean;
		showPortals?: boolean;
	} = $props();

	type PortalCount = { label: string; count: number };

	const chipClass =
		'inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs transition-colors hover:bg-muted';

	let portalCounts = $state<PortalCount[] | null>(null);
	let failedLogos = $state<Set<string>>(new Set());

	$effect(() => {
		if (!browser) return;

		let cancelled = false;

		void fetch('/api/portals/counts')
			.then((res) => {
				if (!res.ok) throw new Error('Failed to load portal counts');
				return res.json() as Promise<{ portals: PortalCount[] }>;
			})
			.then((data) => {
				if (!cancelled) portalCounts = data.portals;
			})
			.catch((err) => {
				console.error('Failed to load portal counts', err);
			});

		return () => {
			cancelled = true;
		};
	});

	function countFor(label: string): number | null {
		if (!portalCounts) return null;
		return portalCounts.find((item) => item.label === label)?.count ?? 0;
	}

	function formatCount(n: number): string {
		return n.toLocaleString('en-PK');
	}

	function onLogoError(slug: string) {
		failedLogos = new Set(failedLogos).add(slug);
	}

	function logoFrameClass(slug: string): string {
		const base = 'flex size-4 shrink-0 items-center justify-center rounded-sm';
		if (slug === 'iwork4sindh') return `${base} bg-blue-600 p-0.5`;
		return base;
	}

	const sortedPortals = $derived.by(() => {
		if (!portalCounts) return HOME_PAGE_PORTALS;

		const countMap = new Map(portalCounts.map((item) => [item.label, item.count]));
		return [...HOME_PAGE_PORTALS].sort(
			(a, b) => (countMap.get(b.label) ?? 0) - (countMap.get(a.label) ?? 0)
		);
	});
</script>

<div class="space-y-1.5 sm:space-y-3 lg:space-y-4">
	{#if showIntro}
		<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
			<h1 class="shrink-0 text-lg sm:text-2xl lg:text-3xl">Government jobs in Pakistan</h1>
			<p
				class="min-w-0 text-xs leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed lg:text-base"
			>
				Sarkari Mulazmat is the first unified portal where government jobs from every major official
				source are posted together — one search instead of checking each website separately.
			</p>
		</div>
	{/if}

	{#if showPortals}
	<section class="space-y-1.5" aria-labelledby="portal-sources-heading">
		<h2
			id="portal-sources-heading"
			class="text-xs font-bold tracking-wide text-muted-foreground uppercase"
		>
			Job portals
		</h2>
		<ul class="flex flex-wrap gap-1.5">
			{#each sortedPortals as portal (portal.slug)}
				<li class="min-w-0 max-w-full">
					<PortalTooltip label={portal.label} class="min-w-0 max-w-full">
						<a
							href={filtersToHref({ portal: portal.label }, '/')}
							data-sveltekit-noscroll
							onclick={onFilterLinkClick}
							class={chipClass}
							aria-label={portal.label}
						>
						{#if failedLogos.has(portal.slug)}
							<span
								class="{logoFrameClass(portal.slug)} text-[8px] font-semibold {portal.slug ===
								'iwork4sindh'
									? 'text-white'
									: 'bg-muted text-muted-foreground'}"
								aria-hidden="true"
							>
								{portal.shortLabel}
							</span>
						{:else}
							<span class={logoFrameClass(portal.slug)}>
								<img
									src={portal.logoSrc}
									alt=""
									width="16"
									height="16"
									class="size-full object-contain"
									loading="lazy"
									decoding="async"
									onerror={() => onLogoError(portal.slug)}
								/>
							</span>
						{/if}
						<span class="min-w-0 truncate">{portal.shortLabel}</span>
						{#if countFor(portal.label) == null}
							<Skeleton class="inline-block h-3 w-8 shrink-0 align-middle" />
						{:else}
							<span class="shrink-0 text-muted-foreground tabular-nums">
								({formatCount(countFor(portal.label)!)})
							</span>
						{/if}
						</a>
					</PortalTooltip>
				</li>
			{/each}
		</ul>
	</section>
	{/if}
</div>
