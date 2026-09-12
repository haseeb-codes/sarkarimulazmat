import db from '$lib/server/db';
import type { TrendPoint } from '$lib/trends-types';
import type { AdminEmailRow, AdminOverview, AdminSearchRow } from '$lib/admin-types';
import {
	describeSearchLogFilters,
	searchLogFiltersToParams,
	searchLogHref,
	searchLogKeyword,
	searchLogParamEntries
} from '$lib/admin-search-filters';
import { repairDegreeAreasHtmlCorruption } from '$lib/jobs-utils';

export type { AdminEmailRow, AdminOverview, AdminSearchRow };

type DayCountRow = {
	day: Date;
	count: number;
};

function utcDateOnly(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
	const next = new Date(d);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function toDateKey(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function formatDayMonthLabel(iso: string): string {
	const [, m, day] = iso.split('-').map(Number);
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	] as const;
	return `${String(day).padStart(2, '0')}-${months[m - 1]}`;
}

function fillDailySeries(start: Date, end: Date, rows: DayCountRow[]): TrendPoint[] {
	const byDay = new Map<string, number>();
	for (const row of rows) {
		const key = toDateKey(utcDateOnly(new Date(row.day)));
		byDay.set(key, Number(row.count) || 0);
	}

	const points: TrendPoint[] = [];
	for (let d = new Date(start); d <= end; d = addUtcDays(d, 1)) {
		const key = toDateKey(d);
		points.push({
			label: formatDayMonthLabel(key),
			count: byDay.get(key) ?? 0
		});
	}
	return points;
}

function labelOrUnknown(value: string | null | undefined): string {
	const trimmed = value?.trim();
	return trimmed ? trimmed : 'Unknown';
}

function groupCountToPoints(
	rows: Array<{ key: string | null; count: number }>,
	limit = 12
): TrendPoint[] {
	return rows
		.map((row) => ({ label: labelOrUnknown(row.key), count: row.count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

async function dailyCounts(
	table: 'page_views' | 'search_logs' | 'user_profiles' | 'visitors',
	days: number
): Promise<TrendPoint[]> {
	const today = utcDateOnly(new Date());
	const start = addUtcDays(today, -(days - 1));

	let rows: DayCountRow[];
	switch (table) {
		case 'page_views':
			rows = await db.$queryRaw<DayCountRow[]>`
				SELECT (created_at AT TIME ZONE 'UTC')::date AS day, COUNT(*)::int AS count
				FROM page_views
				WHERE created_at >= ${start}
				GROUP BY 1
				ORDER BY 1
			`;
			break;
		case 'search_logs':
			rows = await db.$queryRaw<DayCountRow[]>`
				SELECT (created_at AT TIME ZONE 'UTC')::date AS day, COUNT(*)::int AS count
				FROM search_logs
				WHERE created_at >= ${start}
				GROUP BY 1
				ORDER BY 1
			`;
			break;
		case 'user_profiles':
			rows = await db.$queryRaw<DayCountRow[]>`
				SELECT (created_at AT TIME ZONE 'UTC')::date AS day, COUNT(*)::int AS count
				FROM user_profiles
				WHERE created_at >= ${start}
				GROUP BY 1
				ORDER BY 1
			`;
			break;
		case 'visitors':
			rows = await db.$queryRaw<DayCountRow[]>`
				SELECT (first_seen_at AT TIME ZONE 'UTC')::date AS day, COUNT(*)::int AS count
				FROM visitors
				WHERE first_seen_at >= ${start}
				GROUP BY 1
				ORDER BY 1
			`;
			break;
	}

	return fillDailySeries(start, today, rows);
}

export async function getAdminOverview(): Promise<AdminOverview> {
	const [
		users,
		visitors,
		pageViews,
		searches,
		emails,
		savedSearches,
		jobInterests,
		categoryPages,
		ads,
		emailSubscribedUsers,
		linkedVisitors
	] = await Promise.all([
		db.userProfile.count(),
		db.visitor.count(),
		db.pageView.count(),
		db.searchLog.count(),
		db.email.count(),
		db.savedSearch.count(),
		db.userJobInterest.count(),
		db.categoryPage.count(),
		db.ads.count(),
		db.userProfile.count({ where: { email_subscribed: true } }),
		db.visitor.count({ where: { user_id: { not: null } } })
	]);

	return {
		users,
		visitors,
		pageViews,
		searches,
		emails,
		savedSearches,
		jobInterests,
		categoryPages,
		ads,
		emailSubscribedUsers,
		linkedVisitors
	};
}

export function getPageViewsLast14Days(): Promise<TrendPoint[]> {
	return dailyCounts('page_views', 14);
}

/** Distinct non-null IP addresses seen in page views per UTC day. */
export async function getUniqueIpsLast14Days(): Promise<TrendPoint[]> {
	const today = utcDateOnly(new Date());
	const start = addUtcDays(today, -13);

	const rows = await db.$queryRaw<DayCountRow[]>`
		SELECT (created_at AT TIME ZONE 'UTC')::date AS day,
			COUNT(DISTINCT ip_address)::int AS count
		FROM page_views
		WHERE created_at >= ${start}
			AND ip_address IS NOT NULL
		GROUP BY 1
		ORDER BY 1
	`;

	return fillDailySeries(start, today, rows);
}

export function getSearchesLast14Days(): Promise<TrendPoint[]> {
	return dailyCounts('search_logs', 14);
}

export function getNewUsersLast30Days(): Promise<TrendPoint[]> {
	return dailyCounts('user_profiles', 30);
}

export function getNewVisitorsLast30Days(): Promise<TrendPoint[]> {
	return dailyCounts('visitors', 30);
}

export async function getTopPaths(limit = 15): Promise<TrendPoint[]> {
	const rows = await db.pageView.groupBy({
		by: ['path'],
		_count: { _all: true },
		orderBy: { _count: { path: 'desc' } },
		take: limit
	});

	return rows.map((row) => ({
		label: row.path.length > 40 ? `${row.path.slice(0, 37)}…` : row.path,
		count: row._count._all
	}));
}

export async function getDeviceTypeCounts(): Promise<TrendPoint[]> {
	const rows = await db.searchLog.groupBy({
		by: ['device_type'],
		_count: { _all: true }
	});
	return groupCountToPoints(
		rows.map((r) => ({ key: r.device_type, count: r._count._all }))
	);
}

export async function getBrowserCounts(): Promise<TrendPoint[]> {
	const rows = await db.searchLog.groupBy({
		by: ['browser'],
		_count: { _all: true }
	});
	return groupCountToPoints(
		rows.map((r) => ({ key: r.browser, count: r._count._all }))
	);
}

export async function getOsCounts(): Promise<TrendPoint[]> {
	const rows = await db.searchLog.groupBy({
		by: ['os'],
		_count: { _all: true }
	});
	return groupCountToPoints(rows.map((r) => ({ key: r.os, count: r._count._all })));
}

export async function getGenderCounts(): Promise<TrendPoint[]> {
	const rows = await db.userProfile.groupBy({
		by: ['gender'],
		_count: { _all: true }
	});
	return groupCountToPoints(rows.map((r) => ({ key: r.gender, count: r._count._all })));
}

export async function getDegreeCounts(): Promise<TrendPoint[]> {
	const rows = await db.userProfile.groupBy({
		by: ['highest_degree'],
		_count: { _all: true }
	});
	return groupCountToPoints(
		rows.map((r) => ({ key: r.highest_degree, count: r._count._all }))
	);
}

export async function getReligionCounts(): Promise<TrendPoint[]> {
	const rows = await db.userProfile.groupBy({
		by: ['religion'],
		_count: { _all: true }
	});
	return groupCountToPoints(
		rows.map((r) => ({ key: r.religion, count: r._count._all }))
	);
}

export async function getTopJobInterestKeywords(limit = 15): Promise<TrendPoint[]> {
	const rows = await db.userJobInterest.groupBy({
		by: ['keyword'],
		_count: { _all: true },
		orderBy: { _count: { keyword: 'desc' } },
		take: limit
	});

	return rows.map((row) => ({
		label: row.keyword,
		count: row._count._all
	}));
}

export async function getSearchKeywordCounts(limit = 15): Promise<TrendPoint[]> {
	const recent = await db.searchLog.findMany({
		select: { filters: true },
		orderBy: { created_at: 'desc' },
		take: 2000
	});

	const counts = new Map<string, number>();
	for (const row of recent) {
		const keyword = searchLogKeyword(row.filters);
		if (!keyword) continue;
		const key = keyword.toLowerCase();
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

/** How often each filter category appears across recent search logs. */
export async function getAppliedFilterCategoryCounts(limit = 15): Promise<TrendPoint[]> {
	const recent = await db.searchLog.findMany({
		select: { filters: true },
		orderBy: { created_at: 'desc' },
		take: 2000
	});

	const counts = new Map<string, number>();
	for (const row of recent) {
		const chips = describeSearchLogFilters(row.filters);
		const seen = new Set<string>();
		for (const chip of chips) {
			if (seen.has(chip.category)) continue;
			seen.add(chip.category);
			counts.set(chip.category, (counts.get(chip.category) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

/** Most common concrete filter values (chip labels) across recent searches. */
export async function getTopAppliedFilterValues(limit = 15): Promise<TrendPoint[]> {
	const recent = await db.searchLog.findMany({
		select: { filters: true },
		orderBy: { created_at: 'desc' },
		take: 2000
	});

	const counts = new Map<string, number>();
	for (const row of recent) {
		for (const chip of describeSearchLogFilters(row.filters)) {
			counts.set(chip.label, (counts.get(chip.label) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

export async function getRecentEmails(limit = 25): Promise<AdminEmailRow[]> {
	return db.email.findMany({
		orderBy: { created_at: 'desc' },
		take: limit,
		select: {
			id: true,
			name: true,
			email: true,
			contact: true,
			message: true,
			created_at: true
		}
	});
}

export async function getRecentSearches(limit = 40): Promise<AdminSearchRow[]> {
	const rows = await db.searchLog.findMany({
		orderBy: { created_at: 'desc' },
		take: limit,
		select: {
			id: true,
			result_count: true,
			path: true,
			device_type: true,
			browser: true,
			browser_version: true,
			os: true,
			created_at: true,
			filters: true
		}
	});

	return rows.map((row) => {
		const filterChips = describeSearchLogFilters(row.filters);
		const params = searchLogFiltersToParams(row.filters);
		const path = row.path ? repairDegreeAreasHtmlCorruption(row.path) : null;
		const href = searchLogHref(row.path, row.filters);
		const paramEntries = searchLogParamEntries(row.path, row.filters);

		return {
			id: row.id,
			result_count: row.result_count,
			path,
			href,
			params: paramEntries,
			device_type: row.device_type,
			browser: row.browser,
			browser_version: row.browser_version,
			os: row.os,
			created_at: row.created_at,
			keyword: searchLogKeyword(row.filters),
			sort: params.sort ?? null,
			filters: filterChips,
			filter_count: Math.max(filterChips.length, paramEntries.length)
		};
	});
}
