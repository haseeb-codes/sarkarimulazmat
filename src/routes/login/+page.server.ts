import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProfileById, isProfileComplete } from '$lib/server/user-profile';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) return {};

	const profile = await getProfileById(session.user.id);
	redirect(303, profile && isProfileComplete(profile) ? '/profile' : '/onboarding');
};
