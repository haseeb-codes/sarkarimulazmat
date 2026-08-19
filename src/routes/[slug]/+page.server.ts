import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getJobCategoryPage } from '$lib/job-category-pages';
import { loadJobCategoryJobs } from '$lib/server/job-category-jobs';
import db from '$lib/server/db';
import {
	getBrowseByCategoryData,
	listJobs,
	parseJobFilters,
	type BrowseByCategoryData,
	type JobFilters
} from '$lib/server/jobs';

const emptyBrowse: BrowseByCategoryData = {
	adDates: [],
	postedBy: [],
	donors: [],
	genders: [],
	degreeAreas: [],
	educationLevels: [],
	jobInterestTree: []
};

export const load: PageServerLoad = async ({ params, url }) => {
	const jobCategory = getJobCategoryPage(params.slug);
	if (jobCategory) {
		const result = await loadJobCategoryJobs(jobCategory.column);
		return {
			kind: 'share' as const,
			category: jobCategory,
			jobs: result.jobs,
			updatedAt: result.updatedAt
		};
	}

	const category = await db.categoryPage.findUnique({
		where: { slug: params.slug }
	});

	if (!category || !category.is_indexed) {
		error(404, 'Category not found');
	}

	const preset = (category.filters ?? {}) as Partial<JobFilters>;
	const urlFilters = parseJobFilters(url);

	const filters: JobFilters = {
		...urlFilters,
		degree_areas: preset.degree_areas?.length ? preset.degree_areas : urlFilters.degree_areas,
		education_level: preset.education_level ?? urlFilters.education_level,
		ad_date: urlFilters.ad_date,
		posted_by: urlFilters.posted_by,
		donor_name: urlFilters.donor_name,
		grade: preset.grade ?? urlFilters.grade,
		qualification_level: preset.qualification_level ?? urlFilters.qualification_level,
		domicile: urlFilters.domicile ?? preset.domicile ?? null,
		place_of_posting: urlFilters.place_of_posting ?? preset.place_of_posting ?? null,
		q: urlFilters.q,
		sort: urlFilters.sort,
		page: urlFilters.page,
		pageSize: urlFilters.pageSize,
		show_expired: urlFilters.show_expired,
		age: urlFilters.age,
		department: urlFilters.department,
		collar: urlFilters.collar,
		province: urlFilters.province,
		program: urlFilters.program,
		has_salary: urlFilters.has_salary
	};

	const browse = getBrowseByCategoryData().catch(() => emptyBrowse);
	const result = await listJobs(filters);

	return {
		kind: 'category' as const,
		category: {
			slug: category.slug,
			title: category.title,
			h1: category.h1,
			meta_description: category.meta_description,
			intro_content: category.intro_content
		},
		filters: {
			degree_areas: filters.degree_areas,
			education_level: filters.education_level,
			ad_date: filters.ad_date,
			posted_by: filters.posted_by,
			donor_name: filters.donor_name,
			gender: filters.gender,
			grade: filters.grade,
			age: filters.age,
			place_of_posting: filters.place_of_posting,
			domicile: filters.domicile,
			department: filters.department,
			collar: filters.collar,
			q: filters.q,
			has_salary: filters.has_salary,
			show_expired: filters.show_expired,
			sort: filters.sort,
			page: filters.page,
			pageSize: filters.pageSize
		},
		jobs: result.jobs,
		total: result.total,
		totalPages: result.totalPages,
		browse,
		filtered: Boolean(
			urlFilters.ad_date ||
				urlFilters.posted_by ||
				urlFilters.donor_name ||
				urlFilters.gender ||
				urlFilters.place_of_posting ||
				urlFilters.domicile ||
				urlFilters.department ||
				urlFilters.collar ||
				urlFilters.has_salary ||
				urlFilters.q ||
				urlFilters.age ||
				urlFilters.show_expired
		),
		error: null as string | null
	};
};
