import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import {
	getBrowseByCategoryData,
	getFilterOptions,
	type BrowseByCategoryData
} from '$lib/server/jobs';
import { getProfileById, isProfileComplete } from '$lib/server/user-profile';

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

const PROFILE_EXEMPT_PREFIXES = ['/auth', '/login', '/privacy', '/terms'];

function isProfileExemptPath(pathname: string): boolean {
	if (pathname === '/onboarding') return true;
	return PROFILE_EXEMPT_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);
}

/**
 * Filter-independent browse/sidebar data. Lives in the layout so it does not
 * re-run when only search params change — only the page `load` (jobs) updates.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = await locals.auth();
	const profile = session?.user?.id ? await getProfileById(session.user.id) : null;
	const profileComplete = profile ? isProfileComplete(profile) : false;

	if (session?.user?.id && !profileComplete && !isProfileExemptPath(url.pathname)) {
		redirect(303, '/onboarding');
	}

	if (session?.user?.id && profileComplete && url.pathname === '/onboarding') {
		redirect(303, '/profile');
	}

	return {
		session,
		profile,
		profileComplete,
		browse: getBrowseByCategoryData().catch(() => emptyBrowse),
		filterOptions: getFilterOptions()
	};
};
