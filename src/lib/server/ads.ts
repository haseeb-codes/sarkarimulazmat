import type { Prisma } from '$lib/server/generated/prisma/client';
import db from '$lib/server/db';
import { IS_ACTIVE_JOB } from '$lib/server/jobs';
import { toAdDetail, toListAd, toListAds, type AdDetail, type ListAd } from '$lib/server/ad-list-dto';
import { toListJobs } from '$lib/server/job-list-dto';

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

export const IS_ACTIVE_AD: Prisma.AdsWhereInput = { is_active: 1 };

function parsePositiveInt(value: string | null | undefined, fallback: number, max?: number): number {
	const n = Number(value);
	if (!Number.isInteger(n) || n < 1) return fallback;
	if (max != null && n > max) return max;
	return n;
}

export function parseAdListParams(url: URL) {
	const q = url.searchParams.get('q')?.trim() ?? '';
	return {
		page: parsePositiveInt(url.searchParams.get('page'), 1),
		pageSize: parsePositiveInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
		show_expired: url.searchParams.get('show_expired') === '1',
		q: q || null
	};
}

type AdSearchRow = {
	ad_slug: string;
	ad_code: string | null;
	ad_headline: string | null;
	ad_content: string | null;
	vacancies: number | null;
	posted_by: string | null;
	last_date_to_apply: Date | null;
	file_creation_date: Date | null;
};

const adListSelect = {
	ad_slug: true,
	ad_code: true,
	ad_headline: true,
	ad_content: true,
	vacancies: true,
	posted_by: true,
	last_date_to_apply: true,
	file_creation_date: true
} as const;

/** 0 = headline, 1 = ad_code, 2 = ad_content (best match tier wins). */
function adSearchRank(
	ad: Pick<AdSearchRow, 'ad_headline' | 'ad_code' | 'ad_content'>,
	q: string
): number {
	const needle = q.toLowerCase();
	if (ad.ad_headline?.toLowerCase().includes(needle)) return 0;
	if (ad.ad_code?.toLowerCase().includes(needle)) return 1;
	if (ad.ad_content?.toLowerCase().includes(needle)) return 2;
	return 3;
}

function compareAdsByRecency(a: AdSearchRow, b: AdSearchRow): number {
	const aTime = a.file_creation_date?.getTime() ?? 0;
	const bTime = b.file_creation_date?.getTime() ?? 0;
	if (bTime !== aTime) return bTime - aTime;
	return a.ad_slug.localeCompare(b.ad_slug);
}

function buildAdSearchWhere(
	baseWhere: Prisma.AdsWhereInput,
	q: string
): Prisma.AdsWhereInput {
	return {
		AND: [
			baseWhere,
			{
				OR: [
					{ ad_headline: { contains: q, mode: 'insensitive' } },
					{ ad_code: { contains: q, mode: 'insensitive' } },
					{ ad_content: { contains: q, mode: 'insensitive' } }
				]
			}
		]
	};
}

export async function listAds(params: ReturnType<typeof parseAdListParams>): Promise<{
	ads: ListAd[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}> {
	const baseWhere: Prisma.AdsWhereInput = params.show_expired ? {} : IS_ACTIVE_AD;
	const skip = (params.page - 1) * params.pageSize;

	if (params.q) {
		const rows = await db.ads.findMany({
			where: buildAdSearchWhere(baseWhere, params.q),
			select: adListSelect
		});

		const ranked = rows.sort((a, b) => {
			const byRank = adSearchRank(a, params.q!) - adSearchRank(b, params.q!);
			if (byRank !== 0) return byRank;
			return compareAdsByRecency(a, b);
		});

		const total = ranked.length;
		const pageRows = ranked.slice(skip, skip + params.pageSize);

		return {
			ads: toListAds(pageRows),
			total,
			page: params.page,
			pageSize: params.pageSize,
			totalPages: Math.max(1, Math.ceil(total / params.pageSize))
		};
	}

	const [rows, total] = await Promise.all([
		db.ads.findMany({
			where: baseWhere,
			orderBy: [{ file_creation_date: 'desc' }, { ad_slug: 'asc' }],
			skip,
			take: params.pageSize,
			select: adListSelect
		}),
		db.ads.count({ where: baseWhere })
	]);

	return {
		ads: toListAds(rows),
		total,
		page: params.page,
		pageSize: params.pageSize,
		totalPages: Math.max(1, Math.ceil(total / params.pageSize))
	};
}

export async function getAdBySlug(adSlug: string): Promise<AdDetail | null> {
	const key = adSlug.trim();
	if (!key) return null;

	const ad = await db.ads.findUnique({
		where: { ad_slug: key },
		select: {
			ad_slug: true,
			ad_code: true,
			ad_headline: true,
			vacancies: true,
			posted_by: true,
			last_date_to_apply: true,
			file_creation_date: true,
			ad_content: true,
			ad_full_text_summary: true,
			supabase_file_path: true,
			is_active: true
		}
	});

	if (!ad) return null;
	return toAdDetail(ad);
}

export async function listJobsForAd(ad: { ad_slug: string; ad_code?: string | null }) {
	const adSlug = ad.ad_slug?.trim();
	if (!adSlug) {
		return { jobs: [], total: 0 };
	}

	const linkOr: Prisma.JobPostingsWhereInput[] = [{ ad_slug: adSlug }];
	const adCode = ad.ad_code?.trim();
	if (adCode) {
		linkOr.push({ ad_code: adCode });
	}

	const where: Prisma.JobPostingsWhereInput = {
		AND: [IS_ACTIVE_JOB, { row_id: { not: null } }, { OR: linkOr }]
	};

	const rawJobs = await db.jobPostings.findMany({
		where,
		orderBy: [{ last_date_to_apply: { sort: 'asc', nulls: 'last' } }, { row_id: 'desc' }]
	});

	const jobs = rawJobs.filter(
		(job): job is (typeof rawJobs)[number] & { row_id: number } => job.row_id != null
	);

	return {
		jobs: toListJobs(jobs),
		total: jobs.length
	};
}
