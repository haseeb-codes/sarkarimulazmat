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

function startOfTodayUtc(): Date {
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	return today;
}

export function daysSinceDate(value: string | Date | null | undefined): number | null {
	const dateKey = toDateKey(value);
	if (!dateKey) return null;
	const postedAt = new Date(`${dateKey}T00:00:00.000Z`);
	if (Number.isNaN(postedAt.getTime())) return null;
	const diffMs = startOfTodayUtc().getTime() - postedAt.getTime();
	return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isRecentAd(adDate: string | Date | null | undefined, withinDays = 2): boolean {
	const days = daysSinceDate(adDate);
	return days != null && days >= 0 && days <= withinDays;
}

export function isJobExpired(lastDate: string | Date | null | undefined): boolean {
	const dateKey = toDateKey(lastDate);
	if (!dateKey) return false;
	const today = startOfTodayUtc().toISOString().slice(0, 10);
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

export const GENDER_BROWSE_LINKS: { value: GenderKind; label: string }[] = [
	{ value: 'male', label: 'Male' },
	{ value: 'female', label: 'Female' },
	{ value: 'transgender', label: 'Transgender' }
];

/** Parse a `gender` query param into a known kind. */
export function parseGenderFilter(value: string | null | undefined): GenderKind | null {
	const key = value?.trim().toLowerCase();
	if (key === 'male' || key === 'm') return 'male';
	if (key === 'female' || key === 'f') return 'female';
	if (key === 'transgender' || key === 'trans') return 'transgender';
	return null;
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

/** Format salary integer with thousand separators, e.g. 50000 → "50,000". */
export function formatSalary(value: number | null | undefined): string | null {
	if (value == null || !Number.isFinite(value)) return null;
	return Math.round(value).toLocaleString('en-PK');
}

/** Link for clicking an eligibility badge — resets other filters, preserves sort. */
export function badgeFilterHref(
	value: string,
	sort?: JobSort,
	param:
		| 'degree_areas'
		| 'domicile'
		| 'place_of_posting'
		| 'education_level'
		| 'department' = 'degree_areas'
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
	ad_date?: string | null;
	posted_by?: string | null;
	donor_name?: string | null;
	gender?: GenderKind | null;
	qualification_level?: number | null;
	grade?: string | null;
	age?: number | null;
	place_of_posting?: string | null;
	domicile?: string | null;
	department?: string | null;
	collar?: string | null;
	province?: boolean | null;
	q?: string | null;
	/** Only jobs with a non-null salary */
	has_salary?: boolean;
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
	if (filters.ad_date) params.set('ad_date', filters.ad_date);
	if (filters.posted_by) params.set('posted_by', filters.posted_by);
	if (filters.donor_name) params.set('donor_name', filters.donor_name);
	if (filters.gender) params.set('gender', filters.gender);
	if (filters.qualification_level != null) {
		params.set('qualification_level', String(filters.qualification_level));
	}
	if (filters.grade) params.set('grade', filters.grade);
	if (filters.age != null) params.set('age', String(filters.age));
	if (filters.place_of_posting) params.set('place_of_posting', filters.place_of_posting);
	if (filters.domicile) params.set('domicile', filters.domicile);
	if (filters.department) params.set('department', filters.department);
	if (filters.collar) params.set('collar', filters.collar);
	if (filters.province != null) params.set('province', filters.province ? '1' : '0');
	if (filters.q) params.set('q', filters.q);
	if (filters.has_salary) params.set('has_salary', '1');
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

/** Public job detail path — jobs are addressed by slug, not row id. */
export function jobDetailHref(slug: string): string {
	return `/jobs/${encodeURIComponent(slug)}`;
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
