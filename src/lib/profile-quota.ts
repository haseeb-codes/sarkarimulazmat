export const PROFILE_RELIGIONS = [
	{ value: 'muslim', label: 'Muslim' },
	{ value: 'non_muslim', label: 'Non-Muslim' }
] as const;

export type ProfileReligion = (typeof PROFILE_RELIGIONS)[number]['value'];

export const DEFAULT_PROFILE_RELIGION: ProfileReligion = 'muslim';

export const DISABILITY_TOGGLE_OPTIONS = [
	{ value: 'false', label: 'No disability' },
	{ value: 'true', label: 'Disability' }
] as const;

export const QUOTA_INFO_TEXT =
	'Some government jobs reserve special quotas for minorities and people with disabilities. We ask for this information to highlight jobs you may qualify for under those quotas.';

export function parseDisabilityFormValue(value: FormDataEntryValue | null): boolean {
	return String(value ?? 'false') === 'true';
}

export function disabilityFormValue(hasDisability: boolean): string {
	return hasDisability ? 'true' : 'false';
}
