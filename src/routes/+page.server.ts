import type { PageServerLoad } from './$types';
import {
	filtersAreActive,
	countJobs,
	getClosingOnDates,
	getPostedOnDates,
	listJobs,
	parseJobFilters
} from '$lib/server/jobs';
import { getTopTagCounts } from '$lib/server/job-category-jobs';
import { jobFiltersSnapshot } from '$lib/server/filters-snapshot';
import { applyPersonalizedFilters } from '$lib/server/personalized-jobs';
import { jobQueryTrackingFromLocals } from '$lib/server/request-context';

export const load: PageServerLoad = async ({ url, locals }) => {
	const session = await locals.auth();
	const urlFilters = parseJobFilters(url);
	const filters = await applyPersonalizedFilters(urlFilters, session?.user?.id);
	const snapshot = jobFiltersSnapshot({
		...urlFilters,
		personalized: Boolean(filters.personalized)
	});
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

	// Non-blocking: Closing On / Posted On dropdown options stream after the shell paints.
	const closingOnDates = getClosingOnDates().catch((err) => {
		console.error('Failed to load closing-on dates', err);
		return [] as string[];
	});

	const postedOnDates = getPostedOnDates().catch((err) => {
		console.error('Failed to load posted-on dates', err);
		return [] as string[];
	});

	// Non-blocking: home tag chips with counts stream independently of listing.
	const topTags = getTopTagCounts().catch((err) => {
		console.error('Failed to load top tags', err);
		return [] as Awaited<ReturnType<typeof getTopTagCounts>>;
	});

	return {
		filters: snapshot,
		filtered,
		resultCount,
		listing,
		closingOnDates,
		postedOnDates,
		topTags
	};
};
