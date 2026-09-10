import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	isAdminPasswordConfigured,
	setAdminSessionCookie,
	verifyAdminPassword
} from '$lib/server/admin-auth';

function safeRedirectTo(raw: string | null): string {
	if (!raw) return '/admin';
	if (!raw.startsWith('/admin')) return '/admin';
	if (raw.startsWith('//')) return '/admin';
	return raw;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.adminAuthenticated) {
		redirect(303, safeRedirectTo(url.searchParams.get('redirectTo')));
	}

	return {
		configured: isAdminPasswordConfigured(),
		redirectTo: safeRedirectTo(url.searchParams.get('redirectTo'))
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		if (!isAdminPasswordConfigured()) {
			return fail(503, {
				error: 'Admin password is not configured. Set ADMIN_PASSWORD in the environment.'
			});
		}

		const data = await request.formData();
		const password = String(data.get('password') ?? '');
		const redirectTo = safeRedirectTo(
			String(data.get('redirectTo') ?? url.searchParams.get('redirectTo') ?? '/admin')
		);

		if (!password) {
			return fail(400, { error: 'Enter the admin password.' });
		}

		if (!verifyAdminPassword(password)) {
			return fail(401, { error: 'Incorrect password.' });
		}

		const secure = url.protocol === 'https:';
		if (!setAdminSessionCookie(cookies, secure)) {
			return fail(503, { error: 'Could not create an admin session. Check ADMIN_PASSWORD.' });
		}

		redirect(303, redirectTo);
	}
};
