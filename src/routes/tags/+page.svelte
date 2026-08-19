<script lang="ts">
	import { page } from '$app/state';
	import { SITE_NAME } from '$lib/job-category-pages';

	let { data } = $props();

	const title = `Browse Government Jobs by Tag — ${SITE_NAME}`;
	const description =
		'Browse government jobs in Pakistan by qualification, field, and role — MBA, MBBS, engineering, teaching, nursing, and more.';
	const canonical = $derived(new URL('/tags', page.url.origin).href);

	const tags = data.tags;

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
	<div class="space-y-2">
		<a href="/" class="text-sm text-muted-foreground hover:text-foreground">← All jobs</a>
		<h1>Browse by tag</h1>
		<p class="max-w-2xl text-muted-foreground">
			Jump to curated job lists by qualification, profession, or role. Each page shows active
			government openings matching that tag.
		</p>
	</div>

	<section aria-labelledby="job-tags-heading">
		<h2 id="job-tags-heading" class="text-sm font-bold tracking-wide text-muted-foreground uppercase">
			{tags.length} job tags
		</h2>

		<ul class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each tags as tag (tag.slug)}
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
	</section>
</div>
