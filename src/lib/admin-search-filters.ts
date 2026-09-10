import {
	activeFilterChips,
	type FilterParams
} from '$lib/jobs-utils';
import type { AdminSearchFilterChip } from '$lib/admin-types';

function asString(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function asBoolean(value: unknown): boolean | undefined {
	if (typeof value === 'boolean') return value;
	return undefined;
}

function asNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
		return Number(value);
	}
	return null;
}

function asStringArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value
			.filter((item): item is string => typeof item === 'string')
			.map((item) => item.trim())
			.filter(Boolean);
	}
	const single = asString(value);
	return single ? [single] : [];
}

function asNumberArray(value: unknown): number[] {
	if (Array.isArray(value)) {
		return value
			.map((item) => asNumber(item))
			.filter((item): item is number => item != null);
	}
	const single = asNumber(value);
	return single != null ? [single] : [];
}

/** Coerce search-log JSON into FilterParams for chip labeling. */
export function searchLogFiltersToParams(filters: unknown): FilterParams {
	if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
		return {};
	}

	const record = filters as Record<string, unknown>;

	return {
		degree_areas: asStringArray(record.degree_areas),
		education_level: asString(record.education_level),
		ad_date: asString(record.ad_date),
		closing_on: asString(record.closing_on),
		posted_by: asString(record.posted_by),
		donor_name: asString(record.donor_name),
		portal: asString(record.portal),
		gender: asString(record.gender) as FilterParams['gender'],
		qualification: asNumberArray(record.qualification),
		qualification_level: asNumber(record.qualification_level),
		qualification_from: asNumber(record.qualification_from),
		qualification_to: asNumber(record.qualification_to),
		grade: asString(record.grade),
		age: asNumber(record.age),
		age_from: asNumber(record.age_from),
		age_to: asNumber(record.age_to),
		include_no_max_age: asBoolean(record.include_no_max_age),
		age_max: asString(record.age_max) as FilterParams['age_max'],
		place_of_posting: asString(record.place_of_posting),
		domicile: asStringArray(record.domicile),
		domicile_region: asStringArray(record.domicile_region),
		tag: asStringArray(record.tag),
		department: asString(record.department),
		collar: asStringArray(record.collar),
		province:
			typeof record.province === 'boolean'
				? record.province
				: record.province === 'true'
					? true
					: record.province === 'false'
						? false
						: null,
		program: asString(record.program),
		keyword: asString(record.keyword),
		q: asString(record.q),
		has_salary: Boolean(record.has_salary),
		permanent_only: Boolean(record.permanent_only),
		personalized: Boolean(record.personalized),
		women_only: Boolean(record.women_only),
		transgender_applicable: Boolean(record.transgender_applicable),
		disability_quota: Boolean(record.disability_quota),
		minority_quota: Boolean(record.minority_quota),
		min_salary: asNumber(record.min_salary),
		salary_from: asNumber(record.salary_from),
		salary_to: asNumber(record.salary_to),
		show_expired: Boolean(record.show_expired),
		sort: asString(record.sort) as FilterParams['sort'],
		page: asNumber(record.page) ?? undefined,
		pageSize: asNumber(record.pageSize) ?? undefined
	};
}

/** Map chip ids to broad categories for aggregate charts. */
export function filterChipCategory(chipId: string): string {
	if (chipId === 'q' || chipId === 'keyword') return 'Keyword';
	if (chipId.startsWith('degree:')) return 'Degree area';
	if (chipId === 'education_level') return 'Education';
	if (chipId === 'ad_date') return 'Posted date';
	if (chipId === 'closing_on') return 'Closing date';
	if (chipId === 'posted_by') return 'Posted by';
	if (chipId === 'donor_name') return 'Donor';
	if (chipId === 'portal') return 'Portal';
	if (chipId === 'gender') return 'Gender';
	if (chipId.startsWith('qualification:')) return 'Qualification';
	if (chipId === 'grade') return 'Grade';
	if (chipId === 'age') return 'Age';
	if (chipId === 'place_of_posting') return 'Location';
	if (chipId.startsWith('domicile:')) return 'Domicile';
	if (chipId.startsWith('domicile_region:')) return 'Domicile region';
	if (chipId.startsWith('tag:')) return 'Tag';
	if (chipId === 'department') return 'Department';
	if (chipId === 'program') return 'Program';
	if (chipId.startsWith('collar:')) return 'Collar';
	if (chipId === 'province') return 'Province';
	if (chipId === 'has_salary' || chipId === 'salary_range') return 'Salary';
	if (chipId === 'permanent') return 'Employment type';
	if (chipId === 'personalized') return 'Personalized';
	if (chipId === 'women' || chipId === 'transgender') return 'Audience';
	if (chipId === 'disability' || chipId === 'minority') return 'Quota';
	if (chipId === 'show_expired') return 'Include expired';
	if (chipId === 'sort') return 'Sort';
	return 'Other';
}

export function describeSearchLogFilters(filters: unknown): AdminSearchFilterChip[] {
	const params = searchLogFiltersToParams(filters);
	return activeFilterChips(params).map((chip) => ({
		id: chip.id,
		label: chip.label,
		category: filterChipCategory(chip.id)
	}));
}

export function searchLogKeyword(filters: unknown): string | null {
	const params = searchLogFiltersToParams(filters);
	return params.keyword?.trim() || params.q?.trim() || null;
}
