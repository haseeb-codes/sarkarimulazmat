import db from '$lib/server/db';
import { IS_ACTIVE_JOB } from '$lib/server/jobs';
import { splitMultiValue, toDateKey } from '$lib/jobs-utils';
import type { TrendPoint } from '$lib/trends-types';
import type { Prisma } from '$lib/server/generated/prisma/client';

export type { TrendPoint };

/** Domicile flag columns requested for the trends domicile chart. */
const DOMICILE_FLAG_COLUMNS = [
	{ column: 'domicile_any', label: 'Any' },
	{ column: 'domicile_punjab', label: 'Punjab' },
	{ column: 'domicile_sindh', label: 'Sindh' },
	{ column: 'domicile_kpk', label: 'KPK' },
	{ column: 'domicile_balochistan', label: 'Balochistan' },
	{ column: 'domicile_ict', label: 'ICT' },
	{ column: 'domicile_ajk', label: 'AJK' },
	{ column: 'domicile_gb', label: 'GB' },
	{ column: 'domicile_fata', label: 'FATA' }
] as const;

function utcDateOnly(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
	const next = new Date(d);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function formatShortDate(iso: string): string {
	const [y, m, day] = iso.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, day));
	return date.toLocaleDateString('en-PK', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});
}

/** Day-month label without year, e.g. "01-Sep". */
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

/** Active jobs posted per day for the last 7 calendar days (UTC), including zero days. */
export async function getJobsPostedLast7Days(): Promise<TrendPoint[]> {
	const today = utcDateOnly(new Date());
	const start = addUtcDays(today, -6);

	const rows = await db.jobPostings.groupBy({
		by: ['file_creation_date'],
		where: {
			AND: [
				IS_ACTIVE_JOB,
				{
					file_creation_date: {
						gte: start,
						lte: today
					}
				}
			]
		},
		_count: { _all: true }
	});

	const byDate = new Map<string, number>();
	for (const row of rows) {
		const key = toDateKey(row.file_creation_date);
		if (key) byDate.set(key, row._count._all);
	}

	const points: TrendPoint[] = [];
	for (let i = 0; i < 7; i++) {
		const day = addUtcDays(start, i);
		const key = toDateKey(day)!;
		points.push({
			label: formatShortDate(key),
			count: byDate.get(key) ?? 0
		});
	}
	return points;
}

/**
 * Active jobs grouped by last_date_to_apply (upcoming deadlines from today).
 * Caps to the next 45 days so the chart stays readable.
 */
export async function getJobsExpiringByDate(): Promise<TrendPoint[]> {
	const today = utcDateOnly(new Date());
	const end = addUtcDays(today, 44);

	const rows = await db.jobPostings.groupBy({
		by: ['last_date_to_apply'],
		where: {
			AND: [
				IS_ACTIVE_JOB,
				{
					last_date_to_apply: {
						gte: today,
						lte: end
					}
				}
			]
		},
		_count: { _all: true },
		orderBy: { last_date_to_apply: 'asc' }
	});

	return rows
		.map((row) => {
			const key = toDateKey(row.last_date_to_apply);
			if (!key) return null;
			return {
				label: formatDayMonthLabel(key),
				count: row._count._all
			};
		})
		.filter((p): p is TrendPoint => p != null);
}

/** Active jobs counted by grade_derived, sorted by grade label. */
export async function getGradeDerivedCounts(): Promise<TrendPoint[]> {
	const rows = await db.jobPostings.groupBy({
		by: ['grade_derived'],
		where: {
			AND: [IS_ACTIVE_JOB, { grade_derived: { not: null } }]
		},
		_count: { _all: true }
	});

	return rows
		.filter((row) => row.grade_derived?.trim())
		.map((row) => ({
			label: row.grade_derived!.trim(),
			count: row._count._all
		}))
		.sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base', numeric: true }));
}

/**
 * Active jobs counted by education_level after splitting comma-separated values.
 */
export async function getEducationLevelCounts(): Promise<TrendPoint[]> {
	const rows = await db.jobPostings.findMany({
		where: {
			AND: [IS_ACTIVE_JOB, { education_level: { not: null } }]
		},
		select: { education_level: true }
	});

	const counts = new Map<string, { label: string; count: number }>();
	for (const row of rows) {
		for (const part of splitMultiValue(row.education_level)) {
			const key = part.toLowerCase();
			const existing = counts.get(key);
			if (existing) {
				existing.count += 1;
			} else {
				counts.set(key, { label: part, count: 1 });
			}
		}
	}

	return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Active jobs counted by donor_name. */
export async function getDonorNameCounts(): Promise<TrendPoint[]> {
	const rows = await db.jobPostings.groupBy({
		by: ['donor_name'],
		where: {
			AND: [IS_ACTIVE_JOB, { donor_name: { not: null } }]
		},
		_count: { _all: true },
		orderBy: { _count: { donor_name: 'desc' } }
	});

	return rows
		.filter((row) => row.donor_name?.trim())
		.map((row) => ({
			label: row.donor_name!.trim(),
			count: row._count._all
		}));
}

/**
 * Active jobs counted per domicile flag column where the flag equals 1.
 * Runs the per-column counts in parallel (one logical chart unit).
 */
export async function getDomicileFlagCounts(): Promise<TrendPoint[]> {
	const counts = await Promise.all(
		DOMICILE_FLAG_COLUMNS.map(async ({ column, label }) => {
			const where: Prisma.JobPostingsWhereInput = {
				AND: [IS_ACTIVE_JOB, { [column]: 1 }]
			};
			const count = await db.jobPostings.count({ where });
			return { label, count };
		})
	);

	return counts;
}
