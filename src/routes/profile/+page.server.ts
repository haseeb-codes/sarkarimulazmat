import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import db from '$lib/server/db';
import { getFilterOptions } from '$lib/server/jobs';
import {
	getJobInterestKeywords,
	isProfileComplete,
	parseJobInterestKeywords,
	PROFILE_GENDERS,
	replaceJobInterestKeywords,
	validateProfileFields
} from '$lib/server/user-profile';

function formValues(fields: {
	dateOfBirth: string;
	highestDegree: string;
	degreeTitle: string;
	degreeSpecialization: string;
	gender: string;
	whatsappNumber: string;
	hasDisability: boolean;
}) {
	return fields;
}

function formatDateInput(date: Date | null | undefined): string {
	return date ? date.toISOString().slice(0, 10) : '';
}

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		redirect(303, '/login');
	}

	const profile = await db.userProfile.findUnique({ where: { id: session.user.id } });
	if (!profile || !(await isProfileComplete(session.user.id))) {
		redirect(303, '/onboarding');
	}

	const [filterOptions, jobInterests] = await Promise.all([
		getFilterOptions(),
		getJobInterestKeywords(session.user.id)
	]);

	return {
		profile,
		jobInterests,
		educationLevels: filterOptions.education_levels,
		genders: PROFILE_GENDERS,
		values: {
			dateOfBirth: formatDateInput(profile.date_of_birth),
			highestDegree: profile.highest_degree ?? '',
			degreeTitle: profile.degree_title ?? '',
			degreeSpecialization: profile.degree_specialization ?? '',
			gender: profile.gender ?? '',
			whatsappNumber: profile.whatsapp_number ?? '',
			hasDisability: profile.has_disability
		}
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) {
			redirect(303, '/login');
		}

		const filterOptions = await getFilterOptions();
		const data = await request.formData();
		const dateOfBirth = String(data.get('date_of_birth') ?? '');
		const highestDegree = String(data.get('highest_degree') ?? '');
		const degreeTitle = String(data.get('degree_title') ?? '');
		const degreeSpecialization = String(data.get('degree_specialization') ?? '');
		const gender = String(data.get('gender') ?? '');
		const whatsappNumber = String(data.get('whatsapp_number') ?? '');
		const hasDisability = data.get('has_disability') === 'on';
		const consent = data.get('consent') === 'on';
		const rawKeywords = data.getAll('keyword').map(String);
		const keywords = parseJobInterestKeywords(rawKeywords);
		const values = formValues({
			dateOfBirth,
			highestDegree,
			degreeTitle,
			degreeSpecialization,
			gender,
			whatsappNumber,
			hasDisability
		});

		if (keywords.length === 0) {
			return fail(400, {
				...values,
				keywords: rawKeywords,
				error: 'Please add at least one job interest keyword.'
			});
		}

		const validated = validateProfileFields({
			dateOfBirth,
			highestDegree,
			degreeTitle,
			degreeSpecialization,
			gender,
			whatsappNumber,
			hasDisability,
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
					degree_title: validated.data.degreeTitle,
					degree_specialization: validated.data.degreeSpecialization,
					graduation_date: null,
					gender: validated.data.gender,
					whatsapp_number: validated.data.whatsappNumber,
					has_disability: validated.data.hasDisability,
					consent_given_at: new Date()
				}
			});
			await replaceJobInterestKeywords(session.user.id, keywords);
		} catch (err) {
			console.error('Failed to update user profile', err);
			return fail(500, {
				...values,
				error: 'We could not update your profile right now. Please try again.'
			});
		}

		return { success: true, ...values };
	},
	delete: async ({ locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) {
			redirect(303, '/login');
		}

		const userId = session.user.id;

		try {
			await db.$transaction([
				db.savedSearch.deleteMany({ where: { user_id: userId } }),
				db.searchLog.updateMany({ where: { user_id: userId }, data: { user_id: null } }),
				db.visitor.updateMany({ where: { user_id: userId }, data: { user_id: null } }),
				db.userProfile.delete({ where: { id: userId } })
			]);
		} catch (err) {
			console.error('Failed to delete user profile', err);
			return fail(500, { error: 'We could not delete your profile right now. Please try again.' });
		}

		redirect(303, '/auth/signout?callbackUrl=/login');
	}
};
