import type { Prisma } from '$lib/server/generated/prisma/client';
import db from '$lib/server/db';
import {
	splitMultiValue,
	toDateKey,
	formatDateLabel,
	parseGenderFilter,
	GENDER_BROWSE_LINKS,
	type JobSort,
	type FilterParams,
	type GenderKind
} from '$lib/jobs-utils';

export type { JobSort };
export { splitMultiValue } from '$lib/jobs-utils';

export type JobFilters = FilterParams & {
	degree_areas: string[];
	education_level: string | null;
	ad_date: string | null;
	posted_by: string | null;
	donor_name: string | null;
	gender: GenderKind | null;
	qualification_level: number | null;
	grade: string | null;
	/** User's age — matched two-sided against job min_age/max_age */
	age: number | null;
	place_of_posting: string | null;
	domicile: string | null;
	department: string | null;
	/** White / Blue / Grey collar */
	collar: string | null;
	/** Provincial posting flag (DB column is boolean). */
	province: boolean | null;
	q: string | null;
	/** Only include postings that have a salary value */
	has_salary: boolean;
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

export type BrowseEducationLink = {
	label: string;
	count: number;
};

export type BrowseAdDateLink = {
	value: string;
	label: string;
	count: number;
};

export type BrowsePostedByLink = {
	label: string;
	count: number;
};

export type BrowseDonorLink = {
	label: string;
	count: number;
};

export type BrowseGenderLink = {
	value: GenderKind;
	label: string;
	count: number;
};

export type BrowseDegreeAreaLink = {
	label: string;
	count: number;
};

export type BrowseByCategoryData = {
	adDates: BrowseAdDateLink[];
	postedBy: BrowsePostedByLink[];
	donors: BrowseDonorLink[];
	genders: BrowseGenderLink[];
	degreeAreas: BrowseDegreeAreaLink[];
	educationLevels: BrowseEducationLink[];
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const FILTER_OPTIONS_TTL_MS = 5 * 60 * 1000;
const FILTER_OPTIONS_CAP = 50;
const BROWSE_COUNTS_TTL_MS = 5 * 60 * 1000;
const SIMILARITY_THRESHOLD = 0.25;
const SIMILARITY_LIMIT = 800;

/** Text columns searched by the global `q` keyword (substring + similarity). */
const SEARCHABLE_TEXT_FIELDS = [
	'title',
	'department',
	'project_program_name',
	'posted_by',
	'degree_area',
	'employment_type',
	'domicile',
	'gender'
] as const satisfies readonly (keyof Prisma.JobPostingsWhereInput)[];

let filterOptionsCache: { data: FilterOptions; expiresAt: number } | null = null;
let browseCountsCache: { data: BrowseByCategoryData; expiresAt: number } | null = null;
let pgTrgmReady: boolean | null = null;

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

function parseOptionalBoolean(value: string | null): boolean | null {
	if (!value) return null;
	const key = value.trim().toLowerCase();
	if (key === '1' || key === 'true' || key === 'yes') return true;
	if (key === '0' || key === 'false' || key === 'no') return false;
	return null;
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
		ad_date: toDateKey(firstParam(url, 'ad_date')),
		posted_by: firstParam(url, 'posted_by'),
		donor_name: firstParam(url, 'donor_name'),
		gender: parseGenderFilter(firstParam(url, 'gender')),
		qualification_level: parseOptionalPositiveInt(firstParam(url, 'qualification_level')),
		grade: firstParam(url, 'grade'),
		age: parseOptionalPositiveInt(firstParam(url, 'age')),
		place_of_posting: firstParam(url, 'place_of_posting'),
		domicile: firstParam(url, 'domicile'),
		department: firstParam(url, 'department'),
		collar: firstParam(url, 'collar'),
		province: parseOptionalBoolean(firstParam(url, 'province')),
		q: firstParam(url, 'q'),
		has_salary: url.searchParams.get('has_salary') === '1',
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
			filters.ad_date ||
			filters.posted_by ||
			filters.donor_name ||
			filters.gender ||
			filters.qualification_level ||
			filters.grade ||
			filters.age ||
			filters.place_of_posting ||
			filters.domicile ||
			filters.department ||
			filters.collar ||
			filters.province != null ||
			filters.q ||
			filters.has_salary ||
			filters.show_expired
	);
}

function containsAnyField(term: string): Prisma.JobPostingsWhereInput[] {
	return SEARCHABLE_TEXT_FIELDS.map((field) => ({
		[field]: { contains: term, mode: 'insensitive' as const }
	})) as Prisma.JobPostingsWhereInput[];
}

function buildKeywordWhere(
	q: string,
	similarRowIds: number[] = []
): Prisma.JobPostingsWhereInput {
	const phrase = q.trim();
	const tokens = phrase
		.split(/\s+/)
		.map((t) => t.trim())
		.filter((t) => t.length >= 2)
		.slice(0, 8);

	const or: Prisma.JobPostingsWhereInput[] = [...containsAnyField(phrase)];

	// Multi-word: every token must appear somewhere across searchable fields
	if (tokens.length > 1) {
		or.push({
			AND: tokens.map((token) => ({ OR: containsAnyField(token) }))
		});
	} else if (tokens.length === 1 && tokens[0] !== phrase) {
		or.push(...containsAnyField(tokens[0]));
	}

	if (similarRowIds.length) {
		or.push({ row_id: { in: similarRowIds } });
	}

	return { OR: or };
}

async function ensurePgTrgm(): Promise<boolean> {
	if (pgTrgmReady != null) return pgTrgmReady;
	try {
		await db.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm');
		pgTrgmReady = true;
	} catch (err) {
		console.warn('pg_trgm unavailable; falling back to substring search', err);
		pgTrgmReady = false;
	}
	return pgTrgmReady;
}

/** Fuzzy matches via pg_trgm similarity across key text columns. */
async function findSimilarJobIds(q: string): Promise<number[]> {
	const phrase = q.trim();
	if (phrase.length < 2) return [];
	if (!(await ensurePgTrgm())) return [];

	try {
		const simClauses = SEARCHABLE_TEXT_FIELDS.map(
			(field) => `similarity(coalesce("${field}", ''), $1) > $2`
		);
		const wordClauses = SEARCHABLE_TEXT_FIELDS.map(
			(field) => `word_similarity($1, coalesce("${field}", '')) > $2`
		);
		const rankExprs = SEARCHABLE_TEXT_FIELDS.flatMap((field) => [
			`similarity(coalesce("${field}", ''), $1)`,
			`word_similarity($1, coalesce("${field}", ''))`
		]);

		const rows = await db.$queryRawUnsafe<{ row_id: number }[]>(
			`
			SELECT row_id
			FROM "JobPostings"
			WHERE ${[...simClauses, ...wordClauses].join('\n\t\t\t\tOR ')}
			ORDER BY GREATEST(${rankExprs.join(', ')}) DESC
			LIMIT $3
			`,
			phrase,
			SIMILARITY_THRESHOLD,
			SIMILARITY_LIMIT
		);
		return rows.map((r) => r.row_id);
	} catch (err) {
		console.warn('Similarity search failed', err);
		return [];
	}
}

/** Match a gender kind without treating "female" as "male". */
function genderMatchWhere(kind: GenderKind): Prisma.JobPostingsWhereInput {
	if (kind === 'male') {
		return {
			OR: [
				{ gender: { equals: 'male', mode: 'insensitive' } },
				{ gender: { equals: 'm', mode: 'insensitive' } },
				{ gender: { startsWith: 'male,', mode: 'insensitive' } },
				{ gender: { contains: ', male', mode: 'insensitive' } },
				{ gender: { contains: ',male', mode: 'insensitive' } }
			]
		};
	}
	if (kind === 'female') {
		return {
			OR: [
				{ gender: { contains: 'female', mode: 'insensitive' } },
				{ gender: { equals: 'f', mode: 'insensitive' } },
				{ gender: { startsWith: 'f,', mode: 'insensitive' } },
				{ gender: { contains: ', f', mode: 'insensitive' } }
			]
		};
	}
	return { gender: { contains: 'trans', mode: 'insensitive' } };
}

export function buildJobWhere(
	filters: JobFilters,
	similarRowIds: number[] = []
): Prisma.JobPostingsWhereInput {
	const and: Prisma.JobPostingsWhereInput[] = [];

	// Skip inactive when active is set
	and.push({ OR: [{ active: true }, { active: null }] });
	and.push({ row_id: { not: null } });

	// Specialization / degrees — comma-delimited strings; match any selected value
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

	if (filters.ad_date) {
		and.push({ ad_date: new Date(`${filters.ad_date}T00:00:00.000Z`) });
	}

	if (filters.posted_by) {
		and.push({ posted_by: { equals: filters.posted_by, mode: 'insensitive' } });
	}

	if (filters.donor_name) {
		and.push({ donor_name: { equals: filters.donor_name, mode: 'insensitive' } });
	}

	if (filters.gender) {
		and.push(genderMatchWhere(filters.gender));
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
		and.push({ department: { equals: filters.department, mode: 'insensitive' } });
	}

	if (filters.collar) {
		and.push({ collar: { equals: filters.collar, mode: 'insensitive' } });
	}

	if (filters.province != null) {
		and.push({ province: filters.province });
	}

	if (filters.q) {
		and.push(buildKeywordWhere(filters.q, similarRowIds));
	}

	if (filters.has_salary) {
		and.push({ salary: { not: null } });
	}

	// last_date_to_apply is DateTime (@db.Date) — compare with a Date, not a YYYY-MM-DD string
	if (!filters.show_expired) {
		const startOfToday = new Date();
		startOfToday.setUTCHours(0, 0, 0, 0);
		and.push({
			OR: [{ last_date_to_apply: null }, { last_date_to_apply: { gte: startOfToday } }]
		});
	}

	return { AND: and };
}

function buildOrderBy(sort: JobSort): Prisma.JobPostingsOrderByWithRelationInput[] {
	if (sort === 'closing_soon') {
		return [{ last_date_to_apply: { sort: 'asc', nulls: 'last' } }, { row_id: 'desc' }];
	}
	return [
		{ ad_date: { sort: 'desc', nulls: 'last' } },
		{ file_creation_date: { sort: 'desc', nulls: 'last' } },
		{ row_id: 'desc' }
	];
}

export async function listJobs(filters: JobFilters) {
	const similarRowIds = filters.q ? await findSimilarJobIds(filters.q) : [];
	const where = buildJobWhere(filters, similarRowIds);
	const skip = (filters.page - 1) * filters.pageSize;

	const [rawJobs, total] = await Promise.all([
		db.jobPostings.findMany({
			where,
			orderBy: buildOrderBy(filters.sort),
			skip,
			take: filters.pageSize
		}),
		db.jobPostings.count({ where })
	]);

	const jobs = rawJobs.filter(
		(job): job is (typeof rawJobs)[number] & { row_id: number } => job.row_id != null
	);

	return {
		jobs,
		total,
		page: filters.page,
		pageSize: filters.pageSize,
		totalPages: Math.max(1, Math.ceil(total / filters.pageSize))
	};
}

export async function getJobBySlug(slug: string) {
	const key = slug.trim();
	if (!key) return null;
	return db.jobPostings.findUnique({ where: { slug: key } });
}

export async function getJobById(rowId: number) {
	if (!Number.isInteger(rowId) || rowId < 1) return null;
	return db.jobPostings.findFirst({ where: { row_id: rowId } });
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
		education_levels: frequencyRank(rows.map((r) => r.education_level ?? '')),
		grades: distinctStrings(rows.map((r) => r.grade)),
		places: frequencyRank(rows.map((r) => r.place_of_posting ?? '')),
		domiciles: distinctStrings(rows.map((r) => r.domicile))
	};

	filterOptionsCache = { data, expiresAt: now + FILTER_OPTIONS_TTL_MS };
	return data;
}

/** Baseline filters for browse counts — active, non-expired postings only. */
function browseBaseFilters(partial: Partial<JobFilters> = {}): JobFilters {
	return {
		degree_areas: [],
		education_level: null,
		ad_date: null,
		posted_by: null,
		donor_name: null,
		gender: null,
		qualification_level: null,
		grade: null,
		age: null,
		place_of_posting: null,
		domicile: null,
		department: null,
		collar: null,
		province: null,
		q: null,
		has_salary: false,
		show_expired: false,
		sort: 'newest',
		page: 1,
		pageSize: DEFAULT_PAGE_SIZE,
		...partial
	};
}

async function countJobsMatching(partial: Partial<JobFilters>): Promise<number> {
	return db.jobPostings.count({ where: buildJobWhere(browseBaseFilters(partial)) });
}

/**
 * Education, gender, specialization, posted-by, ad-date, and donor links
 * for the browse sidebar, each with an active (non-expired) job count. Cached briefly.
 */
export async function getBrowseByCategoryData(): Promise<BrowseByCategoryData> {
	const now = Date.now();
	if (browseCountsCache && browseCountsCache.expiresAt > now) {
		return browseCountsCache.data;
	}

	const browseWhere = buildJobWhere(browseBaseFilters());

	const [options, adDateGroups, postedByGroups, donorGroups] = await Promise.all([
		getFilterOptions(),
		db.jobPostings
			.groupBy({
				by: ['ad_date'],
				where: {
					AND: [browseWhere, { ad_date: { not: null } }]
				},
				_count: { _all: true },
				orderBy: { ad_date: 'desc' }
			})
			.catch(() => [] as { ad_date: Date | null; _count: { _all: number } }[]),
		db.jobPostings
			.groupBy({
				by: ['posted_by'],
				where: {
					AND: [browseWhere, { posted_by: { not: null } }]
				},
				_count: { _all: true },
				orderBy: { _count: { posted_by: 'desc' } }
			})
			.catch(() => [] as { posted_by: string | null; _count: { _all: number } }[]),
		db.jobPostings
			.groupBy({
				by: ['donor_name'],
				where: {
					AND: [browseWhere, { donor_name: { not: null } }]
				},
				_count: { _all: true },
				orderBy: { _count: { donor_name: 'desc' } }
			})
			.catch(() => [] as { donor_name: string | null; _count: { _all: number } }[])
	]);

	const degreeAreaLabels = [
		...new Set([...options.degree_areas, ...options.degrees])
	].slice(0, FILTER_OPTIONS_CAP);

	const [educationLevels, genders, degreeAreas] = await Promise.all([
		Promise.all(
			options.education_levels.map(async (level) => ({
				label: level,
				count: await countJobsMatching({ education_level: level })
			}))
		),
		Promise.all(
			GENDER_BROWSE_LINKS.map(async (item) => ({
				value: item.value,
				label: item.label,
				count: await countJobsMatching({ gender: item.value })
			}))
		),
		Promise.all(
			degreeAreaLabels.map(async (label) => ({
				label,
				count: await countJobsMatching({ degree_areas: [label] })
			}))
		)
	]);

	const adDates = adDateGroups
		.map((row) => {
			const value = toDateKey(row.ad_date);
			if (!value) return null;
			return {
				value,
				label: formatDateLabel(value) ?? value,
				count: row._count._all
			};
		})
		.filter((row): row is BrowseAdDateLink => Boolean(row));

	const postedBy = postedByGroups
		.map((row) => {
			const label = row.posted_by?.trim();
			if (!label) return null;
			return { label, count: row._count._all };
		})
		.filter((row): row is BrowsePostedByLink => Boolean(row));

	const donors = donorGroups
		.map((row) => {
			const label = row.donor_name?.trim();
			if (!label || label.toUpperCase() === 'NA' || label === '-') return null;
			return { label, count: row._count._all };
		})
		.filter((row): row is BrowseDonorLink => Boolean(row));

	const data: BrowseByCategoryData = {
		adDates,
		postedBy,
		donors,
		genders,
		degreeAreas: degreeAreas.filter((item) => item.count > 0),
		educationLevels
	};
	browseCountsCache = { data, expiresAt: now + BROWSE_COUNTS_TTL_MS };
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
