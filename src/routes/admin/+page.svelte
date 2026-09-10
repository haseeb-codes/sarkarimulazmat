<script lang="ts">
	import TrendChartAsync from '$lib/components/trends/trend-chart-async.svelte';
	import RecentSearches from '$lib/components/admin/recent-searches.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import type { AdminOverview } from '$lib/admin-types';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import UsersIcon from '@lucide/svelte/icons/users';
	import SearchIcon from '@lucide/svelte/icons/search';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MonitorSmartphoneIcon from '@lucide/svelte/icons/monitor-smartphone';
	import FilterIcon from '@lucide/svelte/icons/filter';

	let { data } = $props();

	const overviewCards = [
		{ key: 'users', label: 'Users', href: '#users' },
		{ key: 'visitors', label: 'Visitors', href: '#traffic' },
		{ key: 'pageViews', label: 'Page views', href: '#traffic' },
		{ key: 'searches', label: 'Searches', href: '#searches' },
		{ key: 'emails', label: 'Contact messages', href: '#messages' },
		{ key: 'savedSearches', label: 'Saved searches', href: '#searches' },
		{ key: 'jobInterests', label: 'Job interests', href: '#users' },
		{ key: 'ads', label: 'Ads', href: '#overview' },
		{ key: 'categoryPages', label: 'Category pages', href: '#overview' }
	] as const;

	function formatNumber(n: number): string {
		return new Intl.NumberFormat('en-PK').format(n);
	}

	function formatDateTime(d: Date | string): string {
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toLocaleString('en-PK', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	function overviewValue(overview: AdminOverview, key: (typeof overviewCards)[number]['key']) {
		return overview[key];
	}
</script>

<svelte:head>
	<title>Admin dashboard</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-10">
	<section id="overview" class="space-y-4" aria-labelledby="admin-overview-heading">
		<div class="space-y-1">
			<h1 id="admin-overview-heading" class="text-2xl font-semibold tracking-tight">
				Data summary
			</h1>
			<p class="max-w-2xl text-sm text-muted-foreground">
				Interactive totals and breakdowns from profiles, visitors, page views, searches, contact
				messages, and ads — excluding job postings.
			</p>
		</div>

		{#await data.overview}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{#each overviewCards as card (card.key)}
					<div class="rounded-xl border border-border bg-card px-4 py-3">
						<Skeleton class="mb-2 h-3 w-20" />
						<Skeleton class="h-7 w-16" />
					</div>
				{/each}
			</div>
		{:then overview}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{#each overviewCards as card (card.key)}
					<a
						href={card.href}
						class="rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
					>
						<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							{card.label}
						</p>
						<p class="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
							{formatNumber(overviewValue(overview, card.key))}
						</p>
					</a>
				{/each}
			</div>

			<p class="text-xs text-muted-foreground">
				{formatNumber(overview.emailSubscribedUsers)} email-subscribed users ·
				{formatNumber(overview.linkedVisitors)} visitors linked to accounts
			</p>
		{/await}
	</section>

	<section id="traffic" class="space-y-3" aria-labelledby="admin-traffic-heading">
		<div class="flex items-center gap-2 px-0.5">
			<ActivityIcon class="size-4 text-primary" aria-hidden="true" />
			<h2
				id="admin-traffic-heading"
				class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
			>
				Traffic
			</h2>
		</div>
		<div class="grid gap-5 lg:grid-cols-2">
			<TrendChartAsync
				promise={data.pageViewsLast14Days}
				title="Page views — last 14 days"
				color="var(--chart-1)"
				accent="var(--chart-1)"
				emptyMessage="No page views in the last 14 days."
			/>
			<TrendChartAsync
				promise={data.uniqueIpsLast14Days}
				title="Unique IPs — last 14 days"
				description="Distinct IP addresses with at least one page view each day."
				color="var(--chart-2)"
				accent="var(--chart-2)"
				emptyMessage="No IP addresses recorded in the last 14 days."
			/>
		</div>
		<TrendChartAsync
			promise={data.newVisitorsLast30Days}
			title="New visitors — last 30 days"
			color="var(--chart-2)"
			accent="var(--chart-2)"
			emptyMessage="No new visitors in the last 30 days."
		/>
		<TrendChartAsync
			promise={data.topPaths}
			title="Top paths"
			description="Most viewed routes by page-view count."
			orientation="horizontal"
			color="var(--chart-1)"
			accent="var(--chart-1)"
			emptyMessage="No page-view path data yet."
		/>
	</section>

	<section id="searches" class="space-y-3" aria-labelledby="admin-searches-heading">
		<div class="flex items-center gap-2 px-0.5">
			<SearchIcon class="size-4 text-primary" aria-hidden="true" />
			<h2
				id="admin-searches-heading"
				class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
			>
				Searches
			</h2>
		</div>
		<div class="grid gap-5 lg:grid-cols-2">
			<TrendChartAsync
				promise={data.searchesLast14Days}
				title="Searches — last 14 days"
				color="var(--chart-3)"
				accent="var(--chart-3)"
				emptyMessage="No searches in the last 14 days."
			/>
			<TrendChartAsync
				promise={data.searchKeywords}
				title="Top search keywords"
				description="From the most recent 2,000 search logs."
				orientation="horizontal"
				color="var(--chart-3)"
				accent="var(--chart-3)"
				emptyMessage="No keyword searches logged yet."
			/>
		</div>

		<div class="space-y-3" aria-labelledby="admin-filter-usage-heading">
			<div class="flex items-center gap-2 px-0.5">
				<FilterIcon class="size-4 text-[var(--chart-3)]" aria-hidden="true" />
				<h3
					id="admin-filter-usage-heading"
					class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
				>
					Filter usage
				</h3>
			</div>
			<div class="grid gap-5 lg:grid-cols-2">
				<TrendChartAsync
					promise={data.filterCategories}
					title="Filter types used most"
					description="How often each filter category appears in recent searches."
					orientation="horizontal"
					color="var(--chart-3)"
					accent="var(--chart-3)"
					emptyMessage="No applied filters logged yet."
				/>
				<TrendChartAsync
					promise={data.topFilterValues}
					title="Most applied filter values"
					description="Concrete chip values users pick most often."
					orientation="horizontal"
					color="oklch(0.58 0.14 25)"
					accent="oklch(0.58 0.14 25)"
					emptyMessage="No filter values logged yet."
				/>
			</div>
		</div>

		<RecentSearches promise={data.recentSearches} />
	</section>

	<section id="devices" class="space-y-3" aria-labelledby="admin-devices-heading">
		<div class="flex items-center gap-2 px-0.5">
			<MonitorSmartphoneIcon class="size-4 text-primary" aria-hidden="true" />
			<h2
				id="admin-devices-heading"
				class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
			>
				Devices
			</h2>
		</div>
		<div class="grid gap-5 lg:grid-cols-3">
			<TrendChartAsync
				promise={data.deviceTypes}
				title="Device type"
				orientation="horizontal"
				color="var(--chart-4)"
				accent="var(--chart-4)"
				emptyMessage="No device data yet."
			/>
			<TrendChartAsync
				promise={data.browsers}
				title="Browser"
				orientation="horizontal"
				color="var(--chart-4)"
				accent="var(--chart-4)"
				emptyMessage="No browser data yet."
			/>
			<TrendChartAsync
				promise={data.os}
				title="Operating system"
				orientation="horizontal"
				color="var(--chart-4)"
				accent="var(--chart-4)"
				emptyMessage="No OS data yet."
			/>
		</div>
	</section>

	<section id="users" class="space-y-3" aria-labelledby="admin-users-heading">
		<div class="flex items-center gap-2 px-0.5">
			<UsersIcon class="size-4 text-primary" aria-hidden="true" />
			<h2
				id="admin-users-heading"
				class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
			>
				Users
			</h2>
		</div>
		<div class="grid gap-5 lg:grid-cols-2">
			<TrendChartAsync
				promise={data.newUsersLast30Days}
				title="New users — last 30 days"
				color="var(--chart-5)"
				accent="var(--chart-5)"
				emptyMessage="No new users in the last 30 days."
			/>
			<TrendChartAsync
				promise={data.jobInterestKeywords}
				title="Top job-interest keywords"
				description="Keywords entered during onboarding."
				orientation="horizontal"
				color="var(--chart-5)"
				accent="var(--chart-5)"
				emptyMessage="No job-interest keywords yet."
			/>
		</div>
		<div class="grid gap-5 lg:grid-cols-3">
			<TrendChartAsync
				promise={data.genders}
				title="Gender"
				orientation="horizontal"
				color="var(--chart-2)"
				accent="var(--chart-2)"
				emptyMessage="No gender data yet."
			/>
			<TrendChartAsync
				promise={data.degrees}
				title="Highest degree"
				orientation="horizontal"
				color="var(--chart-2)"
				accent="var(--chart-2)"
				emptyMessage="No degree data yet."
			/>
			<TrendChartAsync
				promise={data.religions}
				title="Religion"
				orientation="horizontal"
				color="var(--chart-2)"
				accent="var(--chart-2)"
				emptyMessage="No religion data yet."
			/>
		</div>
	</section>

	<section id="messages" class="space-y-3" aria-labelledby="admin-messages-heading">
		<div class="flex items-center gap-2 px-0.5">
			<MailIcon class="size-4 text-primary" aria-hidden="true" />
			<h2
				id="admin-messages-heading"
				class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
			>
				Contact messages
			</h2>
		</div>

		<div class="overflow-hidden rounded-2xl border border-border">
			<div class="border-b border-border px-4 py-3">
				<h3 class="text-sm font-semibold">Recent submissions</h3>
				<p class="text-xs text-muted-foreground">Messages from the /contact form.</p>
			</div>
			{#await data.recentEmails}
				<div class="space-y-2 p-4">
					{#each Array.from({ length: 5 }) as _, i (i)}
						<Skeleton class="h-16 w-full" />
					{/each}
				</div>
			{:then rows}
				{#if rows.length === 0}
					<p class="px-4 py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
				{:else}
					<div class="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>When</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead>Message</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each rows as row (row.id)}
									<TableRow>
										<TableCell class="whitespace-nowrap align-top text-muted-foreground">
											{formatDateTime(row.created_at)}
										</TableCell>
										<TableCell class="align-top">
											<div class="font-medium">{row.name}</div>
											{#if row.email}
												<div class="text-xs text-muted-foreground">{row.email}</div>
											{/if}
										</TableCell>
										<TableCell class="align-top whitespace-nowrap">{row.contact}</TableCell>
										<TableCell class="max-w-md align-top whitespace-pre-wrap text-sm">
											{row.message}
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			{/await}
		</div>
	</section>
</div>
