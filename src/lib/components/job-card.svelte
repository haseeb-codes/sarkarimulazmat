<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import MultiValueBadges from "$lib/components/multi-value-badges.svelte";
	import GenderIcons from "$lib/components/gender-icons.svelte";
	import DisabilityIcon from "$lib/components/disability-icon.svelte";
	import JobAdModal from "$lib/components/jobs/job-ad-modal.svelte";
	import ShareJobButton from "$lib/components/jobs/share-job-button.svelte";
	import { onFilterLinkClick } from "$lib/filter-nav";
	import { page } from "$app/state";
	import {
		badgeFilterHref,
		mergeFilterFlagHref,
		formatAgeRange,
		daysUntilDate,
		formatDateLabel,
		formatSalary,
		getJobAdUrl,
		getJobApplyLink,
		isRecentAd,
		isClosingSoon,
		isJobExpired,
		isWomenOrTransOnly,
		jobDetailHref,
		type JobSort,
	} from "$lib/jobs-utils";
	import ImageIcon from "@lucide/svelte/icons/image";
	import BuildingIcon from "@lucide/svelte/icons/building-2";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import MailIcon from "@lucide/svelte/icons/mail";

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
	const recentAd = $derived(isRecentAd(job.ad_date));
	const ageLabel = $derived(formatAgeRange(job.min_age, job.max_age));
	const applyByLabel = $derived(formatDateLabel(job.last_date_to_apply));
	const daysLeft = $derived(daysUntilDate(job.last_date_to_apply));
	const daysLeftLabel = $derived(
		!expired && daysLeft != null && daysLeft < 4
			? daysLeft === 0
				? "Expiring Today"
				: `(${daysLeft} ${daysLeft === 1 ? "day" : "days"} left)`
			: null,
	);
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
	const applyLink = $derived(
		getJobApplyLink(job.application_online_address, job.email),
	);
	const cardAccentClass = $derived(
		fresh
			? "job-card-fresh ring-2 ring-primary/70"
			: womenOrTransOnly
				? "ring-2 ring-pink-400 hover:ring-pink-500 dark:ring-pink-500 dark:hover:ring-pink-400"
				: "hover:border-primary/40",
	);

	let adOpen = $state(false);
</script>

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
		class="transition-colors {cardAccentClass} {expired ? 'opacity-70' : ''}"
		data-fresh={fresh ? "true" : undefined}
	>
		<div
			class="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4 sm:px-4 sm:py-3"
		>
			<div class="min-w-0 flex-1 space-y-2">
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
					{#if job.grade}
						<Badge
							variant="secondary"
							href={badgeFilterHref(job.grade, sort, "grade", page.url)}
							aria-label="Filter by grade {job.grade}"
							class="underline-offset-2 hover:underline"
						>
							{job.grade}
						</Badge>
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

				<div class="flex items-start gap-1.5">
					<a
						{href}
						class="group min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span
							class="text-base font-semibold tracking-tight text-foreground group-hover:text-primary"
						>
							{job.title ?? "Untitled posting"}
						</span>
					</a>
					<span class="mt-0.5 inline-flex shrink-0 items-center gap-0.5">
						<GenderIcons gender={job.gender} />
						<DisabilityIcon show={Boolean(job.disability_quota)} />
					</span>
				</div>

				{#if job.department && departmentHref}
					<a
						href={departmentHref}
						data-sveltekit-noscroll
						onclick={onFilterLinkClick}
						title={job.department}
						class="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline sm:text-sm"
						aria-label="Filter by department {job.department}"
					>
						<BuildingIcon class="size-3.5 shrink-0" aria-hidden="true" />
						<span class="truncate">{job.department}</span>
					</a>
				{/if}

				{#if job.project_program_name?.trim()}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Program</p>
						<MultiValueBadges
							value={job.project_program_name}
							{sort}
							param="program"
							class="h-auto whitespace-normal break-words overflow-visible leading-4 py-1"
						/>
					</div>
				{/if}
				{#if job.degree_area}
					<div class="flex w-full min-w-0 flex-wrap items-center gap-1.5">
						<span class="shrink-0 text-xs font-medium text-muted-foreground"
							>Specialization</span
						>
						<MultiValueBadges
							value={job.degree_area}
							{sort}
							containerClass="contents"
						/>
					</div>
				{/if}
				<div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
					{#if job.domicile?.trim()}
						<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
							<span class="shrink-0 text-xs font-medium text-muted-foreground"
								>Domicile</span
							>
							<MultiValueBadges
								value={job.domicile}
								{sort}
								param="domicile"
								containerClass="contents"
							/>
						</div>
					{:else if job.place_of_posting}
						<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
							<span class="shrink-0 text-xs font-medium text-muted-foreground"
								>Location</span
							>
							<MultiValueBadges
								value={job.place_of_posting}
								{sort}
								param="place_of_posting"
								containerClass="contents"
								class="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-900/60"
							/>
						</div>
					{/if}
					{#if job.degrees}
						<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
							<span class="shrink-0 text-xs font-medium text-muted-foreground"
								>Degrees</span
							>
							<MultiValueBadges
								value={job.degrees}
								{sort}
								containerClass="contents"
							/>
						</div>
					{/if}
					{#if salaryLabel}
						<span class="inline-flex items-center gap-1.5">
							<span class="text-xs font-medium text-muted-foreground">Salary</span>
							<Badge
								variant="outline"
								href={hasSalaryHref}
								aria-label="Show jobs with salary listed"
								class="border-emerald-200 bg-emerald-50 text-emerald-900 underline-offset-2 hover:bg-emerald-100 hover:underline dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
							>
								Rs. {salaryLabel}
							</Badge>
						</span>
					{/if}
					{#if job.max_age != null}
						<span class="inline-flex items-center gap-1.5">
							<span class="text-xs font-medium text-muted-foreground">Max Age</span>
							<Badge
								variant="outline"
								class="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
							>
								{job.max_age}y
							</Badge>
						</span>
					{:else if ageLabel}
						<span class="inline-flex items-center gap-1.5">
							<span class="text-xs font-medium text-muted-foreground">Age</span>
							<span class="text-foreground">{ageLabel}</span>
						</span>
					{/if}
					{#if applyByLabel}
						<span class="inline-flex items-center gap-1.5">
							<span class="text-xs font-medium text-muted-foreground">Deadline</span>
							<span
								class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide {applyByClass}"
							>
								{applyByLabel}{#if daysLeftLabel}&nbsp;{daysLeftLabel}{/if}
							</span>
							{#if expired}
								<span class="inline-flex h-5 items-center rounded-full bg-status-closed-bg px-2 text-xs font-medium text-status-closed">
									Expired
								</span>
							{/if}
						</span>
					{/if}
					{#if applyLink}
						<span class="inline-flex min-w-0 max-w-full items-center gap-1.5">
							<span class="text-xs font-medium text-muted-foreground">Apply</span>
							<a
								href={applyLink.href}
								target={applyLink.kind === "url" ? "_blank" : undefined}
								rel={applyLink.kind === "url" ? "noopener noreferrer" : undefined}
								class="inline-flex min-w-0 max-w-full items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
							>
								{#if applyLink.kind === "email"}
									<MailIcon class="size-3.5 shrink-0" />
								{:else}
									<ExternalLinkIcon class="size-3.5 shrink-0" />
								{/if}
								<span class="truncate">{applyLink.label}</span>
							</a>
						</span>
					{/if}
				</div>
			</div>

			<div class="flex shrink-0 gap-2 sm:flex-col sm:items-stretch lg:flex-row">
				{#if adUrl}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => (adOpen = true)}
					>
						<ImageIcon data-icon="inline-start" />
						View Ad
					</Button>
				{/if}
				<ShareJobButton url={shareUrl} title={job.title} text={job.department} />
			</div>
		</div>
	</Card.Root>
{:else}
	<Card.Root
		size="sm"
		class="h-full transition-colors {cardAccentClass} {expired
			? 'opacity-70'
			: ''}"
		data-fresh={fresh ? "true" : undefined}
	>
		<Card.Header class="gap-1.5 pb-2">
			{#if recentAd || job.donor_name}
				<div class="mb-1.5 flex flex-wrap items-center gap-1.5">
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
					class="flex items-start gap-1.5 text-base! font-semibold tracking-tight leading-snug text-foreground md:text-lg!"
				>
					<a
						{href}
						class="min-w-0 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
					>
						{job.title ?? "Untitled posting"}
					</a>
					<span class="mt-0.5 inline-flex items-center gap-0.5">
						<GenderIcons gender={job.gender} />
						<DisabilityIcon show={Boolean(job.disability_quota)} />
					</span>
				</Card.Title>
				<div class="flex flex-wrap gap-1.5">
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
					{#if job.grade}
						<Badge
							variant="secondary"
							href={badgeFilterHref(job.grade, sort, "grade", page.url)}
							aria-label="Filter by grade {job.grade}"
							class="underline-offset-2 hover:underline"
						>
							{job.grade}
						</Badge>
					{/if}
				</div>
			</div>
			{#if job.department && departmentHref}
				<a
					href={departmentHref}
					data-sveltekit-noscroll
					onclick={onFilterLinkClick}
					title={job.department}
					class="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline md:text-sm"
					aria-label="Filter by department {job.department}"
				>
					<BuildingIcon class="size-3.5 shrink-0" aria-hidden="true" />
					<span class="line-clamp-2">{job.department}</span>
				</a>
			{/if}
		</Card.Header>

		<Card.Content class="space-y-2.5 pt-0">
			{#if job.project_program_name?.trim()}
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground">Program</p>
					<MultiValueBadges
						value={job.project_program_name}
						{sort}
						param="program"
						class="h-auto whitespace-normal break-words overflow-visible leading-4 py-1"
					/>
				</div>
			{/if}
			{#if job.degree_area}
				<div class="flex w-full min-w-0 flex-wrap items-center gap-1.5">
					<span class="shrink-0 text-xs font-medium text-muted-foreground"
						>Specialization</span
					>
					<MultiValueBadges
						value={job.degree_area}
						{sort}
						containerClass="contents"
					/>
				</div>
			{/if}
			<div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
				{#if job.domicile?.trim()}
					<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
						<span class="shrink-0 text-xs font-medium text-muted-foreground"
							>Domicile</span
						>
						<MultiValueBadges
							value={job.domicile}
							{sort}
							param="domicile"
							containerClass="contents"
						/>
					</div>
				{:else if job.place_of_posting}
					<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
						<span class="shrink-0 text-xs font-medium text-muted-foreground"
							>Location</span
						>
						<MultiValueBadges
							value={job.place_of_posting}
							{sort}
							param="place_of_posting"
							containerClass="contents"
							class="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-900/60"
						/>
					</div>
				{/if}
				{#if job.degrees}
					<div class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
						<span class="shrink-0 text-xs font-medium text-muted-foreground"
							>Degrees</span
						>
						<MultiValueBadges
							value={job.degrees}
							{sort}
							containerClass="contents"
						/>
					</div>
				{/if}
				{#if salaryLabel}
					<span class="inline-flex items-center gap-1.5">
						<span class="text-xs font-medium text-muted-foreground">Salary</span>
						<Badge
							variant="outline"
							href={hasSalaryHref}
							aria-label="Show jobs with salary listed"
							class="border-emerald-200 bg-emerald-50 text-emerald-900 underline-offset-2 hover:bg-emerald-100 hover:underline dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
						>
							Rs. {salaryLabel}
						</Badge>
					</span>
				{/if}
				{#if job.max_age != null}
					<span class="inline-flex items-center gap-1.5">
						<span class="text-xs font-medium text-muted-foreground">Max Age</span>
						<Badge
							variant="outline"
							class="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
						>
							{job.max_age}y
						</Badge>
					</span>
				{:else if ageLabel}
					<span class="inline-flex items-center gap-1.5">
						<span class="text-xs font-medium text-muted-foreground">Age</span>
						<span class="text-foreground">{ageLabel}</span>
					</span>
				{/if}
				{#if applyByLabel}
					<span class="inline-flex items-center gap-1.5">
						<span class="text-xs font-medium text-muted-foreground">Deadline</span>
						<span
							class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide {applyByClass}"
						>
							{applyByLabel}{#if daysLeftLabel}&nbsp;{daysLeftLabel}{/if}
						</span>
						{#if expired}
							<span class="inline-flex h-5 items-center rounded-full bg-status-closed-bg px-2 text-xs font-medium text-status-closed">
								Expired
							</span>
						{/if}
					</span>
				{/if}
				{#if applyLink}
					<span class="inline-flex min-w-0 max-w-full items-center gap-1.5">
						<span class="text-xs font-medium text-muted-foreground">Apply</span>
						<a
							href={applyLink.href}
							target={applyLink.kind === "url" ? "_blank" : undefined}
							rel={applyLink.kind === "url" ? "noopener noreferrer" : undefined}
							class="inline-flex min-w-0 max-w-full items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
						>
							{#if applyLink.kind === "email"}
								<MailIcon class="size-3.5 shrink-0" />
							{:else}
								<ExternalLinkIcon class="size-3.5 shrink-0" />
							{/if}
							<span class="truncate">{applyLink.label}</span>
						</a>
					</span>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if adUrl}
					<Button
						type="button"
						variant="outline"
						size="sm"
						class="min-w-0 flex-1"
						onclick={() => (adOpen = true)}
					>
						<ImageIcon data-icon="inline-start" />
						View Ad
					</Button>
				{/if}
				<ShareJobButton
					url={shareUrl}
					title={job.title}
					text={job.department}
					class={adUrl ? "shrink-0" : "w-full"}
				/>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
