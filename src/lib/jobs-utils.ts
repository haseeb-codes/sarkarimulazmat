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

/** Normalize Date or YYYY-MM-DD string to a calendar date key. */
export function toDateKey(value: string | Date | null | undefined): string | null {
	if (!value) return null;
	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) return null;
		return value.toISOString().slice(0, 10);
	}
	const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
	return match ? match[1] : null;
}

export function isJobExpired(lastDate: string | Date | null | undefined): boolean {
	const dateKey = toDateKey(lastDate);
	if (!dateKey) return false;
	const today = new Date().toISOString().slice(0, 10);
	return dateKey < today;
}

export function isClosingSoon(lastDate: string | Date | null | undefined, withinDays = 7): boolean {
	const dateKey = toDateKey(lastDate);
	if (!dateKey || isJobExpired(dateKey)) return false;
	const today = new Date();
	const deadline = new Date(dateKey + 'T23:59:59');
	const diff = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
	return diff >= 0 && diff <= withinDays;
}

export type GenderKind = 'male' | 'female' | 'transgender';

/** Normalize raw gender field values into known kinds. */
export function parseGenderKinds(gender: string | null | undefined): GenderKind[] {
	const kinds = new Set<GenderKind>();
	for (const part of splitMultiValue(gender)) {
		const key = part.toLowerCase();
		if (key === 'male' || key === 'm') kinds.add('male');
		else if (key === 'female' || key === 'f') kinds.add('female');
		else if (key.includes('trans')) kinds.add('transgender');
	}
	return [...kinds];
}

/** True when the posting is open only to females and/or transgenders (no males). */
export function isWomenOrTransOnly(gender: string | null | undefined): boolean {
	const kinds = parseGenderKinds(gender);
	if (kinds.length === 0) return false;
	return !kinds.includes('male');
}

export function formatAgeRange(minAge: number | null, maxAge: number | null): string | null {
	if (minAge == null && maxAge == null) return null;
	if (minAge != null && maxAge != null) return `${minAge}–${maxAge} yrs`;
	if (minAge != null) return `${minAge}+ yrs`;
	return `Up to ${maxAge} yrs`;
}

/** Link for clicking an eligibility badge — resets other filters, preserves sort. */
export function badgeFilterHref(
	value: string,
	sort?: JobSort,
	param: 'degree_areas' | 'domicile' | 'place_of_posting' = 'degree_areas'
): string {
	const params = new URLSearchParams();
	params.set(param, value);
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
	pageSize?: number;
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
	if (filters.pageSize && filters.pageSize !== 20) {
		params.set('pageSize', String(filters.pageSize));
	}
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

/** Format YYYY-MM-DD (or Date) as dd-MMM-yyyy, e.g. 04-Aug-2026. */
export function formatDateLabel(value: string | Date | null | undefined): string | null {
	if (!value) return null;
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	] as const;

	let year: number;
	let monthIndex: number;
	let day: number;

	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) return null;
		year = value.getUTCFullYear();
		monthIndex = value.getUTCMonth();
		day = value.getUTCDate();
	} else {
		const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
		if (!match) return value;
		year = Number(match[1]);
		monthIndex = Number(match[2]) - 1;
		day = Number(match[3]);
		if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return value;
	}

	return `${String(day).padStart(2, '0')}-${months[monthIndex]}-${year}`;
}

const AD_IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const AD_PDF_EXT = /\.pdf$/i;

/** Public ad URL from `supabase_file_path` (jpg/png/webp/gif/pdf). */
export function getJobAdUrl(supabaseFilePath: string | null | undefined): string | null {
	const trimmed = supabaseFilePath?.trim();
	return trimmed || null;
}

export function getJobAdKind(
	supabaseFilePath: string | null | undefined
): 'image' | 'pdf' | 'other' | null {
	const url = getJobAdUrl(supabaseFilePath);
	if (!url) return null;
	if (AD_IMAGE_EXT.test(url)) return 'image';
	if (AD_PDF_EXT.test(url)) return 'pdf';
	return 'other';
}

/** @deprecated Prefer getJobAdUrl */
export function getJobAdImageUrl(supabaseFilePath: string | null | undefined): string | null {
	return getJobAdUrl(supabaseFilePath);
}
