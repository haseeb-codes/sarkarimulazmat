import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import db from '$lib/server/db';
import { getFilterOptions } from '$lib/server/jobs';
import {
	getJobInterestKeywords,
	getOnboardingStage,
	isProfileComplete,
	PROFILE_GENDERS,
	replaceJobInterestKeywords,
	validateStage1Fields,
	validateStage2Fields,
	validateStage3Fields
} from '$lib/server/user-profile';

function formatDateInput(date: Date | null | undefined): string {
	return date ? date.toISOString().slice(0, 10) : '';
}

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		redirect(303, '/login');
	}

	const userId = session.user.id;

	if (await isProfileComplete(userId)) {
		redirect(303, '/profile');
	}

	const [profile, jobInterests, filterOptions] = await Promise.all([
		db.userProfile.findUnique({ where: { id: userId } }),
		getJobInterestKeywords(userId),
		getFilterOptions()
	]);

	return {
		profile,
		initialStage: getOnboardingStage(profile),
		jobInterests,
		educationLevels: filterOptions.education_levels,
		genders: PROFILE_GENDERS,
		values: {
			dateOfBirth: formatDateInput(profile?.date_of_birth),
			gender: profile?.gender ?? '',
			whatsappNumber: profile?.whatsapp_number ?? '',
			hasDisability: profile?.has_disability ?? false,
			highestDegree: profile?.highest_degree ?? '',
			degreeTitle: profile?.degree_title ?? '',
			degreeSpecialization: profile?.degree_specialization ?? ''
		}
	};
};

export const actions: Actions = {
	stage1: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) {
			redirect(303, '/login');
		}

		const data = await request.formData();
		const dateOfBirth = String(data.get('date_of_birth') ?? '');
		const gender = String(data.get('gender') ?? '');
		const whatsappNumber = String(data.get('whatsapp_number') ?? '');
		const hasDisability = data.get('has_disability') === 'on';

		const validated = validateStage1Fields({
			dateOfBirth,
			gender,
			whatsappNumber,
			hasDisability
		});

		if (!validated.ok) {
			return fail(400, {
				stage: 1,
				dateOfBirth,
				gender,
				whatsappNumber,
				hasDisability,
				error: validated.error
			});
		}

		try {
			await db.userProfile.update({
				where: { id: session.user.id },
				data: {
					date_of_birth: validated.data.dateOfBirth,
					gender: validated.data.gender,
					whatsapp_number: validated.data.whatsappNumber,
					has_disability: validated.data.hasDisability
				}
			});
		} catch (err) {
			console.error('Failed to save onboarding stage 1', err);
			return fail(500, {
				stage: 1,
				dateOfBirth,
				gender,
				whatsappNumber,
				hasDisability,
				error: 'We could not save your details right now. Please try again.'
			});
		}

		return { stage: 2, success: true };
	},

	stage2: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) {
			redirect(303, '/login');
		}

		const filterOptions = await getFilterOptions();
		const data = await request.formData();
		const highestDegree = String(data.get('highest_degree') ?? '');
		const degreeTitle = String(data.get('degree_title') ?? '');
		const degreeSpecialization = String(data.get('degree_specialization') ?? '');

		const validated = validateStage2Fields({
			highestDegree,
			degreeTitle,
			degreeSpecialization,
			allowedEducationLevels: filterOptions.education_levels
		});

		if (!validated.ok) {
			return fail(400, {
				stage: 2,
				highestDegree,
				degreeTitle,
				degreeSpecialization,
				error: validated.error
			});
		}

		try {
			await db.userProfile.update({
				where: { id: session.user.id },
				data: {
					highest_degree: validated.data.highestDegree,
					degree_title: validated.data.degreeTitle,
					degree_specialization: validated.data.degreeSpecialization,
					graduation_date: null
				}
			});
		} catch (err) {
			console.error('Failed to save onboarding stage 2', err);
			return fail(500, {
				stage: 2,
				highestDegree,
				degreeTitle,
				degreeSpecialization,
				error: 'We could not save your qualifications right now. Please try again.'
			});
		}

		return { stage: 3, success: true };
	},

	stage3: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) {
			redirect(303, '/login');
		}

		const data = await request.formData();
		const keywords = data.getAll('keyword').map(String);
		const consent = data.get('consent') === 'on';

		const validated = validateStage3Fields({ keywords, consent });

		if (!validated.ok) {
			return fail(400, {
				stage: 3,
				keywords,
				error: validated.error
			});
		}

		try {
			await db.userProfile.update({
				where: { id: session.user.id },
				data: { consent_given_at: new Date() }
			});
			await replaceJobInterestKeywords(session.user.id, validated.data.keywords);
		} catch (err) {
			console.error('Failed to save onboarding stage 3', err);
			return fail(500, {
				stage: 3,
				keywords: validated.data.keywords,
				error: 'We could not save your job interests right now. Please try again.'
			});
		}

		redirect(303, '/profile');
	}
};
