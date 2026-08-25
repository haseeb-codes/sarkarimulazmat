import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import db from '$lib/server/db';
import { getFilterOptions } from '$lib/server/jobs';
import {
	isProfileComplete,
	PROFILE_GENDERS,
	validateProfileFields
} from '$lib/server/user-profile';

function formValues(fields: {
	dateOfBirth: string;
	highestDegree: string;
	graduationDate: string;
	gender: string;
}) {
	return fields;
}

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		redirect(303, '/login');
	}

	const profile = await db.userProfile.findUnique({ where: { id: session.user.id } });
	if (profile && isProfileComplete(profile)) {
		redirect(303, '/profile');
	}

	const filterOptions = await getFilterOptions();

	return {
		profile,
		educationLevels: filterOptions.education_levels,
		genders: PROFILE_GENDERS
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) {
			redirect(303, '/login');
		}

		const filterOptions = await getFilterOptions();
		const data = await request.formData();
		const dateOfBirth = String(data.get('date_of_birth') ?? '');
		const highestDegree = String(data.get('highest_degree') ?? '');
		const graduationDate = String(data.get('graduation_date') ?? '');
		const gender = String(data.get('gender') ?? '');
		const consent = data.get('consent') === 'on';
		const values = formValues({ dateOfBirth, highestDegree, graduationDate, gender });

		const validated = validateProfileFields({
			dateOfBirth,
			highestDegree,
			graduationDate,
			gender,
			consent,
			allowedEducationLevels: filterOptions.education_levels
		});

		if (!validated.ok) {
			return fail(400, { ...values, error: validated.error });
		}

		try {
			await db.userProfile.update({
				where: { id: session.user.id },
				data: {
					date_of_birth: validated.data.dateOfBirth,
					highest_degree: validated.data.highestDegree,
					graduation_date: validated.data.graduationDate,
					gender: validated.data.gender,
					consent_given_at: new Date()
				}
			});
		} catch (err) {
			console.error('Failed to save user profile', err);
			return fail(500, {
				...values,
				error: 'We could not save your profile right now. Please try again.'
			});
		}

		redirect(303, '/profile');
	}
};
