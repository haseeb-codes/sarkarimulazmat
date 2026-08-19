import type { PageServerLoad } from './$types';
import {
	filtersAreActive,
	getBrowseByCategoryData,
	listJobs,
	parseJobFilters,
	type BrowseByCategoryData,
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
		grade: filters.grade,
		age: filters.age,
		place_of_posting: filters.place_of_posting,
		domicile: filters.domicile,
		department: filters.department,
		collar: filters.collar,
		program: filters.program,
		q: filters.q,
		has_salary: filters.has_salary,
		show_expired: filters.show_expired,
		sort: filters.sort,
		page: filters.page,
		pageSize: filters.pageSize
	};
}

const emptyBrowse: BrowseByCategoryData = {
	adDates: [],
	postedBy: [],
	donors: [],
	genders: [],
	degreeAreas: [],
	educationLevels: [],
	jobInterestTree: []
};

export const load: PageServerLoad = async ({ url, locals }) => {
	const filters = parseJobFilters(url);
	const snapshot = filtersSnapshot(filters);

	// Stream non-critical sections — do not block the job list on these.
	const browse = getBrowseByCategoryData().catch(() => emptyBrowse);

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
			browse,
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
			browse,
			filtered: filtersAreActive(filters),
			error: 'We could not load job listings right now. Please try again shortly.'
		};
	}
};
