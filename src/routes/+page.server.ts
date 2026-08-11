import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	filtersAreActive,
	eligibilityFiltersActive,
	getBrowseByCategoryData,
	getFilterOptions,
	listJobs,
	parseJobFilters,
	type BrowseByCategoryData,
	type JobFilters
} from '$lib/server/jobs';
import { logSearch } from '$lib/server/search-log';
import {
	createSavedSearch,
	deleteSavedSearch,
	listSavedSearches
} from '$lib/server/saved-searches';

function filtersSnapshot(filters: JobFilters) {
	return {
		degree_areas: filters.degree_areas,
		education_level: filters.education_level,
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
	};
}

const emptyBrowse: BrowseByCategoryData = {
	categories: [],
	educationLevels: []
};

export const load: PageServerLoad = async ({ url, locals }) => {
	const filters = parseJobFilters(url);
	const snapshot = filtersSnapshot(filters);

	// Stream non-critical sections — do not block the job list on these.
	const options = getFilterOptions();
	const browse = getBrowseByCategoryData().catch(() => emptyBrowse);
	const savedSearches = locals.visitorId
		? listSavedSearches(locals.visitorId).catch(() => [])
		: Promise.resolve([]);

	try {
		const result = await listJobs(filters);

		if (filtersAreActive(filters)) {
			logSearch(filters, result.total, locals.visitorId);
		}

		return {
			filters: snapshot,
			jobs: result.jobs,
			total: result.total,
			totalPages: result.totalPages,
			options,
			browse,
			filtered: filtersAreActive(filters),
			canSave: eligibilityFiltersActive(filters),
			savedSearches,
			error: null as string | null
		};
	} catch (err) {
		console.error('Failed to load jobs', err);
		return {
			filters: snapshot,
			jobs: [],
			total: 0,
			totalPages: 1,
			options,
			browse,
			filtered: filtersAreActive(filters),
			canSave: eligibilityFiltersActive(filters),
			savedSearches,
			error: 'We could not load job listings right now. Please try again shortly.'
		};
	}
};

export const actions: Actions = {
	saveSearch: async ({ locals, url }) => {
		if (!locals.visitorId) {
			return fail(400, { saveMessage: 'Could not save — please refresh and try again.' });
		}

		const filters = parseJobFilters(url);
		if (!eligibilityFiltersActive(filters)) {
			return fail(400, { saveMessage: 'Set at least one eligibility filter before saving.' });
		}

		const result = await createSavedSearch(locals.visitorId, filters);
		if (!result.ok) {
			if (result.reason === 'limit') {
				return fail(400, { saveMessage: 'You can save up to 10 searches. Delete one to add another.' });
			}
			return fail(400, { saveMessage: 'This search is already saved.' });
		}

		return { saveMessage: 'Search saved.' };
	},

	deleteSearch: async ({ locals, request }) => {
		if (!locals.visitorId) {
			return fail(400, { saveMessage: 'Could not delete — please refresh and try again.' });
		}

		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { saveMessage: 'Missing saved search id.' });

		const deleted = await deleteSavedSearch(locals.visitorId, id);
		if (!deleted) return fail(404, { saveMessage: 'Saved search not found.' });

		return { saveMessage: 'Saved search removed.' };
	}
};
