import db from '$lib/server/db';

export const PROFILE_GENDERS = [
	{ value: 'male', label: 'Male' },
	{ value: 'female', label: 'Female' },
	{ value: 'transgender', label: 'Transgender' }
] as const;

export type ProfileGender = (typeof PROFILE_GENDERS)[number]['value'];
export type OnboardingStage = 1 | 2 | 3;

export type UserProfileRecord = {
	id: string;
	google_sub: string;
	email: string;
	name: string | null;
	image: string | null;
	date_of_birth: Date | null;
	highest_degree: string | null;
	degree_title: string | null;
	degree_specialization: string | null;
	graduation_date: Date | null;
	gender: string | null;
	whatsapp_number: string | null;
	has_disability: boolean;
	email_subscribed: boolean;
	consent_given_at: Date | null;
};

const MAX_DEGREE_FIELD_LENGTH = 120;
const MIN_WHATSAPP_DIGITS = 10;
const MAX_WHATSAPP_DIGITS = 15;
const MAX_KEYWORD_LENGTH = 80;
const MAX_KEYWORDS = 20;

export function isStage1Complete(profile: Pick<UserProfileRecord, 'date_of_birth' | 'gender' | 'whatsapp_number'>): boolean {
	return Boolean(profile.date_of_birth && profile.gender && profile.whatsapp_number);
}

export function isStage2Complete(
	profile: Pick<UserProfileRecord, 'highest_degree' | 'degree_title'>
): boolean {
	return Boolean(profile.highest_degree && profile.degree_title);
}

export function isProfileFieldsComplete(profile: UserProfileRecord): boolean {
	return (
		isStage1Complete(profile) &&
		isStage2Complete(profile) &&
		Boolean(profile.consent_given_at)
	);
}

export function getOnboardingStage(profile: UserProfileRecord | null): OnboardingStage {
	if (!profile || !isStage1Complete(profile)) return 1;
	if (!isStage2Complete(profile)) return 2;
	return 3;
}

export async function getJobInterestKeywords(userId: string): Promise<string[]> {
	const rows = await db.userJobInterest.findMany({
		where: { user_id: userId },
		orderBy: { created_at: 'asc' },
		select: { keyword: true }
	});
	return rows.map((row) => row.keyword);
}

export async function isProfileComplete(userId: string): Promise<boolean> {
	const profile = await getProfileById(userId);
	if (!profile || !isProfileFieldsComplete(profile)) return false;

	const interestCount = await db.userJobInterest.count({ where: { user_id: userId } });
	return interestCount > 0;
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

function normalizeWhatsappNumber(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const digits = trimmed.replace(/\D/g, '');
	if (digits.length < MIN_WHATSAPP_DIGITS || digits.length > MAX_WHATSAPP_DIGITS) {
		return null;
	}

	return digits;
}

function validateDateOfBirth(dateOfBirth: Date | null): { ok: true } | { ok: false; error: string } {
	if (!dateOfBirth) {
		return { ok: false, error: 'Please enter your date of birth.' };
	}

	const now = new Date();
	const minBirth = new Date(`${now.getUTCFullYear() - 80}-01-01T00:00:00.000Z`);
	const maxBirth = new Date(`${now.getUTCFullYear() - 16}-12-31T00:00:00.000Z`);

	if (dateOfBirth < minBirth || dateOfBirth > maxBirth) {
		return { ok: false, error: 'Please enter a valid date of birth (age 16–80).' };
	}

	return { ok: true };
}

export function validateStage1Fields(fields: {
	dateOfBirth: string;
	gender: string;
	whatsappNumber: string;
	hasDisability: boolean;
}):
	| {
			ok: true;
			data: {
				dateOfBirth: Date;
				gender: ProfileGender;
				whatsappNumber: string;
				hasDisability: boolean;
			};
	  }
	| { ok: false; error: string } {
	const dateOfBirth = parseDateOnly(fields.dateOfBirth);
	const gender = fields.gender.trim() as ProfileGender;
	const whatsappNumber = normalizeWhatsappNumber(fields.whatsappNumber);

	if (!gender) {
		return { ok: false, error: 'Please select your gender.' };
	}

	if (!whatsappNumber) {
		return { ok: false, error: 'Please enter a valid WhatsApp number (10–15 digits).' };
	}

	if (!PROFILE_GENDERS.some((g) => g.value === gender)) {
		return { ok: false, error: 'Please choose a valid gender option.' };
	}

	const dobCheck = validateDateOfBirth(dateOfBirth);
	if (!dobCheck.ok) return dobCheck;

	return {
		ok: true,
		data: {
			dateOfBirth: dateOfBirth!,
			gender,
			whatsappNumber,
			hasDisability: fields.hasDisability
		}
	};
}

export function validateStage2Fields(fields: {
	highestDegree: string;
	degreeTitle: string;
	degreeSpecialization: string;
	allowedEducationLevels: string[];
}):
	| {
			ok: true;
			data: {
				highestDegree: string;
				degreeTitle: string;
				degreeSpecialization: string | null;
			};
	  }
	| { ok: false; error: string } {
	const highestDegree = fields.highestDegree.trim();
	const degreeTitle = fields.degreeTitle.trim();
	const degreeSpecialization = fields.degreeSpecialization.trim();

	if (!highestDegree || !degreeTitle) {
		return { ok: false, error: 'Please fill in all required fields.' };
	}

	if (degreeTitle.length > MAX_DEGREE_FIELD_LENGTH) {
		return { ok: false, error: 'Qualification degree is too long.' };
	}

	if (degreeSpecialization.length > MAX_DEGREE_FIELD_LENGTH) {
		return { ok: false, error: 'Qualification specialization is too long.' };
	}

	if (!fields.allowedEducationLevels.includes(highestDegree)) {
		return { ok: false, error: 'Please choose a valid qualification level.' };
	}

	return {
		ok: true,
		data: {
			highestDegree,
			degreeTitle,
			degreeSpecialization: degreeSpecialization || null
		}
	};
}

export function parseJobInterestKeywords(rawKeywords: string[]): string[] {
	const seen = new Set<string>();
	const keywords: string[] = [];

	for (const raw of rawKeywords) {
		const keyword = raw.trim();
		if (!keyword) continue;

		const key = keyword.toLowerCase();
		if (seen.has(key)) continue;

		seen.add(key);
		keywords.push(keyword);
	}

	return keywords;
}

export function validateStage3Fields(fields: {
	keywords: string[];
	consent: boolean;
}):
	| { ok: true; data: { keywords: string[] } }
	| { ok: false; error: string } {
	const keywords = parseJobInterestKeywords(fields.keywords);

	if (keywords.length === 0) {
		return { ok: false, error: 'Please add at least one job interest keyword.' };
	}

	if (keywords.length > MAX_KEYWORDS) {
		return { ok: false, error: `You can add up to ${MAX_KEYWORDS} keywords.` };
	}

	for (const keyword of keywords) {
		if (keyword.length > MAX_KEYWORD_LENGTH) {
			return { ok: false, error: `Each keyword must be ${MAX_KEYWORD_LENGTH} characters or fewer.` };
		}
	}

	if (!fields.consent) {
		return {
			ok: false,
			error: 'Please consent to storing your profile and receiving job-match emails.'
		};
	}

	return { ok: true, data: { keywords } };
}

/** @deprecated Use stage validators for onboarding; kept for profile edit page. */
export function validateProfileFields(fields: {
	dateOfBirth: string;
	highestDegree: string;
	degreeTitle: string;
	degreeSpecialization: string;
	gender: string;
	whatsappNumber: string;
	hasDisability: boolean;
	consent: boolean;
	allowedEducationLevels: string[];
}):
	| {
			ok: true;
			data: {
				dateOfBirth: Date;
				highestDegree: string;
				degreeTitle: string;
				degreeSpecialization: string | null;
				gender: ProfileGender;
				whatsappNumber: string;
				hasDisability: boolean;
			};
	  }
	| { ok: false; error: string } {
	const stage1 = validateStage1Fields({
		dateOfBirth: fields.dateOfBirth,
		gender: fields.gender,
		whatsappNumber: fields.whatsappNumber,
		hasDisability: fields.hasDisability
	});
	if (!stage1.ok) return stage1;

	const stage2 = validateStage2Fields({
		highestDegree: fields.highestDegree,
		degreeTitle: fields.degreeTitle,
		degreeSpecialization: fields.degreeSpecialization,
		allowedEducationLevels: fields.allowedEducationLevels
	});
	if (!stage2.ok) return stage2;

	if (!fields.consent) {
		return { ok: false, error: 'Please consent to storing your profile and receiving job-match emails.' };
	}

	return {
		ok: true,
		data: {
			dateOfBirth: stage1.data.dateOfBirth,
			highestDegree: stage2.data.highestDegree,
			degreeTitle: stage2.data.degreeTitle,
			degreeSpecialization: stage2.data.degreeSpecialization,
			gender: stage1.data.gender,
			whatsappNumber: stage1.data.whatsappNumber,
			hasDisability: stage1.data.hasDisability
		}
	};
}

export async function replaceJobInterestKeywords(userId: string, keywords: string[]): Promise<void> {
	await db.$transaction([
		db.userJobInterest.deleteMany({ where: { user_id: userId } }),
		db.userJobInterest.createMany({
			data: keywords.map((keyword) => ({ user_id: userId, keyword }))
		})
	]);
}
