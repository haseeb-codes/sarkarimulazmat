import type { PageServerLoad } from './$types';
import { loadSocialJobImageData } from '$lib/server/social-job-images';

export const load: PageServerLoad = async ({ params, url }) => {
	return loadSocialJobImageData(params.slug, url.searchParams.get('format'), url.searchParams.get('page'));
};
