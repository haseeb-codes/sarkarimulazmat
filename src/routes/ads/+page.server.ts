import type { PageServerLoad } from './$types';
import { listAds, parseAdListParams } from '$lib/server/ads';

/** All listing data is fetched in load so ads and results are in the initial HTML. */
export const load: PageServerLoad = async ({ url }) => {
	const params = parseAdListParams(url);

	try {
		const result = await listAds(params);
		return {
			...result,
			q: params.q,
			show_expired: params.show_expired,
			error: null as string | null
		};
	} catch (err) {
		console.error('Failed to load ads', err);
		return {
			ads: [],
			total: 0,
			page: params.page,
			pageSize: params.pageSize,
			totalPages: 1,
			q: params.q,
			show_expired: params.show_expired,
			error: 'We could not load job advertisements right now. Please try again shortly.' as string | null
		};
	}
};
