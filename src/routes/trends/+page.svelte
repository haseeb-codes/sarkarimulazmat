<script lang="ts">
	import { page } from '$app/state';
	import { SITE_NAME } from '$lib/job-category-pages';
	import { homeHrefFromUrl } from '$lib/jobs-utils';
	import TrendChartAsync from '$lib/components/trends/trend-chart-async.svelte';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import Building2Icon from '@lucide/svelte/icons/building-2';

	let { data } = $props();

	const title = `Job trends — ${SITE_NAME}`;
	const description =
		'See how many active jobs were posted recently, which deadlines are coming up, and breakdowns by grade, education, domicile, and donor.';
	const canonical = $derived(new URL('/trends', page.url.origin).href);
	const homeHref = $derived(homeHrefFromUrl(page.url));
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

<div class="relative space-y-8">
	<!-- Atmospheric backdrop — clipped so it doesn’t bleed into footer -->
	<div
		class="pointer-events-none absolute inset-x-0 -top-6 -z-10 h-[28rem] overflow-hidden"
		aria-hidden="true"
	>
		<div
			class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklch,var(--primary)_14%,transparent),_transparent_58%)]"
		></div>
		<div
			class="absolute top-24 left-[8%] size-40 rounded-full bg-[color-mix(in_oklch,var(--chart-2)_18%,transparent)] blur-3xl"
		></div>
		<div
			class="absolute top-10 right-[12%] size-52 rounded-full bg-[color-mix(in_oklch,var(--chart-1)_16%,transparent)] blur-3xl"
		></div>
	</div>

	<header
		class="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 px-5 py-6 shadow-sm backdrop-blur-sm sm:px-8 sm:py-8"
	>
		<div
			class="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(120deg,transparent,color-mix(in_oklch,var(--primary)_8%,transparent))]"
			aria-hidden="true"
		></div>

		<a
			href={homeHref}
			class="relative text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			← All jobs
		</a>

		<div class="relative mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div class="max-w-2xl space-y-3">
				<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
					<ActivityIcon class="size-3.5" aria-hidden="true" />
					Live marketplace pulse
				</div>
				<h1 class="text-balance">Trends</h1>
				<p class="text-pretty text-muted-foreground sm:text-base">
					Watch posting cadence, upcoming deadlines, and how active openings break down by grade,
					education, domicile, and donor — each chart loads on its own so you see insights sooner.
				</p>
			</div>

			<ul class="flex flex-wrap gap-2 text-xs text-muted-foreground lg:justify-end">
				<li class="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-2.5 py-1.5">
					<span class="size-2 rounded-full bg-[var(--chart-1)]" aria-hidden="true"></span>
					Posted
				</li>
				<li class="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-2.5 py-1.5">
					<span class="size-2 rounded-full bg-[oklch(0.58_0.14_25)]" aria-hidden="true"></span>
					Deadlines
				</li>
				<li class="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-2.5 py-1.5">
					<span class="size-2 rounded-full bg-[var(--chart-3)]" aria-hidden="true"></span>
					Grade
				</li>
				<li class="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-2.5 py-1.5">
					<span class="size-2 rounded-full bg-[var(--chart-4)]" aria-hidden="true"></span>
					Education
				</li>
				<li class="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-2.5 py-1.5">
					<span class="size-2 rounded-full bg-[var(--chart-1)]" aria-hidden="true"></span>
					Domicile
				</li>
				<li class="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-2.5 py-1.5">
					<span class="size-2 rounded-full bg-[var(--chart-5)]" aria-hidden="true"></span>
					Donor
				</li>
			</ul>
		</div>
	</header>

	<section class="space-y-3" aria-labelledby="trends-activity-heading">
		<div class="flex items-center gap-2 px-0.5">
			<CalendarClockIcon class="size-4 text-primary" aria-hidden="true" />
			<h2 id="trends-activity-heading" class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
				Activity
			</h2>
		</div>
		<div class="space-y-5">
			<div class="grid gap-5 lg:grid-cols-2">
				<TrendChartAsync
					promise={data.jobsPostedLast7Days}
					title="Jobs posted — last 7 days"
					description="Daily count of active jobs by file creation date."
					color="var(--chart-1)"
					accent="var(--chart-1)"
					emptyMessage="No active jobs posted in the last 7 days."
				/>
				<TrendChartAsync
					promise={data.domicileFlags}
					title="Jobs by domicile region"
					description="Active jobs where each domicile flag column equals 1."
					color="var(--chart-1)"
					accent="var(--chart-1)"
					emptyMessage="No domicile flag data available."
				/>
			</div>
			<TrendChartAsync
				promise={data.jobsExpiringByDate}
				title="Jobs expiring — next 45 days"
				description="Active jobs grouped by last date to apply."
				color="oklch(0.58 0.14 25)"
				accent="oklch(0.58 0.14 25)"
				emptyMessage="No upcoming application deadlines in the next 45 days."
			/>
		</div>
	</section>

	<section class="space-y-3" aria-labelledby="trends-composition-heading">
		<div class="flex items-center gap-2 px-0.5">
			<LayersIcon class="size-4 text-primary" aria-hidden="true" />
			<h2
				id="trends-composition-heading"
				class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
			>
				Composition
			</h2>
		</div>

		<TrendChartAsync
			promise={data.gradeDerived}
			title="Jobs by grade"
			description="Active openings counted by derived BPS / grade."
			color="var(--chart-3)"
			accent="var(--chart-3)"
			emptyMessage="No grade data available."
		/>

		<div class="grid gap-5 lg:grid-cols-2">
			<div class="space-y-3">
				<div class="flex items-center gap-2 px-0.5 text-muted-foreground">
					<GraduationCapIcon class="size-4 text-[var(--chart-4)]" aria-hidden="true" />
					<span class="text-xs font-medium tracking-wide uppercase">Education</span>
				</div>
				<TrendChartAsync
					promise={data.educationLevels}
					title="Jobs by education level"
					description="Comma-separated education values are split, then counted."
					orientation="horizontal"
					color="var(--chart-4)"
					accent="var(--chart-4)"
					emptyMessage="No education level data available."
				/>
			</div>

			<div class="space-y-3">
				<div class="flex items-center gap-2 px-0.5 text-muted-foreground">
					<Building2Icon class="size-4 text-[var(--chart-5)]" aria-hidden="true" />
					<span class="text-xs font-medium tracking-wide uppercase">Donors</span>
				</div>
				<TrendChartAsync
					promise={data.donors}
					title="Jobs by donor"
					description="Active openings counted by donor name."
					orientation="horizontal"
					color="var(--chart-5)"
					accent="var(--chart-5)"
					emptyMessage="No donor data available."
				/>
			</div>
		</div>
	</section>
</div>
