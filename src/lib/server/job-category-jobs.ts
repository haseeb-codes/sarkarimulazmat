import type { Prisma } from '$lib/server/generated/prisma/client';
import db from '$lib/server/db';
import {
	getJobCategoryTags,
	HOME_PAGE_TAG_LABELS,
	HOME_PAGE_TAG_SLUGS,
	type JobCategoryPageDef
} from '$lib/job-category-pages';
import { toListJobs, type ListJob } from '$lib/server/job-list-dto';
import { toDateKey } from '$lib/jobs-utils';

export type TagJobCount = {
	slug: string;
	label: string;
	count: number;
};

const TOP_TAGS_TTL_MS = 5 * 60 * 1000;
let topTagsCache: { data: TagJobCount[]; expiresAt: number } | null = null;

function startOfTodayUtc(): Date {
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	return today;
}

function dateFromKey(dateKey: string): Date {
	return new Date(`${dateKey}T00:00:00.000Z`);
}

function degreeAreaTermsWhere(terms: string[]): Prisma.JobPostingsWhereInput {
	return {
		OR: terms.flatMap((term) => fieldContainsTerm('degree_area', term))
	};
}

function titleTermsWhere(terms: string[]): Prisma.JobPostingsWhereInput {
	return {
		OR: terms.flatMap((term) => fieldContainsTerm('title', term))
	};
}

/** Approximate word-boundary matching for short tokens like "HR". */
function fieldContainsTerm(
	field: 'title' | 'degree_area' | 'education_level',
	term: string
): Prisma.JobPostingsWhereInput[] {
	const mode = 'insensitive' as const;
	if (term.length <= 2) {
		return [
			{ [field]: { equals: term, mode } },
			{ [field]: { startsWith: `${term} `, mode } },
			{ [field]: { startsWith: `${term}/`, mode } },
			{ [field]: { startsWith: `${term}-`, mode } },
			{ [field]: { endsWith: ` ${term}`, mode } },
			{ [field]: { contains: ` ${term} `, mode } },
			{ [field]: { contains: ` ${term}/`, mode } },
			{ [field]: { contains: ` ${term},`, mode } },
			{ [field]: { contains: ` ${term}-`, mode } },
			{ [field]: { contains: `/${term}`, mode } },
			{ [field]: { contains: `(${term}`, mode } },
			{ [field]: { contains: `-${term}`, mode } },
			{ [field]: { contains: `${term}-`, mode } }
		];
	}
	return [{ [field]: { contains: term, mode } }];
}

function educationLevelTermsWhere(terms: string[]): Prisma.JobPostingsWhereInput {
	return {
		OR: terms.map((term) => ({
			education_level: { contains: term, mode: 'insensitive' as const }
		}))
	};
}

export type JobCategoryFilter = Pick<
	JobCategoryPageDef,
	| 'column'
	| 'degree_area_terms'
	| 'title_terms'
	| 'title_exclude_terms'
	| 'degrees_terms'
	| 'education_level_terms'
	| 'latest_posted_day'
	| 'closing_soon_within_days'
	| 'transgender_applicable'
>;

function degreesTermsWhere(terms: string[]): Prisma.JobPostingsWhereInput {
	return {
		OR: terms.map((term) => ({
			degrees: { contains: term, mode: 'insensitive' as const }
		}))
	};
}

function categoryMatchWhere(category: JobCategoryFilter): Prisma.JobPostingsWhereInput | null {
	const parts: Prisma.JobPostingsWhereInput[] = [];
	if (category.degree_area_terms?.length) {
		parts.push(degreeAreaTermsWhere(category.degree_area_terms));
	}
	if (category.title_terms?.length) {
		parts.push(titleTermsWhere(category.title_terms));
	}
	if (category.degrees_terms?.length) {
		parts.push(degreesTermsWhere(category.degrees_terms));
	}
	if (category.education_level_terms?.length) {
		parts.push(educationLevelTermsWhere(category.education_level_terms));
	}
	if (category.transgender_applicable) {
		parts.push(transgenderApplicableWhere());
	}
	if (category.column) {
		parts.push({ [category.column]: 1 });
	}
	if (!parts.length) return null;
	if (parts.length === 1) return parts[0]!;
	return { OR: parts };
}

function activeNonExpiredWhere(): Prisma.JobPostingsWhereInput {
	const startOfToday = startOfTodayUtc();
	return {
		AND: [
			{ is_active: 1 },
			{ row_id: { not: null } },
			{
				OR: [{ last_date_to_apply: null }, { last_date_to_apply: { gte: startOfToday } }]
			}
		]
	};
}

/** Apply-by date from today through today+withinDays (inclusive). */
function closingSoonWhere(withinDays: number): Prisma.JobPostingsWhereInput {
	const startOfToday = startOfTodayUtc();
	const endOfWindow = new Date(startOfToday);
	endOfWindow.setUTCDate(endOfWindow.getUTCDate() + withinDays);
	return {
		last_date_to_apply: {
			gte: startOfToday,
			lte: endOfWindow
		}
	};
}

/** Exact match on `last_date_to_apply` for a YYYY-MM-DD key. */
function closingOnExactWhere(dateKey: string): Prisma.JobPostingsWhereInput {
	return { last_date_to_apply: dateFromKey(dateKey) };
}

export type JobCategoryWhereOpts = {
	/** When set on closing-soon, replace the N-day window with this exact deadline. */
	closing_on?: string | null;
};

function resolveClosingSoonWhere(
	withinDays: number,
	closingOn?: string | null
): Prisma.JobPostingsWhereInput {
	const dateKey = closingOn ? toDateKey(closingOn) : null;
	return dateKey ? closingOnExactWhere(dateKey) : closingSoonWhere(withinDays);
}

/** Today if any active jobs were posted/updated today; otherwise the latest such day. */
export async function resolveLatestPostedDay(): Promise<string | null> {
	const startOfToday = startOfTodayUtc();
	const todayKey = startOfToday.toISOString().slice(0, 10);
	const baseWhere = activeNonExpiredWhere();

	const todayWhere: Prisma.JobPostingsWhereInput = {
		AND: [
			baseWhere,
			{
				OR: [{ ad_date: startOfToday }, { file_creation_date: startOfToday }]
			}
		]
	};

	const todayCount = await db.jobPostings.count({ where: todayWhere });
	if (todayCount > 0) return todayKey;

	const [latestAd, latestFile] = await Promise.all([
		db.jobPostings.findFirst({
			where: { AND: [baseWhere, { ad_date: { not: null } }] },
			orderBy: { ad_date: 'desc' },
			select: { ad_date: true }
		}),
		db.jobPostings.findFirst({
			where: { AND: [baseWhere, { file_creation_date: { not: null } }] },
			orderBy: { file_creation_date: 'desc' },
			select: { file_creation_date: true }
		})
	]);

	const candidates = [
		toDateKey(latestAd?.ad_date),
		toDateKey(latestFile?.file_creation_date)
	].filter((value): value is string => Boolean(value));

	if (candidates.length === 0) return null;
	return candidates.sort().at(-1) ?? null;
}

function latestPostedDayWhere(dateKey: string): Prisma.JobPostingsWhereInput {
	const day = dateFromKey(dateKey);
	return {
		OR: [{ ad_date: day }, { file_creation_date: day }]
	};
}

function transgenderApplicableWhere(): Prisma.JobPostingsWhereInput {
	return { gender: { contains: 'Transgender', mode: 'insensitive' } };
}

function titleExcludeTermsWhere(terms: string[]): Prisma.JobPostingsWhereInput {
	return {
		NOT: {
			OR: terms.map((term) => ({
				title: { contains: term, mode: 'insensitive' as const }
			}))
		}
	};
}

/** Tag filter clause for the main job list (`buildJobWhere`). */
export function buildJobCategoryTagWhere(
	category: JobCategoryFilter,
	opts?: JobCategoryWhereOpts
): Prisma.JobPostingsWhereInput {
	if (category.latest_posted_day) {
		return {};
	}
	if (category.closing_soon_within_days != null) {
		return resolveClosingSoonWhere(category.closing_soon_within_days, opts?.closing_on);
	}

	const match = categoryMatchWhere(category);
	if (!match) return {};

	if (category.title_exclude_terms?.length) {
		return { AND: [match, titleExcludeTermsWhere(category.title_exclude_terms)] };
	}
	return match;
}

export async function buildJobCategoryWhere(
	category: JobCategoryFilter,
	opts?: JobCategoryWhereOpts
): Promise<Prisma.JobPostingsWhereInput> {
	const and: Prisma.JobPostingsWhereInput[] = [activeNonExpiredWhere()];

	if (category.latest_posted_day) {
		const dateKey = await resolveLatestPostedDay();
		if (dateKey) {
			and.push(latestPostedDayWhere(dateKey));
		} else {
			and.push({ row_id: -1 });
		}
	} else if (category.closing_soon_within_days != null) {
		and.push(resolveClosingSoonWhere(category.closing_soon_within_days, opts?.closing_on));
	} else {
		const match = categoryMatchWhere(category);
		if (match) and.push(match);
	}

	if (category.title_exclude_terms?.length) {
		and.push(titleExcludeTermsWhere(category.title_exclude_terms));
	}

	return { AND: and };
}

export const TAG_SHARE_PAGE_SIZE = 12;

const jobCategoryOrderBy = [
	{ ad_date: { sort: 'desc' as const, nulls: 'last' as const } },
	{ file_creation_date: { sort: 'desc' as const, nulls: 'last' as const } },
	{ row_id: 'desc' as const }
];

const closingSoonOrderBy = [
	{ last_date_to_apply: { sort: 'asc' as const, nulls: 'last' as const } },
	{ ad_date: { sort: 'desc' as const, nulls: 'last' as const } },
	{ row_id: 'desc' as const }
];

function orderByForCategory(category: JobCategoryFilter) {
	return category.closing_soon_within_days != null ? closingSoonOrderBy : jobCategoryOrderBy;
}

function filterJobsWithRowId<T extends { row_id: number | null }>(
	rawJobs: T[]
): (T & { row_id: number })[] {
	return rawJobs.filter((job): job is T & { row_id: number } => job.row_id != null);
}

export type JobCategoryJobsAllResult = {
	jobs: ListJob[];
	updatedAt: string;
	postedDay: string | null;
};

export type JobCategoryJobsPaginatedResult = JobCategoryJobsAllResult & {
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type LoadJobCategoryJobsOpts = {
	page?: number;
	pageSize?: number;
	/** Exact closing date (YYYY-MM-DD); only applied for closing-soon categories. */
	closing_on?: string | null;
};

export async function loadJobCategoryJobs(
	category: JobCategoryFilter,
	opts: LoadJobCategoryJobsOpts & { page: number; pageSize?: number }
): Promise<JobCategoryJobsPaginatedResult>;
export async function loadJobCategoryJobs(
	category: JobCategoryFilter,
	opts?: LoadJobCategoryJobsOpts
): Promise<JobCategoryJobsAllResult>;
export async function loadJobCategoryJobs(
	category: JobCategoryFilter,
	opts?: LoadJobCategoryJobsOpts
): Promise<JobCategoryJobsAllResult | JobCategoryJobsPaginatedResult> {
	const postedDay = category.latest_posted_day ? await resolveLatestPostedDay() : null;
	const whereOpts: JobCategoryWhereOpts = { closing_on: opts?.closing_on };
	const where = category.latest_posted_day
		? {
				AND: [
					activeNonExpiredWhere(),
					postedDay ? latestPostedDayWhere(postedDay) : { row_id: -1 }
				]
			}
		: await buildJobCategoryWhere(category, whereOpts);
	const orderBy = orderByForCategory(category);
	const updatedAt = new Date().toISOString();

	if (opts?.page != null || opts?.pageSize != null) {
		const pageSize = opts.pageSize ?? TAG_SHARE_PAGE_SIZE;
		const requestedPage = Math.max(1, opts.page ?? 1);
		const total = await db.jobPostings.count({ where });
		const totalPages = Math.max(1, Math.ceil(total / pageSize));
		const page = Math.min(requestedPage, totalPages);
		const skip = (page - 1) * pageSize;

		const rawJobs = await db.jobPostings.findMany({
			where,
			orderBy,
			skip,
			take: pageSize
		});

		return {
			jobs: toListJobs(filterJobsWithRowId(rawJobs)),
			total,
			page,
			pageSize,
			totalPages,
			updatedAt,
			postedDay
		};
	}

	const rawJobs = await db.jobPostings.findMany({
		where,
		orderBy
	});

	return {
		jobs: toListJobs(filterJobsWithRowId(rawJobs)),
		updatedAt,
		postedDay
	};
}

export async function countJobCategoryJobs(category: JobCategoryFilter) {
	return db.jobPostings.count({
		where: await buildJobCategoryWhere(category)
	});
}

const TAG_COUNT_TTL_MS = 5 * 60 * 1000;
const tagCountCache = new Map<string, { count: number; expiresAt: number }>();

/** Counts for arbitrary category slugs — per-slug cache, unknown slugs omitted. */
export async function getTagCountsBySlugs(slugs: string[]): Promise<Record<string, number>> {
	const now = Date.now();
	const unique = [...new Set(slugs.map((s) => s.trim().toLowerCase()).filter(Boolean))];
	const tagBySlug = new Map(getJobCategoryTags().map((tag) => [tag.slug, tag]));
	const result: Record<string, number> = {};
	const missing: string[] = [];

	for (const slug of unique) {
		const cached = tagCountCache.get(slug);
		if (cached && cached.expiresAt > now) {
			result[slug] = cached.count;
		} else if (tagBySlug.has(slug)) {
			missing.push(slug);
		}
	}

	if (missing.length) {
		await Promise.all(
			missing.map(async (slug) => {
				const tag = tagBySlug.get(slug)!;
				const count = await countJobCategoryJobs(tag);
				tagCountCache.set(slug, { count, expiresAt: now + TAG_COUNT_TTL_MS });
				result[slug] = count;
			})
		);
	}

	return result;
}

/** Home page tag counts — fixed curated list, cached briefly. */
export async function getTopTagCounts(): Promise<TagJobCount[]> {
	const now = Date.now();
	if (topTagsCache && topTagsCache.expiresAt > now) {
		return topTagsCache.data;
	}

	const tagBySlug = new Map(getJobCategoryTags().map((tag) => [tag.slug, tag]));
	const counts = await getTagCountsBySlugs([...HOME_PAGE_TAG_SLUGS]);
	const data = HOME_PAGE_TAG_SLUGS.map((slug) => {
		const tag = tagBySlug.get(slug);
		if (!tag) throw new Error(`Unknown home page tag slug: ${slug}`);

		return {
			slug: tag.slug,
			label: HOME_PAGE_TAG_LABELS[slug] ?? tag.label,
			count: counts[slug] ?? 0
		};
	});

	topTagsCache = { data, expiresAt: now + TOP_TAGS_TTL_MS };
	return data;
}
