import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isProfileComplete } from '$lib/server/user-profile';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) return {};

	const complete = await isProfileComplete(session.user.id);
	redirect(303, complete ? '/profile' : '/onboarding');
};
