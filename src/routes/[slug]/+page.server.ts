import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getJobCategoryPage } from '$lib/job-category-pages';
import { loadJobCategoryJobs } from '$lib/server/job-category-jobs';
import db from '$lib/server/db';
import { listJobs, countJobs, parseJobFilters, type JobFilters } from '$lib/server/jobs';
import { jobFiltersSnapshot } from '$lib/server/filters-snapshot';
import { jobQueryTrackingFromLocals } from '$lib/server/request-context';
import { isAgeFilterActive, selectedDomiciles, selectedQualificationLevels } from '$lib/jobs-utils';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const jobCategory = getJobCategoryPage(params.slug);
	if (jobCategory) {
		const result = await loadJobCategoryJobs(jobCategory);
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
		portal: urlFilters.portal,
		grade: preset.grade ?? urlFilters.grade,
		qualification: preset.qualification?.length
			? selectedQualificationLevels(preset)
			: urlFilters.qualification.length
				? urlFilters.qualification
				: selectedQualificationLevels({
						qualification_from: preset.qualification_from ?? urlFilters.qualification_from,
						qualification_to:
							preset.qualification_to ??
							preset.qualification_level ??
							urlFilters.qualification_to
					}),
		qualification_from: preset.qualification_from ?? urlFilters.qualification_from,
		qualification_to:
			preset.qualification_to ??
			preset.qualification_level ??
			urlFilters.qualification_to,
		domicile: urlFilters.domicile.length
			? urlFilters.domicile
			: selectedDomiciles(preset),
		tag: urlFilters.tag,
		place_of_posting: urlFilters.place_of_posting ?? preset.place_of_posting ?? null,
		q: urlFilters.q,
		sort: urlFilters.sort,
		page: urlFilters.page,
		pageSize: urlFilters.pageSize,
		show_expired: urlFilters.show_expired,
		age: urlFilters.age,
		age_from: urlFilters.age_from,
		age_to: urlFilters.age_to,
		include_no_max_age: urlFilters.include_no_max_age,
		age_max: urlFilters.age_max,
		department: urlFilters.department,
		collar: urlFilters.collar,
		province: urlFilters.province,
		program: urlFilters.program,
		has_salary: urlFilters.has_salary,
		permanent_only: urlFilters.permanent_only,
		women_only: urlFilters.women_only,
		transgender_applicable: urlFilters.transgender_applicable,
		disability_quota: urlFilters.disability_quota,
		minority_quota: urlFilters.minority_quota,
		min_salary: urlFilters.min_salary,
		salary_from: urlFilters.salary_from,
		salary_to: urlFilters.salary_to
	};

	const filtered = Boolean(
		urlFilters.ad_date ||
			urlFilters.posted_by ||
			urlFilters.donor_name ||
			urlFilters.portal ||
			urlFilters.gender ||
			urlFilters.place_of_posting ||
			urlFilters.domicile.length ||
			urlFilters.domicile_region.length ||
			urlFilters.tag.length ||
			urlFilters.department ||
			urlFilters.collar.length ||
			urlFilters.has_salary ||
			urlFilters.permanent_only ||
			urlFilters.women_only ||
			urlFilters.transgender_applicable ||
			urlFilters.disability_quota ||
			urlFilters.minority_quota ||
			urlFilters.min_salary != null ||
			urlFilters.salary_from != null ||
			urlFilters.salary_to != null ||
			urlFilters.keyword ||
			urlFilters.q ||
			isAgeFilterActive(urlFilters) ||
			urlFilters.grade ||
			urlFilters.show_expired
	);

	const filtersSnapshot = jobFiltersSnapshot(filters);
	const tracking = {
		...jobQueryTrackingFromLocals(locals, url.pathname + url.search),
		log: filtered
	};

	const resultCount = countJobs(filters).catch((err) => {
		console.error('Failed to count category jobs', err);
		return 0;
	});

	const listing = listJobs(filters, tracking)
		.then((result) => ({
			jobs: result.jobs,
			total: result.total,
			totalPages: result.totalPages,
			error: null as string | null
		}))
		.catch((err) => {
			console.error('Failed to load category jobs', err);
			return {
				jobs: [],
				total: 0,
				totalPages: 1,
				error: 'We could not load job listings right now. Please try again shortly.' as string | null
			};
		});

	return {
		kind: 'category' as const,
		category: {
			slug: category.slug,
			title: category.title,
			h1: category.h1,
			meta_description: category.meta_description,
			intro_content: category.intro_content
		},
		filters: filtersSnapshot,
		filtered,
		resultCount,
		listing
	};
};
