/** Shared job-display / URL helpers — safe for client and server. */

export type JobSort = 'newest' | 'closing_soon';

/** Split comma-delimited multi-value fields consistently. */
export function splitMultiValue(raw: string | null | undefined): string[] {
	if (!raw) return [];
	const seen = new Set<string>();
	const result: string[] = [];
	for (const part of raw.split(',')) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(trimmed);
	}
	return result;
}

export function isJobExpired(lastDate: string | null | undefined): boolean {
	if (!lastDate) return false;
	const today = new Date().toISOString().slice(0, 10);
	return lastDate < today;
}

export function isClosingSoon(lastDate: string | null | undefined, withinDays = 7): boolean {
	if (!lastDate || isJobExpired(lastDate)) return false;
	const today = new Date();
	const deadline = new Date(lastDate + 'T23:59:59');
	const diff = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
	return diff >= 0 && diff <= withinDays;
}

export function formatAgeRange(minAge: number | null, maxAge: number | null): string | null {
	if (minAge == null && maxAge == null) return null;
	if (minAge != null && maxAge != null) return `${minAge}–${maxAge} yrs`;
	if (minAge != null) return `${minAge}+ yrs`;
	return `Up to ${maxAge} yrs`;
}

/** Link for clicking an eligibility badge — resets other filters, preserves sort. */
export function badgeFilterHref(value: string, sort?: JobSort): string {
	const params = new URLSearchParams();
	params.set('degree_areas', value);
	if (sort && sort !== 'newest') params.set('sort', sort);
	const qs = params.toString();
	return qs ? `/?${qs}` : '/';
}

export type FilterParams = {
	degree_areas?: string[];
	education_level?: string | null;
	qualification_level?: number | null;
	grade?: string | null;
	age?: number | null;
	place_of_posting?: string | null;
	domicile?: string | null;
	department?: string | null;
	province?: string | null;
	q?: string | null;
	show_expired?: boolean;
	sort?: JobSort;
	page?: number;
};

export function filtersToSearchParams(filters: FilterParams): URLSearchParams {
	const params = new URLSearchParams();
	for (const area of filters.degree_areas ?? []) {
		params.append('degree_areas', area);
	}
	if (filters.education_level) params.set('education_level', filters.education_level);
	if (filters.qualification_level != null) {
		params.set('qualification_level', String(filters.qualification_level));
	}
	if (filters.grade) params.set('grade', filters.grade);
	if (filters.age != null) params.set('age', String(filters.age));
	if (filters.place_of_posting) params.set('place_of_posting', filters.place_of_posting);
	if (filters.domicile) params.set('domicile', filters.domicile);
	if (filters.department) params.set('department', filters.department);
	if (filters.province) params.set('province', filters.province);
	if (filters.q) params.set('q', filters.q);
	if (filters.show_expired) params.set('show_expired', '1');
	if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
	if (filters.page && filters.page > 1) params.set('page', String(filters.page));
	return params;
}

export function filtersToHref(filters: FilterParams): string {
	const qs = filtersToSearchParams(filters).toString();
	return qs ? `/?${qs}` : '/';
}

/** True when at least one primary eligibility filter is set (not keyword/location alone). */
export function eligibilityFiltersActive(filters: FilterParams): boolean {
	return Boolean(
		filters.degree_areas?.length ||
			filters.education_level ||
			filters.qualification_level != null ||
			filters.grade ||
			filters.age != null
	);
}

export function formatDateLabel(value: string | Date | null | undefined): string | null {
	if (!value) return null;
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	return value;
}
