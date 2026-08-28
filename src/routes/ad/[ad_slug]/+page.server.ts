import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAdBySlug, listJobsForAd } from '$lib/server/ads';

/** Ad detail and linked job postings are fully server-rendered for crawlers. */
export const load: PageServerLoad = async ({ params }) => {
	const adSlug = params.ad_slug?.trim();
	if (!adSlug) error(404, 'Advertisement not found');

	const ad = await getAdBySlug(adSlug);
	if (!ad) error(404, 'Advertisement not found');

	try {
		const { jobs, total } = await listJobsForAd(ad);
		return {
			ad,
			listing: {
				jobs,
				total,
				totalPages: 1,
				error: null as string | null
			}
		};
	} catch (err) {
		console.error('Failed to load jobs for ad', adSlug, err);
		return {
			ad,
			listing: {
				jobs: [],
				total: 0,
				totalPages: 1,
				error: 'We could not load job postings for this advertisement.' as string | null
			}
		};
	}
};
