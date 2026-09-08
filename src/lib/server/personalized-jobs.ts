import {
	AGE_FILTER_MAX,
	AGE_FILTER_MIN,
	clampAgeFilter,
	type FilterParams
} from '$lib/jobs-utils';
import type { JobFilters } from '$lib/server/jobs';
import { getProfileById, type UserProfileRecord } from '$lib/server/user-profile';

/** Short / noise tokens dropped when expanding degree fuzzy terms. */
const DEGREE_STOP_WORDS = new Set([
	'a',
	'an',
	'and',
	'or',
	'of',
	'in',
	'the',
	'for',
	'with',
	'to',
	'on',
	'by',
	'at',
	'from',
	'degree',
	'degrees',
	'hons',
	'honours',
	'honors',
	'pass',
	'program',
	'programme',
	'study',
	'studies'
]);

function ageFromDateOfBirth(dob: Date): number | null {
	const today = new Date();
	let age = today.getUTCFullYear() - dob.getUTCFullYear();
	const monthDelta = today.getUTCMonth() - dob.getUTCMonth();
	if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < dob.getUTCDate())) {
		age -= 1;
	}
	if (!Number.isFinite(age)) return null;
	if (age < AGE_FILTER_MIN) return AGE_FILTER_MIN;
	if (age > AGE_FILTER_MAX) return AGE_FILTER_MAX;
	return clampAgeFilter(age);
}

/**
 * Expand profile degree title / specialization into fuzzy match terms.
 * Keeps full phrases plus significant word tokens (case-insensitive contains match).
 */
export function fuzzyDegreeTermsFromProfile(
	degreeTitle: string | null | undefined,
	degreeSpecialization: string | null | undefined
): string[] {
	const terms = new Set<string>();

	for (const raw of [degreeTitle, degreeSpecialization]) {
		const value = raw?.trim();
		if (!value) continue;

		terms.add(value);

		const normalized = value
			.replace(/&/g, ' and ')
			.replace(/[./(),_\-]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		if (normalized && normalized.toLowerCase() !== value.toLowerCase()) {
			terms.add(normalized);
		}

		for (const token of normalized.split(' ')) {
			const cleaned = token.trim();
			if (cleaned.length < 2) continue;
			const lower = cleaned.toLowerCase();
			if (DEGREE_STOP_WORDS.has(lower)) continue;
			// Keep short acronyms (CS, IT, CA) and longer tokens.
			if (cleaned.length === 2 && !/^[A-Za-z]{2}$/.test(cleaned)) continue;
			terms.add(cleaned);
		}
	}

	return [...terms];
}

/** Build filter overlays from a user profile (does not set `personalized`). */
export function profileToPersonalizedPatch(profile: UserProfileRecord): Partial<FilterParams> {
	const patch: Partial<FilterParams> = {};

	if (profile.date_of_birth) {
		const age = ageFromDateOfBirth(profile.date_of_birth);
		if (age != null) patch.age = age;
	}

	if (profile.highest_degree?.trim()) {
		patch.education_level = profile.highest_degree.trim();
	}

	const gender = profile.gender?.trim().toLowerCase();
	if (gender === 'male') {
		patch.exclude_female_only = true;
	}

	const degreeTerms = fuzzyDegreeTermsFromProfile(
		profile.degree_title,
		profile.degree_specialization
	);
	if (degreeTerms.length) {
		patch.personalized_degree_terms = degreeTerms;
	}

	return patch;
}

/**
 * When `personalized` is on and the user is signed in, apply profile-derived constraints.
 * Profile fields always drive age / education / gender exclusion / degree fuzzy terms.
 * Unsigned personalized requests are cleared.
 */
export async function applyPersonalizedFilters(
	filters: JobFilters,
	userId: string | null | undefined
): Promise<JobFilters> {
	if (!filters.personalized) {
		return {
			...filters,
			exclude_female_only: false,
			personalized_degree_terms: []
		};
	}
	if (!userId) {
		return {
			...filters,
			personalized: false,
			exclude_female_only: false,
			personalized_degree_terms: []
		};
	}

	const profile = await getProfileById(userId);
	if (!profile) {
		return {
			...filters,
			personalized: false,
			exclude_female_only: false,
			personalized_degree_terms: []
		};
	}

	const patch = profileToPersonalizedPatch(profile);
	const next: JobFilters = {
		...filters,
		personalized: true,
		exclude_female_only: Boolean(patch.exclude_female_only),
		personalized_degree_terms: patch.personalized_degree_terms ?? []
	};

	// Age from DOB — same eligibility rule as the age filter toggle.
	if (patch.age != null) next.age = patch.age;

	// highest_degree → education_level column.
	if (patch.education_level) next.education_level = patch.education_level;

	return next;
}
