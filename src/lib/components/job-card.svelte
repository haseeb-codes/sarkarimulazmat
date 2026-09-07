<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import MultiValueBadges from "$lib/components/multi-value-badges.svelte";
	import GenderIcons from "$lib/components/gender-icons.svelte";
	import DisabilityIcon from "$lib/components/disability-icon.svelte";
	import JobApplyLink from "$lib/components/jobs/job-apply-link.svelte";
	import JobAdModal from "$lib/components/jobs/job-ad-modal.svelte";
	import ShareJobButton from "$lib/components/jobs/share-job-button.svelte";
	import PortalTooltip from "$lib/components/portal-tooltip.svelte";
	import { onFilterLinkClick } from "$lib/filter-nav";
	import { facetBadgeClass } from "$lib/facet-badge";
	import { page } from "$app/state";
	import {
		applicationWindowProgress,
		badgeFilterHref,
		mergeFilterFlagHref,
		formatAgeRange,
		daysUntilDate,
		formatDateLabel,
		formatSalary,
		getJobAdKind,
		getJobAdUrl,
		isRecentAd,
		isClosingSoon,
		isJobExpired,
		isWomenOrTransOnly,
		jobDetailHref,
		type JobSort,
	} from "$lib/jobs-utils";
	import { latestPostedDay } from "$lib/latest-posted-day";
	import ImageIcon from "@lucide/svelte/icons/image";
	import BuildingIcon from "@lucide/svelte/icons/building-2";
	import type { JobCategoryTagRef } from "$lib/job-category-pages";
	import { browser } from "$app/environment";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import {
		ensureTagCounts,
		getCachedTagCount,
		isTagCountSettled,
		subscribeTagCounts,
	} from "$lib/tag-job-counts";

	type JobCardJob = {
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
		tags?: JobCategoryTagRef[];
	};

	let {
		job,
		sort = "newest",
		fresh = false,
		static: isStatic = false,
		layout = "masonry",
	}: {
		job: JobCardJob;
		sort?: JobSort;
		/** Briefly highlight cards appended by infinite scroll */
		fresh?: boolean;
		/** Disable animations (for share/screenshot pages) */
		static?: boolean;
		/** Masonry card vs full-width list row */
		layout?: "masonry" | "list";
	} = $props();

	const expired = $derived(isJobExpired(job.last_date_to_apply));
	const closingSoon = $derived(isClosingSoon(job.last_date_to_apply));
	const recentAd = $derived(isRecentAd(job.ad_date, $latestPostedDay));
	const ageLabel = $derived(formatAgeRange(job.min_age, job.max_age));
	const applyByLabel = $derived(formatDateLabel(job.last_date_to_apply));
	const adDateLabel = $derived(formatDateLabel(job.ad_date));
	const applyByShort = $derived(
		formatDateLabel(job.last_date_to_apply, { includeYear: false }),
	);
	const adDateShort = $derived(formatDateLabel(job.ad_date, { includeYear: false }));
	const daysLeft = $derived(daysUntilDate(job.last_date_to_apply));
	const windowProgress = $derived(
		applicationWindowProgress(job.ad_date, job.last_date_to_apply),
	);
	const daysLeftText = $derived.by(() => {
		if (expired) return null;
		const left = windowProgress?.daysLeft ?? daysLeft;
		if (left == null) return null;
		if (left === 0) return "Closing Today";
		return `${left} ${left === 1 ? "day" : "days"} left`;
	});
	const progressBarClass = $derived(
		expired
			? "bg-status-closed"
			: closingSoon
				? "bg-status-closing"
				: "bg-status-open",
	);
	const progressAriaLabel = $derived.by(() => {
		if (!windowProgress || !adDateShort || !applyByShort) return null;
		const status = expired
			? "Application closed"
			: (daysLeftText ?? `${windowProgress.daysLeft} days left`);
		return `${status}; ${windowProgress.progressPct}% of application window elapsed from ${adDateShort} to ${applyByShort}`;
	});
	const salaryLabel = $derived(formatSalary(job.salary));
	const applyByClass = $derived(
		expired
			? "bg-status-closed-bg text-status-closed"
			: closingSoon
				? "bg-status-closing-bg text-status-closing"
				: "bg-status-open-bg text-status-open",
	);
	const href = $derived(jobDetailHref(job.slug));
	const shareUrl = $derived(new URL(href, page.url.origin).href);
	const departmentHref = $derived(
		job.department
			? badgeFilterHref(job.department, sort, "department", page.url)
			: null,
	);
	const hasSalaryHref = $derived(mergeFilterFlagHref(page.url, "has_salary", sort));
	const womenOrTransOnly = $derived(isWomenOrTransOnly(job.gender));
	const adUrl = $derived(getJobAdUrl(job.supabase_file_path));
	/** Only images preview as a thumbnail; PDFs keep the button. Shown on sm+ in list layout. */
	const adThumbUrl = $derived(
		getJobAdKind(job.supabase_file_path) === "image" ? adUrl : null,
	);
	/** Desktop list uses the thumbnail instead; mobile always gets a View Ad button. */
	const showViewAdBesideShare = $derived(Boolean(adUrl));
	const hideViewAdOnDesktop = $derived(layout === "list" && Boolean(adThumbUrl));
	const categoryTags = $derived(job.tags ?? []);
	const cardAccentClass = $derived(
		fresh
			? "job-card-fresh ring-2 ring-primary/70"
			: womenOrTransOnly
				? "ring-2 ring-pink-400 hover:ring-pink-500 dark:ring-pink-500 dark:hover:ring-pink-400"
				: "hover:border-primary/40",
	);

	let adOpen = $state(false);

	/** Bumped when the shared tag-count cache updates so links re-read counts. */
	let tagCountTick = $state(0);

	$effect(() => {
		if (!browser || isStatic || !categoryTags.length) return;
		ensureTagCounts(categoryTags.map((tag) => tag.slug));
		return subscribeTagCounts(() => {
			tagCountTick += 1;
		});
	});

	function tagJobCount(slug: string): number | undefined {
		void tagCountTick;
		return getCachedTagCount(slug);
	}

	function tagCountPending(slug: string): boolean {
		void tagCountTick;
		return !isTagCountSettled(slug);
	}
</script>

{#snippet facetLabel(text: string)}
	<span class="shrink-0 text-xs font-medium text-muted-foreground">{text}</span>
{/snippet}

{#snippet programBlock()}
	{#if job.project_program_name?.trim()}
		<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
			{@render facetLabel("Program")}
			<MultiValueBadges
				value={job.project_program_name}
				{sort}
				param="program"
				containerClass="contents"
				class="h-auto whitespace-normal break-words overflow-visible leading-4 py-0.5 {facetBadgeClass.program}"
			/>
		</div>
	{/if}
{/snippet}

{#snippet specializationRow()}
	{#if job.degree_area}
		<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
			{@render facetLabel("Specialization")}
			<MultiValueBadges
				value={job.degree_area}
				{sort}
				containerClass="contents"
				class={facetBadgeClass.specialization}
			/>
		</div>
	{/if}
{/snippet}

{#snippet locationRow()}
	{#if job.domicile?.trim()}
		<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
			{@render facetLabel("Domicile")}
			<MultiValueBadges
				value={job.domicile}
				{sort}
				param="domicile"
				containerClass="contents"
				class={facetBadgeClass.domicile}
			/>
		</div>
	{:else if job.place_of_posting}
		<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
			{@render facetLabel("Location")}
			<MultiValueBadges
				value={job.place_of_posting}
				{sort}
				param="place_of_posting"
				containerClass="contents"
				class={facetBadgeClass.location}
			/>
		</div>
	{/if}
{/snippet}

{#snippet degreesRow()}
	{#if job.degrees}
		<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
			{@render facetLabel("Degrees")}
			<MultiValueBadges
				value={job.degrees}
				{sort}
				containerClass="contents"
				class={facetBadgeClass.degree}
			/>
		</div>
	{/if}
{/snippet}

{#snippet departmentLink(nameClass: string)}
	{#if job.department && departmentHref}
		<a
			href={departmentHref}
			data-sveltekit-noscroll
			onclick={onFilterLinkClick}
			class="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline sm:text-sm"
			aria-label="Filter by department {job.department}"
		>
			<PortalTooltip label="Department" class="shrink-0">
				<BuildingIcon class="size-3.5" aria-hidden="true" />
			</PortalTooltip>
			<span class={nameClass} title={job.department}>{job.department}</span>
		</a>
	{/if}
{/snippet}

{#snippet salaryChip()}
	{#if salaryLabel}
		<span class="inline-flex items-center gap-1.5">
			{@render facetLabel("Salary")}
			<Badge
				variant="outline"
				href={hasSalaryHref}
				aria-label="Show jobs with salary listed"
				class="underline-offset-2 hover:underline {facetBadgeClass.salary}"
			>
				Rs. {salaryLabel}
			</Badge>
		</span>
	{/if}
{/snippet}

{#snippet ageChip()}
	{#if job.max_age != null}
		<span class="inline-flex items-center gap-1.5">
			{@render facetLabel("Max Age")}
			<Badge variant="outline" class={facetBadgeClass.age}>
				{job.max_age}y
			</Badge>
		</span>
	{:else if ageLabel}
		<span class="inline-flex items-center gap-1.5">
			{@render facetLabel("Age")}
			<span class="text-foreground">{ageLabel}</span>
		</span>
	{/if}
{/snippet}

<!-- Deadline sits next to the actions wherever there is no rail, so it always ends
     up in the same spot on the card instead of mid-flow -->
{#snippet deadlineProgressBar()}
	{#if windowProgress && adDateShort && applyByShort}
		<div
			class="min-w-0 flex-1 space-y-1.5"
			role="img"
			aria-label={progressAriaLabel}
		>
			<div class="flex items-end justify-between gap-2">
				<div class="min-w-0">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
						Posted
					</p>
					<p class="text-xs font-semibold tabular-nums text-foreground">{adDateShort}</p>
				</div>
				{#if daysLeftText || expired}
					<p
						class="shrink-0 text-center text-[11px] font-semibold {expired
							? 'text-status-closed'
							: closingSoon
								? 'text-status-closing'
								: 'text-status-open'}"
					>
						{expired ? "Closed" : daysLeftText}
					</p>
				{/if}
				<div class="min-w-0 text-right">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
						{expired ? "Closed" : "Deadline"}
					</p>
					<p class="text-xs font-semibold tabular-nums text-foreground">{applyByShort}</p>
				</div>
			</div>
			<div
				class="h-1.5 overflow-hidden rounded-full bg-muted"
				aria-hidden="true"
			>
				<div
					class="h-full rounded-full transition-[width] {progressBarClass}"
					style="width: {expired ? 100 : windowProgress.progressPct}%"
				></div>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet deadlineActionBar(className: string)}
	{@const showProgress = Boolean(windowProgress && adDateShort && applyByShort)}
	{@const showFallbackDates = !showProgress && Boolean(adDateLabel || applyByLabel)}
	<div class="space-y-2 border-t border-border/60 {className}">
		{#if showProgress}
			{@render deadlineProgressBar()}
		{/if}
		{#if showFallbackDates}
			<div class="flex flex-wrap items-center gap-2">
				{#if adDateLabel}
					<span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
						<span class="font-medium">Posted</span>
						<span class="tabular-nums font-semibold text-foreground">{adDateLabel}</span>
					</span>
				{/if}
				{#if applyByLabel}
					<span
						class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 {applyByClass}"
					>
						<span class="text-xs font-semibold tracking-wide">
							{expired ? "Closed" : "Apply by"} {applyByLabel}
						</span>
						{#if daysLeftText}
							<span class="text-[11px] font-medium opacity-90">· {daysLeftText}</span>
						{/if}
					</span>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet adThumb()}
	<button
		type="button"
		onclick={() => (adOpen = true)}
		class="group/thumb relative hidden shrink-0 overflow-hidden rounded-md ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
		aria-label="View advertisement for {job.title ?? 'this posting'}"
	>
		<img
			src={adThumbUrl}
			alt=""
			loading="lazy"
			decoding="async"
			class="h-20 w-16 bg-muted object-cover object-top transition-transform duration-200 group-hover/thumb:scale-105 lg:h-24 lg:w-20"
		/>
		<span
			class="absolute inset-x-0 bottom-0 bg-foreground/75 py-0.5 text-center text-[10px] font-medium text-background opacity-0 transition-opacity group-hover/thumb:opacity-100"
		>
			View ad
		</span>
	</button>
{/snippet}

{#snippet categoryTagLinks(className: string)}
	<div
		class="flex flex-wrap justify-start gap-x-2.5 gap-y-0.5 border-t border-border/60 py-1.5 leading-snug {className}"
	>
		{#each categoryTags as tag (tag.slug)}
			{@const count = tagJobCount(tag.slug)}
			{@const pending = tagCountPending(tag.slug)}
			<a
				href="/{tag.slug}"
				class="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
			>
				All {tag.label} jobs
				{#if pending}
					<span class="inline-flex items-center" aria-hidden="true">
						(<Skeleton class="inline-block h-2.5 w-5 align-middle" />)
					</span>
					<span class="sr-only">(loading count)</span>
				{:else if count != null}
					<span class="tabular-nums">({count.toLocaleString("en-PK")})</span>
				{/if}
				→
			</a>
		{/each}
	</div>
{/snippet}

{#snippet viewAdButton(extraClass = "")}
	<PortalTooltip label="View ad" class={extraClass}>
		<Button
			type="button"
			variant="outline"
			size="sm"
			onclick={() => (adOpen = true)}
		>
			<ImageIcon data-icon="inline-start" />
			<span class="sm:hidden">Ad</span>
			<span class="hidden sm:inline">View Ad</span>
		</Button>
	</PortalTooltip>
{/snippet}

{#snippet statusShareCluster()}
	{#if expired || closingSoon || !isStatic || showViewAdBesideShare}
		<div class="flex shrink-0 flex-wrap items-center justify-end gap-1">
			{#if expired}
				<span
					class="inline-flex h-5 items-center rounded-full bg-status-closed-bg px-2 text-xs font-medium text-status-closed"
				>
					Expired
				</span>
			{:else if closingSoon}
				<span
					class="inline-flex h-5 items-center rounded-full bg-status-closing-bg px-2 text-xs font-medium text-status-closing"
				>
					Closing soon
				</span>
			{/if}
			{#if showViewAdBesideShare || !isStatic}
				<div class="flex flex-row items-center gap-1">
					{#if !isStatic}
						<ShareJobButton url={shareUrl} title={job.title} text={job.department} />
					{/if}
					{#if showViewAdBesideShare}
						{@render viewAdButton(hideViewAdOnDesktop ? "sm:hidden" : "")}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

{#if adUrl}
	<JobAdModal
		bind:open={adOpen}
		title={job.title}
		supabaseFilePath={job.supabase_file_path ?? null}
	/>
{/if}

{#if layout === "list"}
	<Card.Root
		size="sm"
		class="gap-0 py-0 transition-[color,border-color,box-shadow] hover:shadow-md {cardAccentClass} {expired
			? 'opacity-70'
			: ''}"
		data-fresh={fresh ? "true" : undefined}
	>
		<div
			class="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-start sm:gap-3 sm:px-4 sm:py-2.5"
		>
			{#if adThumbUrl}
				{@render adThumb()}
			{/if}

			<div class="flex min-w-0 flex-1 items-start gap-2">
				<div class="min-w-0 flex-1 space-y-1.5">
					{#if recentAd || job.donor_name}
						<div class="flex flex-wrap items-center gap-1.5">
							{#if recentAd}
								<span
									class="inline-flex h-5 items-center rounded-full bg-green-100 px-2 text-xs font-semibold text-green-800 dark:bg-green-950/70 dark:text-green-300 {isStatic
										? ''
										: 'animate-[pulse_0.5s_cubic-bezier(0.4,0,0.6,1)_infinite]'}"
								>
									New
								</span>
							{/if}
							{#if job.donor_name}
								<span
									class="inline-flex h-5 max-w-[12rem] items-center truncate rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
									title={job.donor_name}
								>
									{job.donor_name}
								</span>
							{/if}
						</div>
					{/if}

					<div class="flex flex-wrap items-start gap-1.5">
						<a
							{href}
							class="group min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span
								class="text-base font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary"
							>
								{job.title ?? "Untitled posting"}
							</span>
						</a>
						{#if job.grade}
							<Badge
								variant="secondary"
								href={badgeFilterHref(job.grade, sort, "grade", page.url)}
								aria-label="Filter by grade {job.grade}"
								class="mt-0.5 shrink-0 underline-offset-2 hover:underline"
							>
								{job.grade}
							</Badge>
						{/if}
						<span class="mt-0.5 inline-flex shrink-0 items-center gap-0.5">
							<GenderIcons gender={job.gender} />
							<DisabilityIcon show={Boolean(job.disability_quota)} />
						</span>
					</div>

					{@render departmentLink("truncate")}

					{@render programBlock()}

					{#if job.degrees || job.degree_area}
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
							{@render degreesRow()}
							{@render specializationRow()}
						</div>
					{/if}

					<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
						{@render locationRow()}
						{@render salaryChip()}
						{@render ageChip()}
					</div>
					<JobApplyLink
						applicationOnlineAddress={job.application_online_address}
						email={job.email}
						urlWebTitle={job.url_web_title}
					/>
				</div>
				{@render statusShareCluster()}
			</div>
		</div>

		{#if applyByLabel || adDateLabel}
			{@render deadlineActionBar("px-2.5 py-1.5 sm:px-4")}
		{/if}

		{#if !isStatic && categoryTags.length}
			{@render categoryTagLinks("px-2.5 sm:px-4")}
		{/if}
	</Card.Root>
{:else}
	<Card.Root
		size="sm"
		class="h-full transition-[color,border-color,box-shadow] hover:shadow-md {cardAccentClass} {expired
			? 'opacity-70'
			: ''} {!isStatic && categoryTags.length ? 'pb-0' : ''}"
		data-fresh={fresh ? "true" : undefined}
	>
		<Card.Header class="gap-1 pb-1.5 sm:gap-1.5 sm:pb-2">
			{#if recentAd || job.donor_name}
				<div class="mb-1 flex flex-wrap items-center gap-1.5">
					{#if recentAd}
						<span
							class="inline-flex h-5 items-center rounded-full bg-green-100 px-2 text-xs font-semibold text-green-800 dark:bg-green-950/70 dark:text-green-300 {isStatic
								? ''
								: 'animate-[pulse_0.5s_cubic-bezier(0.4,0,0.6,1)_infinite]'}"
						>
							New
						</span>
					{/if}
					{#if job.donor_name}
						<span
							class="inline-flex h-5 max-w-full items-center truncate rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 {isStatic
								? ''
								: 'animate-[pulse_0.5s_cubic-bezier(0.4,0,0.6,1)_infinite]'}"
						>
							{job.donor_name}
						</span>
					{/if}
				</div>
			{/if}
			<div class="flex flex-wrap items-start justify-between gap-2">
				<Card.Title
					class="flex min-w-0 flex-1 flex-wrap items-start gap-1.5 text-base! font-semibold tracking-tight leading-snug text-foreground"
				>
					<a
						{href}
						class="min-w-0 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
					>
						{job.title ?? "Untitled posting"}
					</a>
					{#if job.grade}
						<Badge
							variant="secondary"
							href={badgeFilterHref(job.grade, sort, "grade", page.url)}
							aria-label="Filter by grade {job.grade}"
							class="mt-0.5 shrink-0 text-xs! font-medium underline-offset-2 hover:underline"
						>
							{job.grade}
						</Badge>
					{/if}
					<span class="mt-0.5 inline-flex items-center gap-0.5">
						<GenderIcons gender={job.gender} />
						<DisabilityIcon show={Boolean(job.disability_quota)} />
					</span>
				</Card.Title>
				<div class="flex shrink-0 flex-wrap items-start justify-end gap-1.5">
					{#if expired}
						<span
							class="inline-flex h-5 items-center rounded-full bg-status-closed-bg px-2 text-xs font-medium text-status-closed"
						>
							Expired
						</span>
					{:else if closingSoon}
						<span
							class="inline-flex h-5 items-center rounded-full bg-status-closing-bg px-2 text-xs font-medium text-status-closing"
						>
							Closing soon
						</span>
					{/if}
					{#if showViewAdBesideShare || !isStatic}
						<div class="flex flex-row items-center gap-1">
							{#if !isStatic}
								<ShareJobButton url={shareUrl} title={job.title} text={job.department} />
							{/if}
							{#if showViewAdBesideShare}
								{@render viewAdButton()}
							{/if}
						</div>
					{/if}
				</div>
			</div>
			{@render departmentLink("line-clamp-2")}
		</Card.Header>

		<Card.Content class="space-y-2 pt-0">
			{@render programBlock()}
			{#if job.degrees || job.degree_area}
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
					{@render degreesRow()}
					{@render specializationRow()}
				</div>
			{/if}
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
				{@render locationRow()}
				{@render salaryChip()}
				{@render ageChip()}
			</div>
			<JobApplyLink
				applicationOnlineAddress={job.application_online_address}
				email={job.email}
				urlWebTitle={job.url_web_title}
			/>
			{#if applyByLabel || adDateLabel}
				{@render deadlineActionBar("pt-1.5")}
			{/if}
			{#if !isStatic && categoryTags.length}
				{@render categoryTagLinks("-mt-2")}
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
