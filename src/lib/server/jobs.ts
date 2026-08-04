import type { Prisma } from '$lib/server/generated/prisma/client';
import db from '$lib/server/db';
import {
	splitMultiValue,
	type JobSort,
	type FilterParams
} from '$lib/jobs-utils';

export type { JobSort };
export { splitMultiValue } from '$lib/jobs-utils';

export type JobFilters = FilterParams & {
	degree_areas: string[];
	education_level: string | null;
	qualification_level: number | null;
	grade: string | null;
	/** User's age — matched two-sided against job min_age/max_age */
	age: number | null;
	place_of_posting: string | null;
	domicile: string | null;
	department: string | null;
	province: string | null;
	q: string | null;
	show_expired: boolean;
	sort: JobSort;
	page: number;
	pageSize: number;
};

export type FilterOptions = {
	degree_areas: string[];
	degrees: string[];
	education_levels: string[];
	grades: string[];
	places: string[];
	domiciles: string[];
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const FILTER_OPTIONS_TTL_MS = 5 * 60 * 1000;
const FILTER_OPTIONS_CAP = 50;

let filterOptionsCache: { data: FilterOptions; expiresAt: number } | null = null;

function parsePositiveInt(value: string | null, fallback: number, max?: number): number {
	if (!value) return fallback;
	const n = Number.parseInt(value, 10);
	if (!Number.isFinite(n) || n < 1) return fallback;
	if (max !== undefined && n > max) return max;
	return n;
}

function parseOptionalPositiveInt(value: string | null): number | null {
	if (!value) return null;
	const n = Number.parseInt(value, 10);
	if (!Number.isFinite(n) || n < 1) return null;
	return n;
}

function firstParam(url: URL, key: string): string | null {
	const v = url.searchParams.get(key)?.trim();
	return v ? v : null;
}

/** Collect multi-value degree_areas from repeated params and/or a single comma-separated param. */
function parseDegreeAreas(url: URL): string[] {
	const all = url.searchParams.getAll('degree_areas');
	const parts: string[] = [];
	for (const entry of all) {
		parts.push(...splitMultiValue(entry));
	}
	return parts;
}

export function parseJobFilters(url: URL): JobFilters {
	const sortParam = firstParam(url, 'sort');
	const sort: JobSort = sortParam === 'closing_soon' ? 'closing_soon' : 'newest';

	return {
		degree_areas: parseDegreeAreas(url),
		education_level: firstParam(url, 'education_level'),
		qualification_level: parseOptionalPositiveInt(firstParam(url, 'qualification_level')),
		grade: firstParam(url, 'grade'),
		age: parseOptionalPositiveInt(firstParam(url, 'age')),
		place_of_posting: firstParam(url, 'place_of_posting'),
		domicile: firstParam(url, 'domicile'),
		department: firstParam(url, 'department'),
		province: firstParam(url, 'province'),
		q: firstParam(url, 'q'),
		show_expired: url.searchParams.get('show_expired') === '1',
		sort,
		page: parsePositiveInt(firstParam(url, 'page'), 1),
		pageSize: parsePositiveInt(firstParam(url, 'pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
	};
}

export function filtersAreActive(filters: JobFilters): boolean {
	return Boolean(
		filters.degree_areas.length ||
			filters.education_level ||
			filters.qualification_level ||
			filters.grade ||
			filters.age ||
			filters.place_of_posting ||
			filters.domicile ||
			filters.department ||
			filters.province ||
			filters.q ||
			filters.show_expired
	);
}

export function buildJobWhere(filters: JobFilters): Prisma.JobPostingsWhereInput {
	const and: Prisma.JobPostingsWhereInput[] = [];

	// Skip inactive when active is set
	and.push({ OR: [{ active: true }, { active: null }] });

	// Degree areas / degrees — comma-delimited strings; match any selected value
	if (filters.degree_areas.length) {
		const degreeOr: Prisma.JobPostingsWhereInput[] = [];
		for (const area of filters.degree_areas) {
			degreeOr.push(
				{ degree_area: { contains: area, mode: 'insensitive' } },
				{ degrees: { contains: area, mode: 'insensitive' } }
			);
		}
		and.push({ OR: degreeOr });
	}

	// Education level — free-text with casing variance; contains is more reliable than exact
	if (filters.education_level) {
		and.push({
			education_level: { contains: filters.education_level, mode: 'insensitive' }
		});
	}

	if (filters.qualification_level != null) {
		and.push({ qualification_level: filters.qualification_level });
	}

	// Grade — exact match against distinct values
	if (filters.grade) {
		and.push({ grade: { equals: filters.grade, mode: 'insensitive' } });
	}

	// Two-sided age eligibility: job.min_age <= userAge (or null) AND job.max_age >= userAge (or null)
	if (filters.age != null) {
		and.push({
			AND: [
				{ OR: [{ min_age: null }, { min_age: { lte: filters.age } }] },
				{ OR: [{ max_age: null }, { max_age: { gte: filters.age } }] }
			]
		});
	}

	if (filters.place_of_posting) {
		and.push({
			place_of_posting: { contains: filters.place_of_posting, mode: 'insensitive' }
		});
	}

	if (filters.domicile) {
		and.push({ domicile: { contains: filters.domicile, mode: 'insensitive' } });
	}

	if (filters.department) {
		and.push({ department: { contains: filters.department, mode: 'insensitive' } });
	}

	if (filters.province) {
		and.push({ province: { contains: filters.province, mode: 'insensitive' } });
	}

	if (filters.q) {
		and.push({
			OR: [
				{ title: { contains: filters.q, mode: 'insensitive' } },
				{ department: { contains: filters.q, mode: 'insensitive' } },
				{ description: { contains: filters.q, mode: 'insensitive' } }
			]
		});
	}

	// last_date_to_apply is stored as YYYY-MM-DD string — lexicographic compare works
	if (!filters.show_expired) {
		const today = new Date().toISOString().slice(0, 10);
		and.push({
			OR: [{ last_date_to_apply: null }, { last_date_to_apply: { gte: today } }]
		});
	}

	return { AND: and };
}

function buildOrderBy(sort: JobSort): Prisma.JobPostingsOrderByWithRelationInput[] {
	if (sort === 'closing_soon') {
		return [{ last_date_to_apply: { sort: 'asc', nulls: 'last' } }, { row_id: 'desc' }];
	}
	// ad_date is often null in current data — fall back to row_id
	return [{ ad_date: { sort: 'desc', nulls: 'last' } }, { row_id: 'desc' }];
}

export async function listJobs(filters: JobFilters) {
	const where = buildJobWhere(filters);
	const skip = (filters.page - 1) * filters.pageSize;

	const [jobs, total] = await Promise.all([
		db.jobPostings.findMany({
			where,
			orderBy: buildOrderBy(filters.sort),
			skip,
			take: filters.pageSize
		}),
		db.jobPostings.count({ where })
	]);

	return {
		jobs,
		total,
		page: filters.page,
		pageSize: filters.pageSize,
		totalPages: Math.max(1, Math.ceil(total / filters.pageSize))
	};
}

export async function getJobById(rowId: number) {
	if (!Number.isInteger(rowId) || rowId < 1) return null;
	return db.jobPostings.findUnique({ where: { row_id: rowId } });
}

function frequencyRank(values: string[], cap = FILTER_OPTIONS_CAP): string[] {
	const counts = new Map<string, { label: string; count: number }>();
	for (const raw of values) {
		for (const part of splitMultiValue(raw)) {
			if (part.toUpperCase() === 'NA' || part === '-') continue;
			const key = part.toLowerCase();
			const existing = counts.get(key);
			if (existing) existing.count += 1;
			else counts.set(key, { label: part, count: 1 });
		}
	}
	return [...counts.values()]
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
		.slice(0, cap)
		.map((x) => x.label);
}

function distinctStrings(values: (string | null)[], cap = FILTER_OPTIONS_CAP): string[] {
	const counts = new Map<string, { label: string; count: number }>();
	for (const v of values) {
		const trimmed = v?.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		const existing = counts.get(key);
		if (existing) existing.count += 1;
		else counts.set(key, { label: trimmed, count: 1 });
	}
	return [...counts.values()]
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
		.slice(0, cap)
		.map((x) => x.label);
}

export async function getFilterOptions(): Promise<FilterOptions> {
	const now = Date.now();
	if (filterOptionsCache && filterOptionsCache.expiresAt > now) {
		return filterOptionsCache.data;
	}

	const rows = await db.jobPostings.findMany({
		where: { OR: [{ active: true }, { active: null }] },
		select: {
			degree_area: true,
			degrees: true,
			education_level: true,
			grade: true,
			place_of_posting: true,
			domicile: true
		},
		take: 2000
	});

	const data: FilterOptions = {
		degree_areas: frequencyRank(rows.map((r) => r.degree_area ?? '')),
		degrees: frequencyRank(rows.map((r) => r.degrees ?? '')),
		education_levels: distinctStrings(rows.map((r) => r.education_level)),
		grades: distinctStrings(rows.map((r) => r.grade)),
		places: frequencyRank(rows.map((r) => r.place_of_posting ?? '')),
		domiciles: distinctStrings(rows.map((r) => r.domicile))
	};

	filterOptionsCache = { data, expiresAt: now + FILTER_OPTIONS_TTL_MS };
	return data;
}

export {
	filtersToSearchParams,
	filtersToHref,
	badgeFilterHref,
	isJobExpired,
	isClosingSoon,
	formatAgeRange
} from '$lib/jobs-utils';

export { eligibilityFiltersActive } from '$lib/jobs-utils';
