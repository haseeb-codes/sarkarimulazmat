import { error } from '@sveltejs/kit';
import {
	getJobCategoryPage,
	getJobCategoryTagLabel,
	SITE_HREF,
	type JobCategoryPageDef
} from '$lib/job-category-pages';
import { loadJobCategoryJobs } from '$lib/server/job-category-jobs';
import type { ListJob } from '$lib/server/job-list-dto';
import {
	parseSocialImageFormat,
	parseSocialImagePage,
	SOCIAL_IMAGE_FORMATS,
	type SocialImageFormat
} from '$lib/social-job-images';

export type SocialJobImageData = {
	category: JobCategoryPageDef;
	label: string;
	jobs: ListJob[];
	totalJobs: number;
	format: SocialImageFormat;
	page: number;
	totalPages: number;
	updatedAt: string;
	listUrl: string;
	width: number;
	height: number;
};

export async function loadSocialJobImageData(
	slug: string,
	formatParam: string | null | undefined,
	pageParam: string | null | undefined
): Promise<SocialJobImageData> {
	const category = getJobCategoryPage(slug);
	if (!category) {
		error(404, 'Specialization not found');
	}

	const format = parseSocialImageFormat(formatParam);
	const requestedPage = parseSocialImagePage(pageParam);
	const config = SOCIAL_IMAGE_FORMATS[format];

	const { jobs, updatedAt } = await loadJobCategoryJobs(category);
	const totalPages = Math.max(1, Math.ceil(jobs.length / config.jobsPerPage));
	const page = Math.min(requestedPage, totalPages);
	const start = (page - 1) * config.jobsPerPage;
	const slice = jobs.slice(start, start + config.jobsPerPage);

	return {
		category,
		label: getJobCategoryTagLabel(slug),
		jobs: slice,
		totalJobs: jobs.length,
		format,
		page,
		totalPages,
		updatedAt,
		listUrl: `${SITE_HREF}/${category.slug}`,
		width: config.width,
		height: config.height
	};
}
