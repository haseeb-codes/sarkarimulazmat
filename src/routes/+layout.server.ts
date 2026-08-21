import type { LayoutServerLoad } from './$types';
import {
	getBrowseByCategoryData,
	getFilterOptions,
	type BrowseByCategoryData
} from '$lib/server/jobs';

const emptyBrowse: BrowseByCategoryData = {
	adDates: [],
	postedBy: [],
	donors: [],
	genders: [],
	degreeAreas: [],
	educationLevels: [],
	jobInterestTree: [],
	topTags: []
};

/**
 * Filter-independent browse/sidebar data. Lives in the layout so it does not
 * re-run when only search params change — only the page `load` (jobs) updates.
 */
export const load: LayoutServerLoad = async () => {
	return {
		browse: getBrowseByCategoryData().catch(() => emptyBrowse),
		filterOptions: getFilterOptions()
	};
};
