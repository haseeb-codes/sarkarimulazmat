<script lang="ts">
	import { page } from '$app/state';
	import { filtersToHref, type GenderKind } from '$lib/jobs-utils';

	type CategoryLink = {
		slug: string;
		label: string;
		count: number;
	};

	type AdDateLink = {
		value: string;
		label: string;
		count: number;
	};

	type CountLink = {
		label: string;
		count: number;
	};

	type GenderLink = {
		value: GenderKind;
		label: string;
		count: number;
	};

	let {
		adDates,
		postedBy,
		donors,
		genders,
		categories,
		educationLevels
	}: {
		adDates: AdDateLink[];
		postedBy: CountLink[];
		donors: CountLink[];
		genders: GenderLink[];
		categories: CategoryLink[];
		educationLevels: CountLink[];
	} = $props();

	const activeEducation = $derived(page.url.searchParams.get('education_level'));
	const activeAdDate = $derived(page.url.searchParams.get('ad_date'));
	const activePostedBy = $derived(page.url.searchParams.get('posted_by'));
	const activeDonor = $derived(page.url.searchParams.get('donor_name'));
	const activeGender = $derived(page.url.searchParams.get('gender'));
	const path = $derived(page.url.pathname);

	const groupClass =
		'rounded-xl bg-sidebar p-3 text-sidebar-foreground shadow-xs ring-1 ring-sidebar-border lg:flex lg:min-h-0 lg:flex-1 lg:flex-col';
	const headingClass =
		'shrink-0 px-2 text-xs font-bold tracking-wide text-muted-foreground uppercase';
	const listClass =
		'mt-1.5 max-h-40 overflow-y-auto overscroll-contain lg:max-h-none lg:min-h-0 lg:flex-1';
	const linkClass =
		'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent';
	const linkActiveClass =
		'flex items-center justify-between gap-2 rounded-md bg-primary/10 px-2 py-1.5 text-sm font-medium text-primary';

	function formatCount(n: number): string {
		return n.toLocaleString('en-PK');
	}
</script>

{#snippet navLink(href: string, label: string, count: number, active: boolean)}
	<a
		{href}
		class={active ? linkActiveClass : linkClass}
		aria-current={active ? 'page' : undefined}
	>
		<span class="min-w-0 truncate">{label}</span>
		<span class="shrink-0 tabular-nums text-muted-foreground">{formatCount(count)}</span>
	</a>
{/snippet}

<div class="space-y-3 lg:flex lg:h-full lg:flex-col lg:gap-3 lg:space-y-0">
	{#if educationLevels.length}
		<section class={groupClass} aria-labelledby="browse-education-heading">
			<h3 id="browse-education-heading" class={headingClass}>Education level</h3>
			<ul class={listClass}>
				{#each educationLevels as level (level.label)}
					<li>
						{@render navLink(
							filtersToHref({ education_level: level.label }),
							level.label,
							level.count,
							activeEducation === level.label
						)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if genders.length}
		<section class={groupClass} aria-labelledby="browse-gender-heading">
			<h3 id="browse-gender-heading" class={headingClass}>Gender</h3>
			<ul class={listClass}>
				{#each genders as item (item.value)}
					<li>
						{@render navLink(
							filtersToHref({ gender: item.value }),
							item.label,
							item.count,
							activeGender === item.value
						)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if categories.length}
		<section class={groupClass} aria-labelledby="browse-topics-heading">
			<h3 id="browse-topics-heading" class={headingClass}>Topics</h3>
			<ul class={listClass}>
				{#each categories as cat (cat.slug)}
					<li>
						{@render navLink(`/${cat.slug}`, cat.label, cat.count, path === `/${cat.slug}`)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if postedBy.length}
		<section class={groupClass} aria-labelledby="browse-posted-by-heading">
			<h3 id="browse-posted-by-heading" class={headingClass}>Posted by</h3>
			<ul class={listClass}>
				{#each postedBy as org (org.label)}
					<li>
						{@render navLink(
							filtersToHref({ posted_by: org.label }),
							org.label,
							org.count,
							activePostedBy === org.label
						)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if adDates.length}
		<section class={groupClass} aria-labelledby="browse-ad-date-heading">
			<h3 id="browse-ad-date-heading" class={headingClass}>Ad date</h3>
			<ul class={listClass}>
				{#each adDates as adDate (adDate.value)}
					<li>
						{@render navLink(
							filtersToHref({ ad_date: adDate.value }),
							adDate.label,
							adDate.count,
							activeAdDate === adDate.value
						)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if donors.length}
		<section class={groupClass} aria-labelledby="browse-donor-heading">
			<h3 id="browse-donor-heading" class={headingClass}>Donor</h3>
			<ul class={listClass}>
				{#each donors as donor (donor.label)}
					<li>
						{@render navLink(
							filtersToHref({ donor_name: donor.label }),
							donor.label,
							donor.count,
							activeDonor === donor.label
						)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
