import type { PageServerLoad } from './$types';
import {
	filtersAreActive,
	countJobs,
	getClosingOnDates,
	listJobs,
	parseJobFilters
} from '$lib/server/jobs';
import { jobFiltersSnapshot } from '$lib/server/filters-snapshot';
import { jobQueryTrackingFromLocals } from '$lib/server/request-context';

export const load: PageServerLoad = ({ url, locals }) => {
	const filters = parseJobFilters(url);
	const snapshot = jobFiltersSnapshot(filters);
	const filtered = filtersAreActive(filters);
	const tracking = jobQueryTrackingFromLocals(locals, url.pathname + url.search);

	// Stream count and listings independently — shell renders immediately for both.
	const resultCount = countJobs(filters).catch((err) => {
		console.error('Failed to count jobs', err);
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
			console.error('Failed to load jobs', err);
			return {
				jobs: [],
				total: 0,
				totalPages: 1,
				error: 'We could not load job listings right now. Please try again shortly.' as string | null
			};
		});

	// Non-blocking: Closing On dropdown options stream after the shell paints.
	const closingOnDates = getClosingOnDates().catch((err) => {
		console.error('Failed to load closing-on dates', err);
		return [] as string[];
	});

	return {
		filters: snapshot,
		filtered,
		resultCount,
		listing,
		closingOnDates
	};
};
