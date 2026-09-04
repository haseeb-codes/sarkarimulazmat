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
		OR: terms.map((term) => ({
			degree_area: { contains: term, mode: 'insensitive' as const }
		}))
	};
}

function titleTermsWhere(terms: string[]): Prisma.JobPostingsWhereInput {
	return {
		OR: terms.map((term) => ({
			title: { contains: term, mode: 'insensitive' as const }
		}))
	};
}

export type JobCategoryFilter = Pick<
	JobCategoryPageDef,
	| 'column'
	| 'degree_area_terms'
	| 'title_terms'
	| 'latest_posted_day'
	| 'closing_soon_within_days'
	| 'transgender_applicable'
>;

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

/** Tag filter clause for the main job list (`buildJobWhere`). */
export function buildJobCategoryTagWhere(category: JobCategoryFilter): Prisma.JobPostingsWhereInput {
	if (category.latest_posted_day) {
		return {};
	}
	if (category.closing_soon_within_days != null) {
		return closingSoonWhere(category.closing_soon_within_days);
	}
	if (category.degree_area_terms?.length) {
		return degreeAreaTermsWhere(category.degree_area_terms);
	}
	if (category.title_terms?.length) {
		return titleTermsWhere(category.title_terms);
	}
	if (category.transgender_applicable) {
		return transgenderApplicableWhere();
	}
	if (!category.column) {
		return {};
	}
	return { [category.column]: 1 };
}

export async function buildJobCategoryWhere(
	category: JobCategoryFilter
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
		and.push(closingSoonWhere(category.closing_soon_within_days));
	} else if (category.degree_area_terms?.length) {
		and.push(degreeAreaTermsWhere(category.degree_area_terms));
	} else if (category.title_terms?.length) {
		and.push(titleTermsWhere(category.title_terms));
	} else if (category.transgender_applicable) {
		and.push(transgenderApplicableWhere());
	} else if (category.column) {
		and.push({ [category.column]: 1 });
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

export async function loadJobCategoryJobs(
	category: JobCategoryFilter,
	opts: { page?: number; pageSize?: number }
): Promise<JobCategoryJobsPaginatedResult>;
export async function loadJobCategoryJobs(
	category: JobCategoryFilter,
	opts?: undefined
): Promise<JobCategoryJobsAllResult>;
export async function loadJobCategoryJobs(
	category: JobCategoryFilter,
	opts?: { page?: number; pageSize?: number }
): Promise<JobCategoryJobsAllResult | JobCategoryJobsPaginatedResult> {
	const postedDay = category.latest_posted_day ? await resolveLatestPostedDay() : null;
	const where = category.latest_posted_day
		? {
				AND: [
					activeNonExpiredWhere(),
					postedDay ? latestPostedDayWhere(postedDay) : { row_id: -1 }
				]
			}
		: await buildJobCategoryWhere(category);
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

/** Home page tag counts — fixed curated list, cached briefly. */
export async function getTopTagCounts(): Promise<TagJobCount[]> {
	const now = Date.now();
	if (topTagsCache && topTagsCache.expiresAt > now) {
		return topTagsCache.data;
	}

	const tagBySlug = new Map(getJobCategoryTags().map((tag) => [tag.slug, tag]));
	const data = await Promise.all(
		HOME_PAGE_TAG_SLUGS.map(async (slug) => {
			const tag = tagBySlug.get(slug);
			if (!tag) throw new Error(`Unknown home page tag slug: ${slug}`);

			return {
				slug: tag.slug,
				label: HOME_PAGE_TAG_LABELS[slug] ?? tag.label,
				count: await countJobCategoryJobs(tag)
			};
		})
	);

	topTagsCache = { data, expiresAt: now + TOP_TAGS_TTL_MS };
	return data;
}
