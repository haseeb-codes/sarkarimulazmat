/** Classify administrative / office jobs for the `is_admin_job` tag. */

const ADMIN_TITLE_PATTERN =
	/\b(admin(?:istrative|istration|istrator)?s?\b|admin(?:\s*\/|\s*&|\s*-|\s+))/i;

/** IT / systems roles that happen to contain "admin" but are not office admin jobs. */
const IT_ADMIN_TITLE_PATTERN =
	/\b(database|system|systems|network|sql|server|linux|web|it|sap|dns|cloud|security|software|application)\s+\w*\s*admin/i;

/** Degree areas / qualifications typical of admin postings. */
const BUSINESS_ADMIN_DEGREE_TERMS = [
	'business administration',
	'public administration',
	'bba',
	'mba',
	'mpa',
	'b.com',
	'bcom',
	'm.com',
	'mcom',
	'commerce',
	'management'
] as const;

const SOCIAL_SCIENCE_DEGREE_TERMS = [
	'social science',
	'social sciences',
	'sociology',
	'political science',
	'psychology',
	'economics',
	'anthropology',
	'international relations',
	'mass communication',
	'statistics',
	'english',
	'urdu',
	'islamic studies',
	'public policy',
	'human resource',
	'human resources',
	'hr '
] as const;

/** Generic graduate-level terms common on admin postings when field is not spelled out. */
const GENERIC_ADMIN_DEGREE_TERMS = [
	'graduation',
	"bachelor's",
	'bachelors',
	'bachelor',
	'ba ',
	' ba,',
	',ba',
	'b.a',
	'master',
	'masters',
	"m master's",
	'16 years',
	'14 years'
] as const;

function normalizeField(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase();
}

function fieldMatchesAnyTerm(field: string, terms: readonly string[]): boolean {
	if (!field) return false;
	return terms.some((term) => field.includes(term));
}

function hasShortAdminDegreeCode(field: string): boolean {
	return field
		.split(/[,/]+/)
		.map((part) => part.trim())
		.some((part) =>
			['ba', 'b.a', 'bba', 'mba', 'mpa', 'bcom', 'b.com', 'mcom', 'm.com'].includes(part)
		);
}

/** True when posting lists a business-admin or social-sciences qualification. */
export function hasAdminEligibleDegree(
	degreeArea: string | null | undefined,
	degrees: string | null | undefined
): boolean {
	const combined = `${normalizeField(degreeArea)} ${normalizeField(degrees)}`.trim();
	if (!combined) return false;

	return (
		fieldMatchesAnyTerm(combined, BUSINESS_ADMIN_DEGREE_TERMS) ||
		fieldMatchesAnyTerm(combined, SOCIAL_SCIENCE_DEGREE_TERMS) ||
		fieldMatchesAnyTerm(combined, GENERIC_ADMIN_DEGREE_TERMS) ||
		hasShortAdminDegreeCode(combined)
	);
}

/** True when the job title contains "admin" or a common synonym. */
export function hasAdminTitleKeyword(title: string | null | undefined): boolean {
	const normalized = normalizeField(title);
	if (!normalized) return false;
	if (IT_ADMIN_TITLE_PATTERN.test(normalized)) return false;
	return ADMIN_TITLE_PATTERN.test(normalized);
}

export function isAdminJob(input: {
	title?: string | null;
	degree_area?: string | null;
	degrees?: string | null;
}): boolean {
	return (
		hasAdminTitleKeyword(input.title) &&
		hasAdminEligibleDegree(input.degree_area, input.degrees)
	);
}
