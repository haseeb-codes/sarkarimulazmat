import {
	activeFilterChips,
	filtersToHref,
	repairDegreeAreasHtmlCorruption,
	type FilterParams
} from '$lib/jobs-utils';
import type { AdminSearchFilterChip, AdminSearchParam } from '$lib/admin-types';

function asString(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

/**
 * Recover tag + degree_areas when a tag value absorbed mangled `&degree_areas`
 * (stored as `tag°ree_areas=Area°ree_areas=Other`).
 */
function repairAbsorbedDegreeAreas(value: string): { head: string; degree_areas: string[] } {
	if (!value.includes('°ree_areas=')) {
		return { head: repairDegreeAreasHtmlCorruption(value), degree_areas: [] };
	}
	const parts = value.split('°ree_areas=');
	const head = (parts[0] ?? '').trim();
	const degree_areas = parts
		.slice(1)
		.map((part) => part.trim())
		.filter(Boolean);
	return { head, degree_areas };
}

/** Fix search-log filter JSON corrupted by HTML `&deg` → `°` entity decoding. */
export function repairSearchLogFilters(filters: unknown): unknown {
	if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
		return filters;
	}

	const record = { ...(filters as Record<string, unknown>) };
	const tags = asStringArray(record.tag);
	const existingDegrees = asStringArray(record.degree_areas);
	const repairedTags: string[] = [];
	const degree_areas = [...existingDegrees];

	for (const tag of tags) {
		const { head, degree_areas: extracted } = repairAbsorbedDegreeAreas(tag);
		if (head) repairedTags.push(head);
		for (const area of extracted) {
			if (!degree_areas.some((d) => d.toLowerCase() === area.toLowerCase())) {
				degree_areas.push(area);
			}
		}
	}

	const repairedDegrees = degree_areas.flatMap((area) => {
		if (!area.includes('°ree_areas')) return [area];
		const { head, degree_areas: extracted } = repairAbsorbedDegreeAreas(area);
		return [head, ...extracted].filter(Boolean);
	});

	record.tag = repairedTags;
	record.degree_areas = repairedDegrees;
	return record;
}

/** Safe clickable href for a logged search (repaired path / reconstructed filters). */
export function searchLogHref(path: string | null, filters: unknown): string | null {
	const pathname =
		path && path.startsWith('/') && !path.startsWith('//')
			? repairDegreeAreasHtmlCorruption(path).split('?')[0] || '/'
			: '/';
	const params = searchLogFiltersToParams(repairSearchLogFilters(filters));
	const fromFilters = filtersToHref(params, pathname);
	if (fromFilters !== pathname) return fromFilters;

	if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
	const repaired = repairDegreeAreasHtmlCorruption(path);
	return repaired;
}

/** Query params as key=value pairs for admin display (exactly as in the replay URL). */
export function searchLogParamEntries(path: string | null, filters: unknown): AdminSearchParam[] {
	const href = searchLogHref(path, filters);
	const filterParams = searchLogFiltersToParams(filters);
	const fromFilters = paramsFromFilterParams(filterParams);
	if (fromFilters.length) return fromFilters;

	if (!href || !href.includes('?')) return [];
	const qs = href.slice(href.indexOf('?') + 1);
	const params = new URLSearchParams(qs);
	const entries: AdminSearchParam[] = [];
	for (const [key, value] of params.entries()) {
		// Expand comma-joined multi-values for readable admin chips.
		if ((key === 'degree_areas' || key === 'domicile' || key === 'tag') && value.includes(',')) {
			for (const part of value.split(',').map((p) => p.trim()).filter(Boolean)) {
				entries.push({ key, value: part, label: `${key}=${part}` });
			}
			continue;
		}
		entries.push({ key, value, label: `${key}=${value}` });
	}
	return entries;
}

function appendParamEntries(
	entries: AdminSearchParam[],
	key: string,
	values: Array<string | number | boolean | null | undefined>
) {
	for (const value of values) {
		if (value == null || value === '') continue;
		const text = String(value);
		entries.push({ key, value: text, label: `${key}=${text}` });
	}
}

function paramsFromFilterParams(filters: FilterParams): AdminSearchParam[] {
	const entries: AdminSearchParam[] = [];
	appendParamEntries(entries, 'degree_areas', filters.degree_areas ?? []);
	appendParamEntries(entries, 'education_level', [filters.education_level]);
	appendParamEntries(entries, 'ad_date', [filters.ad_date]);
	appendParamEntries(entries, 'closing_on', [filters.closing_on]);
	appendParamEntries(entries, 'posted_by', [filters.posted_by]);
	appendParamEntries(entries, 'donor_name', [filters.donor_name]);
	appendParamEntries(entries, 'portal', [filters.portal]);
	appendParamEntries(entries, 'gender', [filters.gender]);
	appendParamEntries(entries, 'qualification', filters.qualification ?? []);
	appendParamEntries(entries, 'grade', [filters.grade]);
	appendParamEntries(entries, 'age', [filters.age]);
	appendParamEntries(entries, 'place_of_posting', [filters.place_of_posting]);
	appendParamEntries(entries, 'domicile', filters.domicile ?? []);
	appendParamEntries(entries, 'domicile_region', filters.domicile_region ?? []);
	appendParamEntries(entries, 'tag', filters.tag ?? []);
	appendParamEntries(entries, 'department', [filters.department]);
	appendParamEntries(entries, 'collar', filters.collar ?? []);
	if (filters.province != null) appendParamEntries(entries, 'province', [filters.province ? '1' : '0']);
	appendParamEntries(entries, 'program', [filters.program]);
	appendParamEntries(entries, 'keyword', [filters.keyword]);
	appendParamEntries(entries, 'q', [filters.q]);
	if (filters.has_salary) appendParamEntries(entries, 'has_salary', ['1']);
	if (filters.salary_from != null) appendParamEntries(entries, 'salary_from', [filters.salary_from]);
	if (filters.salary_to != null) appendParamEntries(entries, 'salary_to', [filters.salary_to]);
	if (filters.permanent_only) appendParamEntries(entries, 'permanent', ['1']);
	if (filters.personalized) appendParamEntries(entries, 'personalized', ['1']);
	if (filters.women_only) appendParamEntries(entries, 'women', ['1']);
	if (filters.transgender_applicable) appendParamEntries(entries, 'transgender', ['1']);
	if (filters.disability_quota) appendParamEntries(entries, 'disability', ['1']);
	if (filters.minority_quota) appendParamEntries(entries, 'minority', ['1']);
	if (filters.show_expired) appendParamEntries(entries, 'show_expired', ['1']);
	if (filters.sort && filters.sort !== 'newest') appendParamEntries(entries, 'sort', [filters.sort]);
	if (filters.page && filters.page > 1) appendParamEntries(entries, 'page', [filters.page]);
	return entries;
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
	const repaired = repairSearchLogFilters(filters);
	if (!repaired || typeof repaired !== 'object' || Array.isArray(repaired)) {
		return {};
	}

	const record = repaired as Record<string, unknown>;

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
