<script lang="ts">
	import { browser } from '$app/environment';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { JOB_PORTALS } from '$lib/job-portals';
	import { onFilterLinkClick } from '$lib/filter-nav';
	import { filtersToHref } from '$lib/jobs-utils';

	type PortalCount = { label: string; count: number };

	const chipClass =
		'inline-flex h-10 max-w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm transition-colors hover:bg-muted sm:px-3';

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
		const base = 'flex size-6 shrink-0 items-center justify-center rounded-sm';
		if (slug === 'iwork4sindh') return `${base} bg-blue-600 p-0.5`;
		return base;
	}
</script>

<div class="space-y-4">
	<h1>Government jobs in Pakistan</h1>

	<div class="max-w-3xl text-sm text-muted-foreground leading-relaxed lg:text-base">
		<p>
			Sarkari Mulazmat is the first unified portal where government jobs from every major official
			source are posted together — one search instead of checking each website separately.
		</p>
	</div>

	<section class="space-y-2" aria-labelledby="portal-sources-heading">
		<h2
			id="portal-sources-heading"
			class="text-sm font-bold tracking-wide text-muted-foreground uppercase"
		>
			Official job portals
		</h2>
		<ul class="flex flex-wrap gap-2">
			{#each JOB_PORTALS as portal (portal.slug)}
				<li class="min-w-0 max-w-full">
					<a
						href={filtersToHref({ portal: portal.label }, '/')}
						data-sveltekit-noscroll
						onclick={onFilterLinkClick}
						class={chipClass}
						title={portal.label}
					>
						{#if failedLogos.has(portal.slug)}
							<span
								class="{logoFrameClass(portal.slug)} text-[10px] font-semibold {portal.slug ===
								'iwork4sindh'
									? 'text-white'
									: 'bg-muted text-muted-foreground'}"
								aria-hidden="true"
							>
								{portal.slug.slice(0, 2).toUpperCase()}
							</span>
						{:else}
							<span class={logoFrameClass(portal.slug)}>
								<img
									src={portal.logoSrc}
									alt=""
									width="24"
									height="24"
									class="size-full object-contain"
									loading="lazy"
									decoding="async"
									onerror={() => onLogoError(portal.slug)}
								/>
							</span>
						{/if}
						<span class="min-w-0 truncate">{portal.label}</span>
						{#if countFor(portal.label) == null}
							<Skeleton class="inline-block h-3.5 w-10 shrink-0 align-middle" />
						{:else}
							<span class="shrink-0 text-muted-foreground tabular-nums">
								({formatCount(countFor(portal.label)!)})
							</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
