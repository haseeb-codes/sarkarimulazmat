import type { Prisma } from '$lib/server/generated/prisma/client';
import db from '$lib/server/db';
import {
	getJobCategoryTags,
	HOME_PAGE_TAG_LABELS,
	HOME_PAGE_TAG_SLUGS,
	type JobCategoryPageDef
} from '$lib/job-category-pages';
import { toListJobs } from '$lib/server/job-list-dto';

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

function degreeAreaTermsWhere(terms: string[]): Prisma.JobPostingsWhereInput {
	return {
		OR: terms.map((term) => ({
			degree_area: { contains: term, mode: 'insensitive' as const }
		}))
	};
}

export type JobCategoryFilter = Pick<JobCategoryPageDef, 'column' | 'degree_area_terms'>;

/** Tag filter clause for the main job list (`buildJobWhere`). */
export function buildJobCategoryTagWhere(category: JobCategoryFilter): Prisma.JobPostingsWhereInput {
	if (category.degree_area_terms?.length) {
		return degreeAreaTermsWhere(category.degree_area_terms);
	}
	return { [category.column]: 1 };
}

export function buildJobCategoryWhere(category: JobCategoryFilter): Prisma.JobPostingsWhereInput {
	const startOfToday = startOfTodayUtc();
	const and: Prisma.JobPostingsWhereInput[] = [
		{ is_active: 1 },
		{ row_id: { not: null } },
		{
			OR: [{ last_date_to_apply: null }, { last_date_to_apply: { gte: startOfToday } }]
		}
	];

	if (category.degree_area_terms?.length) {
		and.push(degreeAreaTermsWhere(category.degree_area_terms));
	} else {
		and.push({ [category.column]: 1 });
	}

	return { AND: and };
}

export async function loadJobCategoryJobs(category: JobCategoryFilter) {
	const rawJobs = await db.jobPostings.findMany({
		where: buildJobCategoryWhere(category),
		orderBy: [
			{ ad_date: { sort: 'desc', nulls: 'last' } },
			{ file_creation_date: { sort: 'desc', nulls: 'last' } },
			{ row_id: 'desc' }
		]
	});

	const jobs = rawJobs.filter(
		(job): job is (typeof rawJobs)[number] & { row_id: number } => job.row_id != null
	);

	return {
		jobs: toListJobs(jobs),
		updatedAt: new Date().toISOString()
	};
}

export async function countJobCategoryJobs(category: JobCategoryFilter) {
	return db.jobPostings.count({
		where: buildJobCategoryWhere(category)
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
