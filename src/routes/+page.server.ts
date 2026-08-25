import type { PageServerLoad } from './$types';
import {
	filtersAreActive,
	listJobs,
	parseJobFilters,
	type JobFilters
} from '$lib/server/jobs';
import { logSearch } from '$lib/server/search-log';

function filtersSnapshot(filters: JobFilters) {
	return {
		degree_areas: filters.degree_areas,
		education_level: filters.education_level,
		ad_date: filters.ad_date,
		posted_by: filters.posted_by,
		donor_name: filters.donor_name,
		gender: filters.gender,
		qualification: filters.qualification,
		qualification_from: filters.qualification_from,
		qualification_to: filters.qualification_to,
		grade: filters.grade,
		age: filters.age,
		age_from: filters.age_from,
		age_to: filters.age_to,
		include_no_max_age: filters.include_no_max_age,
		age_max: filters.age_max,
		place_of_posting: filters.place_of_posting,
		domicile: filters.domicile,
		domicile_region: filters.domicile_region,
		tag: filters.tag,
		department: filters.department,
		collar: filters.collar,
		province: filters.province,
		program: filters.program,
		keyword: filters.keyword,
		q: filters.q,
		has_salary: filters.has_salary,
		min_salary: filters.min_salary,
		salary_from: filters.salary_from,
		salary_to: filters.salary_to,
		show_expired: filters.show_expired,
		sort: filters.sort,
		page: filters.page,
		pageSize: filters.pageSize
	};
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const filters = parseJobFilters(url);
	const snapshot = filtersSnapshot(filters);

	try {
		const result = await listJobs(filters);

		if (filtersAreActive(filters)) {
			logSearch(filters, result.total, locals.visitorId, locals.clientIp);
		}

		return {
			filters: snapshot,
			jobs: result.jobs,
			total: result.total,
			totalPages: result.totalPages,
			filtered: filtersAreActive(filters),
			error: null as string | null
		};
	} catch (err) {
		console.error('Failed to load jobs', err);
		return {
			filters: snapshot,
			jobs: [],
			total: 0,
			totalPages: 1,
			filtered: filtersAreActive(filters),
			error: 'We could not load job listings right now. Please try again shortly.'
		};
	}
};
