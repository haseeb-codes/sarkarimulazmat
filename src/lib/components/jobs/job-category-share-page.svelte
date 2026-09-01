<script lang="ts">
	import logo from '$lib/assets/logo.png';
	import JobCard from '$lib/components/job-card.svelte';
	import ForceLightMode from '$lib/components/jobs/force-light-mode.svelte';
	import {
		SITE_HREF,
		SITE_NAME,
		SITE_URL,
		type JobCategoryPageDef
	} from '$lib/job-category-pages';

	type ShareJob = {
		row_id: number;
		slug: string;
		title: string | null;
		department: string | null;
		education_level: string | null;
		project_program_name: string | null;
		ad_date?: string | Date | null;
		degree_area: string | null;
		degrees: string | null;
		grade: string | null;
		place_of_posting: string | null;
		domicile: string | null;
		gender: string | null;
		disability_quota?: boolean | null;
		collar?: string | null;
		donor_name?: string | null;
		salary?: number | null;
		min_age: number | null;
		max_age: number | null;
		last_date_to_apply: string | Date | null;
		supabase_file_path?: string | null;
		application_online_address?: string | null;
		email?: string | null;
		url_web_title?: string | null;
	};

	let {
		category,
		jobs,
		total,
		page,
		totalPages,
		updatedAt
	}: {
		category: JobCategoryPageDef;
		jobs: ShareJob[];
		total: number;
		page: number;
		totalPages: number;
		updatedAt: string;
	} = $props();

	const updatedLabel = $derived(
		new Date(updatedAt).toLocaleDateString('en-PK', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
	);

	const showPagination = $derived(totalPages > 1);
	const pageHref = (targetPage: number) =>
		targetPage <= 1 ? `/${category.slug}` : `/${category.slug}?page=${targetPage}`;
	const pageNumbers = $derived(Array.from({ length: totalPages }, (_, index) => index + 1));
	const canonical = $derived(`${SITE_HREF}${pageHref(page)}`);
	const prevHref = $derived(page > 1 ? `${SITE_HREF}${pageHref(page - 1)}` : null);
	const nextHref = $derived(page < totalPages ? `${SITE_HREF}${pageHref(page + 1)}` : null);
</script>

<svelte:head>
	<title>{category.title}</title>
	<meta name="description" content={category.metaDescription} />
	<link rel="canonical" href={canonical} />
	{#if prevHref}
		<link rel="prev" href={prevHref} />
	{/if}
	{#if nextHref}
		<link rel="next" href={nextHref} />
	{/if}
	<meta property="og:title" content={category.title} />
	<meta property="og:description" content={category.metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
</svelte:head>

<ForceLightMode>
	<div class="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:py-8">
		<header
			class="overflow-hidden rounded-xl border border-primary/25 bg-linear-to-br from-primary/15 via-primary/5 to-background shadow-sm"
		>
			<div
				class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-3 text-center sm:gap-x-3 sm:px-4 sm:py-3.5"
			>
				<a
					href="/"
					class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 px-3 py-1.5 shadow-xs backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
				>
					<img src={logo} alt="" class="h-7 w-7 shrink-0" width="28" height="28" />
					<span class="text-sm font-bold tracking-tight text-primary">{SITE_NAME}</span>
					<span class="text-primary/40" aria-hidden="true">·</span>
					<span class="text-xs font-semibold text-primary/80">
						{SITE_URL}<span class="text-primary/70">/{category.slug}</span>
					</span>
				</a>

				<span class="hidden text-primary/25 sm:inline" aria-hidden="true">|</span>

				<h1 class="text-lg font-bold tracking-tight sm:text-xl">{category.h1}</h1>

				<span class="text-muted-foreground/60" aria-hidden="true">·</span>

				<p class="text-xs text-muted-foreground sm:text-sm">Updated {updatedLabel}</p>
			</div>
		</header>

		{#if jobs.length === 0}
			<div class="rounded-lg border border-dashed border-border px-6 py-12 text-center">
				<p class="font-medium">{category.emptyMessage}</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Check back soon on {SITE_URL} for new listings.
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				<nav
					aria-label="Job list pages"
					class="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-3"
				>
					<div class="mr-auto flex shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5 px-1 text-sm">
						<span class="font-semibold">Page: {page}/{totalPages}</span>
						<span class="text-muted-foreground/60" aria-hidden="true">·</span>
						<span class="text-muted-foreground">
							{total.toLocaleString('en-PK')} active opening{total === 1 ? '' : 's'}
						</span>
					</div>

					{#if showPagination}
						{#if page > 1}
							<a
								href={pageHref(page - 1)}
								class="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
							>
								← Previous
							</a>
						{/if}

						{#each pageNumbers as pageNumber (pageNumber)}
							<a
								href={pageHref(pageNumber)}
								aria-current={pageNumber === page ? 'page' : undefined}
								class="min-w-9 rounded-md border px-3 py-1.5 text-center text-sm font-medium transition-colors {pageNumber ===
								page
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'}"
							>
								{pageNumber}
							</a>
						{/each}

						{#if page < totalPages}
							<a
								href={pageHref(page + 1)}
								class="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
							>
								Next →
							</a>
						{/if}
					{/if}
				</nav>

				<ul class="grid auto-rows-auto grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{#each jobs as job (job.slug)}
						<li class="min-w-0">
							<JobCard {job} static={true} />
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<footer
			class="rounded-2xl border border-primary/25 bg-linear-to-br from-primary/10 via-background to-primary/5 px-4 py-4 text-center sm:px-6"
		>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Visit <a href="/" class="text-primary hover:underline">{SITE_URL}</a> for complete details.
			</p>
		</footer>
	</div>
</ForceLightMode>
