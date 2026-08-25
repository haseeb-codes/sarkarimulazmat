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
	};

	let {
		category,
		jobs,
		updatedAt
	}: {
		category: JobCategoryPageDef;
		jobs: ShareJob[];
		updatedAt: string;
	} = $props();

	const updatedLabel = $derived(
		new Date(updatedAt).toLocaleDateString('en-PK', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
	);

	const canonical = $derived(`${SITE_HREF}/${category.slug}`);
</script>

<svelte:head>
	<title>{category.title}</title>
	<meta name="description" content={category.metaDescription} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={category.title} />
	<meta property="og:description" content={category.metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
</svelte:head>

<ForceLightMode>
	<div class="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:py-8">
		<header
			class="overflow-hidden rounded-2xl border border-primary/25 bg-linear-to-br from-primary/15 via-primary/5 to-background shadow-sm"
		>
			<div class="flex flex-col items-center gap-3 px-4 py-6 text-center sm:px-6 sm:py-8">
				<a
					href="/"
					class="flex items-center gap-3 rounded-full border border-primary/30 bg-background/80 px-4 py-2 shadow-xs backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
				>
					<img src={logo} alt="" class="h-10 w-10 shrink-0" width="40" height="40" />
					<div class="text-left">
						<p class="text-lg font-bold tracking-tight text-primary sm:text-xl">{SITE_NAME}</p>
						<p class="text-sm font-semibold text-primary/80">{SITE_URL}</p>
					</div>
				</a>

				<p class="text-sm font-medium text-primary/70">
					<a href="/" class="hover:underline">{SITE_URL}</a><span>/{category.slug}</span>
				</p>

				<div class="space-y-1">
					<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{category.h1}</h1>
					<p class="text-sm text-muted-foreground sm:text-base">
						{jobs.length.toLocaleString('en-PK')} active opening{jobs.length === 1 ? '' : 's'} ·
						Updated {updatedLabel}
					</p>
				</div>
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
				<h2 class="text-base font-semibold">
					{jobs.length.toLocaleString('en-PK')} job{jobs.length === 1 ? '' : 's'}
				</h2>

				<ul class="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
					{#each jobs as job (job.slug)}
						<li class="mb-3 break-inside-avoid">
							<JobCard {job} static={true} />
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<footer
			class="rounded-2xl border border-primary/25 bg-linear-to-br from-primary/10 via-background to-primary/5 px-4 py-6 text-center sm:px-6"
		>
			<p class="text-base font-semibold text-foreground">
				Visit <a href="/" class="text-primary hover:underline">{SITE_URL}</a> for complete details,
			</p>
			<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
				Official advertisements, eligibility filters, and hundreds of other government jobs across
				Pakistan.
			</p>
			<p class="mt-3 text-lg font-bold">
				<a href="/" class="text-primary hover:underline">{SITE_URL}</a>
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				<a href="/" class="hover:text-foreground hover:underline">{SITE_NAME}</a> — Government jobs in
				Pakistan
			</p>
		</footer>
	</div>
</ForceLightMode>
