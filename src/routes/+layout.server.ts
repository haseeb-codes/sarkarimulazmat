import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getProfileById, isProfileComplete } from '$lib/server/user-profile';

const PROFILE_EXEMPT_PREFIXES = ['/auth', '/login', '/privacy', '/terms'];

function isProfileExemptPath(pathname: string): boolean {
	if (pathname === '/onboarding') return true;
	return PROFILE_EXEMPT_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);
}

/**
 * Layout load — await only auth/profile redirects.
 * Filter UI is static (no DB). Job listings stream from page `load`.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = await locals.auth();
	const profile = session?.user?.id ? await getProfileById(session.user.id) : null;
	const profileComplete = session?.user?.id ? await isProfileComplete(session.user.id) : false;

	if (session?.user?.id && !profileComplete && !isProfileExemptPath(url.pathname)) {
		redirect(303, '/onboarding');
	}

	if (session?.user?.id && profileComplete && url.pathname === '/onboarding') {
		redirect(303, '/profile');
	}

	return {
		session,
		profile,
		profileComplete
	};
};
