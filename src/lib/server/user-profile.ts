import db from '$lib/server/db';

export const PROFILE_GENDERS = [
	{ value: 'male', label: 'Male' },
	{ value: 'female', label: 'Female' },
	{ value: 'transgender', label: 'Transgender' },
	{ value: 'prefer_not_to_say', label: 'Prefer not to say' }
] as const;

export type ProfileGender = (typeof PROFILE_GENDERS)[number]['value'];

export type UserProfileRecord = {
	id: string;
	google_sub: string;
	email: string;
	name: string | null;
	image: string | null;
	date_of_birth: Date | null;
	highest_degree: string | null;
	graduation_date: Date | null;
	gender: string | null;
	email_subscribed: boolean;
	consent_given_at: Date | null;
};

export function isProfileComplete(profile: UserProfileRecord): boolean {
	return Boolean(
		profile.date_of_birth &&
			profile.highest_degree &&
			profile.graduation_date &&
			profile.gender &&
			profile.consent_given_at
	);
}

export async function getProfileById(id: string): Promise<UserProfileRecord | null> {
	return db.userProfile.findUnique({ where: { id } });
}

export async function ensureUserProfile(data: {
	googleSub: string;
	email: string;
	name?: string | null;
	image?: string | null;
}): Promise<UserProfileRecord> {
	return db.userProfile.upsert({
		where: { google_sub: data.googleSub },
		create: {
			google_sub: data.googleSub,
			email: data.email,
			name: data.name ?? null,
			image: data.image ?? null
		},
		update: {
			email: data.email,
			...(data.name != null ? { name: data.name } : {}),
			...(data.image != null ? { image: data.image } : {})
		}
	});
}

/** Attach anonymous visitor activity to a signed-in user (no-op if already linked). */
export async function linkVisitorToUser(visitorId: string, userId: string): Promise<void> {
	const visitor = await db.visitor.findUnique({
		where: { id: visitorId },
		select: { user_id: true }
	});
	if (!visitor || visitor.user_id === userId) return;

	await db.$transaction([
		db.visitor.updateMany({
			where: { id: visitorId },
			data: { user_id: userId }
		}),
		db.savedSearch.updateMany({
			where: { visitor_id: visitorId, user_id: null },
			data: { user_id: userId }
		}),
		db.searchLog.updateMany({
			where: { visitor_id: visitorId, user_id: null },
			data: { user_id: userId }
		})
	]);
}

function parseDateOnly(value: string): Date | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const date = new Date(`${trimmed}T00:00:00.000Z`);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function validateProfileFields(fields: {
	dateOfBirth: string;
	highestDegree: string;
	graduationDate: string;
	gender: string;
	consent: boolean;
	allowedEducationLevels: string[];
}):
	| { ok: true; data: { dateOfBirth: Date; highestDegree: string; graduationDate: Date; gender: ProfileGender } }
	| { ok: false; error: string } {
	const dateOfBirth = parseDateOnly(fields.dateOfBirth);
	const graduationDate = parseDateOnly(fields.graduationDate);
	const highestDegree = fields.highestDegree.trim();
	const gender = fields.gender.trim() as ProfileGender;

	if (!dateOfBirth || !graduationDate || !highestDegree || !gender) {
		return { ok: false, error: 'Please fill in all required fields.' };
	}

	if (!fields.consent) {
		return { ok: false, error: 'Please consent to storing your profile and receiving job-match emails.' };
	}

	if (!fields.allowedEducationLevels.includes(highestDegree)) {
		return { ok: false, error: 'Please choose a valid education level.' };
	}

	if (!PROFILE_GENDERS.some((g) => g.value === gender)) {
		return { ok: false, error: 'Please choose a valid gender option.' };
	}

	const now = new Date();
	const minBirth = new Date(`${now.getUTCFullYear() - 80}-01-01T00:00:00.000Z`);
	const maxBirth = new Date(`${now.getUTCFullYear() - 16}-12-31T00:00:00.000Z`);

	if (dateOfBirth < minBirth || dateOfBirth > maxBirth) {
		return { ok: false, error: 'Please enter a valid date of birth (age 16–80).' };
	}

	if (graduationDate <= dateOfBirth) {
		return { ok: false, error: 'Graduation date must be after your date of birth.' };
	}

	if (graduationDate > now) {
		return { ok: false, error: 'Graduation date cannot be in the future.' };
	}

	return {
		ok: true,
		data: { dateOfBirth, highestDegree, graduationDate, gender }
	};
}
