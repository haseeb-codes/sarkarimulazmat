import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import db from '$lib/server/db';
import { getFilterOptions, listJobs, parseJobFilters, type JobFilters } from '$lib/server/jobs';

export const load: PageServerLoad = async ({ params, url }) => {
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
		province: urlFilters.province
	};

	const options = getFilterOptions();
	const result = await listJobs(filters);

	return {
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
			grade: filters.grade,
			age: filters.age,
			place_of_posting: filters.place_of_posting,
			domicile: filters.domicile,
			q: filters.q,
			show_expired: filters.show_expired,
			sort: filters.sort,
			page: filters.page,
			pageSize: filters.pageSize
		},
		jobs: result.jobs,
		total: result.total,
		totalPages: result.totalPages,
		options,
		filtered: Boolean(
			urlFilters.place_of_posting ||
				urlFilters.domicile ||
				urlFilters.q ||
				urlFilters.age ||
				urlFilters.show_expired
		),
		error: null as string | null
	};
};
