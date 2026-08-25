/** Shared job-display / URL helpers — safe for client and server. */

import { selectedDomicileRegions } from '$lib/domicile-regions';

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

/** Calendar days from today until the deadline (0 = today). Null if missing/invalid. */
export function daysUntilDate(value: string | Date | null | undefined): number | null {
	const dateKey = toDateKey(value);
	if (!dateKey) return null;
	const deadline = new Date(`${dateKey}T00:00:00.000Z`);
	if (Number.isNaN(deadline.getTime())) return null;
	const diffMs = deadline.getTime() - startOfTodayUtc().getTime();
	return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isClosingSoon(lastDate: string | Date | null | undefined, withinDays = 7): boolean {
	const days = daysUntilDate(lastDate);
	return days != null && days >= 0 && days <= withinDays;
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
		| 'department'
		| 'program' = 'degree_areas'
): string {
	const params = new URLSearchParams();
	params.set(param, value);
	if (sort && sort !== 'newest') params.set('sort', sort);
	const qs = params.toString();
	return qs ? `/?${qs}` : '/';
}

/** Default bounds for the age range filter UI. */
export const AGE_FILTER_MIN = 16;
export const AGE_FILTER_MAX = 70;

/** Job max-age badge presets (Pakistan govt postings commonly cap at 30 / 45 / 60). */
export const AGE_MAX_PRESETS = [30, 45, 60] as const;
export type AgeMaxPreset = (typeof AGE_MAX_PRESETS)[number] | '60plus';

function bpsGradeCodes(from: number, to: number): string[] {
	const codes: string[] = [];
	for (let n = from; n <= to; n++) {
		codes.push(`BPS-${String(n).padStart(2, '0')}`);
	}
	return codes;
}

/** BPS grade filter groups shown in the drawer (URL `grade` = group key). */
export const BPS_GRADE_GROUPS = [
	{ key: 'bps-01-11', label: 'BPS 01 to 11', grades: bpsGradeCodes(1, 11) },
	{ key: 'bps-12-16', label: 'BPS 12 to 16', grades: bpsGradeCodes(12, 16) },
	{ key: 'bps-17', label: 'BPS 17', grades: bpsGradeCodes(17, 17) },
	{ key: 'bps-18-20', label: 'BPS 18 to 20', grades: bpsGradeCodes(18, 20) },
	{ key: 'bps-21-22', label: 'BPS 21 to 22', grades: bpsGradeCodes(21, 22) }
] as const;

export type BpsGradeGroupKey = (typeof BPS_GRADE_GROUPS)[number]['key'];

export function getBpsGradeGroup(value: string | null | undefined) {
	if (!value) return null;
	const key = value.trim().toLowerCase();
	return BPS_GRADE_GROUPS.find((group) => group.key === key) ?? null;
}

/** Map a URL/legacy grade value onto a BPS group key when possible. */
export function normalizeGradeFilter(value: string | null | undefined): string | null {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;

	const group = getBpsGradeGroup(trimmed);
	if (group) return group.key;

	const match = /^BPS-?(\d{1,2})$/i.exec(trimmed);
	if (match) {
		const code = `BPS-${String(Number(match[1])).padStart(2, '0')}`;
		const byGrade = BPS_GRADE_GROUPS.find((g) =>
			g.grades.some((grade) => grade.toLowerCase() === code.toLowerCase())
		);
		if (byGrade) return byGrade.key;
	}

	return trimmed;
}

/** Human label for a grade filter value (group key or raw grade). */
export function formatGradeFilter(value: string | null | undefined): string | null {
	if (!value) return null;
	return getBpsGradeGroup(value)?.label ?? value;
}

/** Expand a grade filter into `grade_derived` values to match. */
export function expandGradeFilter(value: string): string[] {
	const group = getBpsGradeGroup(value);
	if (group) return [...group.grades];
	return [value];
}

export type FilterParams = {
	degree_areas?: string[];
	education_level?: string | null;
	ad_date?: string | null;
	posted_by?: string | null;
	donor_name?: string | null;
	gender?: GenderKind | null;
	/**
	 * Selected qualification levels (URL: repeated `qualification`).
	 * Empty / omitted = all levels (no filter).
	 */
	qualification?: number[] | null;
	/** @deprecated Legacy single-sided filter — use `qualification` multi-select */
	qualification_level?: number | null;
	/** @deprecated Legacy range filter — use `qualification` multi-select */
	qualification_from?: number | null;
	/** @deprecated Legacy range filter — use `qualification` multi-select */
	qualification_to?: number | null;
	grade?: string | null;
	/** @deprecated Legacy single-age filter — use age_from / age_to */
	age?: number | null;
	age_from?: number | null;
	age_to?: number | null;
	/** Include postings that do not specify a maximum age (default true). */
	include_no_max_age?: boolean;
	/** Filter by the posting's listed maximum age: 30 / 45 / 60, or 60+. */
	age_max?: AgeMaxPreset | null;
	place_of_posting?: string | null;
	/** One or more domicile values (URL: repeated `domicile` params). */
	domicile?: string | string[] | null;
	/** Domicile region flags (URL: repeated `domicile_region` params). */
	domicile_region?: string | string[] | null;
	/** Job category tag slugs from /tags (URL: repeated `tag` params). */
	tag?: string | string[] | null;
	department?: string | null;
	collar?: string | null;
	province?: boolean | null;
	program?: string | null;
	/** Drawer keyword: title, department, project/program name. */
	keyword?: string | null;
	/** Global search (`q`): title, department, grades, donors, addresses, notes, etc. */
	q?: string | null;
	/** Only jobs with a non-null salary */
	has_salary?: boolean;
	/** Only permanent jobs (`employment_type` = Permanent). */
	permanent_only?: boolean;
	/** @deprecated Prefer salary_from */
	min_salary?: number | null;
	salary_from?: number | null;
	salary_to?: number | null;
	show_expired?: boolean;
	sort?: JobSort;
	page?: number;
	pageSize?: number;
};

export function clampAgeFilter(value: number): number {
	return Math.min(AGE_FILTER_MAX, Math.max(AGE_FILTER_MIN, Math.round(value)));
}

export function resolvedAgeFrom(filters: FilterParams): number {
	return clampAgeFilter(filters.age_from ?? filters.age ?? AGE_FILTER_MIN);
}

export function resolvedAgeTo(filters: FilterParams): number {
	return clampAgeFilter(filters.age_to ?? filters.age ?? AGE_FILTER_MAX);
}

/** True when any age filter is set (badge preset, slider, or legacy age). */
export function isAgeFilterActive(filters: FilterParams): boolean {
	if (filters.age_max != null) return true;
	const from = resolvedAgeFrom(filters);
	const to = resolvedAgeTo(filters);
	return (
		from > AGE_FILTER_MIN ||
		to < AGE_FILTER_MAX ||
		filters.include_no_max_age === false
	);
}

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
	if (isQualificationFilterActive(filters)) {
		for (const level of selectedQualificationLevels(filters)) {
			params.append('qualification', String(level));
		}
	}
	if (filters.grade) params.set('grade', filters.grade);
	if (filters.age_max === '60plus') {
		params.set('age_max', '60plus');
	} else if (filters.age_max != null) {
		params.set('age_max', String(filters.age_max));
	} else if (isAgeFilterActive(filters)) {
		params.set('age_from', String(resolvedAgeFrom(filters)));
		params.set('age_to', String(resolvedAgeTo(filters)));
		if (filters.include_no_max_age === false) params.set('include_no_max_age', '0');
	}
	if (filters.place_of_posting) params.set('place_of_posting', filters.place_of_posting);
	for (const domicile of selectedDomiciles(filters)) {
		params.append('domicile', domicile);
	}
	for (const region of selectedDomicileRegions(filters)) {
		params.append('domicile_region', region);
	}
	for (const tag of selectedTags(filters)) {
		params.append('tag', tag);
	}
	if (filters.department) params.set('department', filters.department);
	if (filters.collar) params.set('collar', filters.collar);
	if (filters.province != null) params.set('province', filters.province ? '1' : '0');
	if (filters.program) params.set('program', filters.program);
	if (filters.keyword) params.set('keyword', filters.keyword);
	if (filters.q) params.set('q', filters.q);
	if (isSalaryRangeActive(filters)) {
		const from = resolvedSalaryFrom(filters);
		const to = filters.salary_to;
		if (from > SALARY_FILTER_MIN) params.set('salary_from', String(from));
		if (to != null) params.set('salary_to', String(to));
	} else if (filters.has_salary) {
		params.set('has_salary', '1');
	}
	if (filters.permanent_only) params.set('permanent', '1');
	if (filters.show_expired) params.set('show_expired', '1');
	if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
	if (filters.page && filters.page > 1) params.set('page', String(filters.page));
	if (filters.pageSize && filters.pageSize !== 20) {
		params.set('pageSize', String(filters.pageSize));
	}
	return params;
}

export function filtersToHref(filters: FilterParams, path = '/'): string {
	const qs = filtersToSearchParams(filters).toString();
	return qs ? `${path}?${qs}` : path;
}

/** Public job detail path — jobs are addressed by slug, not row id. */
export function jobDetailHref(slug: string): string {
	return `/jobs/${encodeURIComponent(slug)}`;
}

/** Normalize domicile from a single value, comma list, or array. */
export function selectedDomiciles(filters: {
	domicile?: string | string[] | null;
}): string[] {
	const raw = filters.domicile;
	const parts = Array.isArray(raw) ? raw : raw ? splitMultiValue(raw) : [];
	const seen = new Set<string>();
	const result: string[] = [];
	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(trimmed);
	}
	return result;
}

/** Normalize tag slugs from a single value or array. */
export function selectedTags(filters: { tag?: string | string[] | null }): string[] {
	const raw = filters.tag;
	const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];
	const seen = new Set<string>();
	const result: string[] = [];
	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(trimmed);
	}
	return result;
}

/** Ordered qualification levels stored on job postings (0 = lowest). */
export const QUALIFICATION_LEVEL_MIN = 0;
export const QUALIFICATION_LEVEL_MAX = 7;

export const QUALIFICATION_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export const QUALIFICATION_LEVEL_LABELS: Record<number, string> = {
	0: 'Literate',
	1: 'Primary',
	2: 'Middle',
	3: 'Matric',
	4: 'Diploma',
	5: "Bachelor's",
	6: "Master's",
	7: 'PhD'
};

export function formatQualificationLevel(value: number): string {
	return QUALIFICATION_LEVEL_LABELS[value] ?? String(value);
}

function clampQualificationLevel(value: number): number | null {
	if (!Number.isFinite(value)) return null;
	const n = Math.round(value);
	if (n < QUALIFICATION_LEVEL_MIN || n > QUALIFICATION_LEVEL_MAX) return null;
	return n;
}

/** Normalize selected levels; empty means “all” (no filter). */
export function selectedQualificationLevels(filters: FilterParams): number[] {
	const raw = filters.qualification;
	if (Array.isArray(raw) && raw.length) {
		const seen = new Set<number>();
		const result: number[] = [];
		for (const part of raw) {
			const n = clampQualificationLevel(Number(part));
			if (n == null || seen.has(n)) continue;
			seen.add(n);
			result.push(n);
		}
		result.sort((a, b) => a - b);
		if (result.length === QUALIFICATION_LEVELS.length) return [];
		return result;
	}

	// Legacy range / single upper-bound → discrete levels
	const from = filters.qualification_from ?? QUALIFICATION_LEVEL_MIN;
	const to =
		filters.qualification_to ?? filters.qualification_level ?? QUALIFICATION_LEVEL_MAX;
	if (from > QUALIFICATION_LEVEL_MIN || to < QUALIFICATION_LEVEL_MAX) {
		const lo = Math.max(QUALIFICATION_LEVEL_MIN, from);
		const hi = Math.min(QUALIFICATION_LEVEL_MAX, to);
		return QUALIFICATION_LEVELS.filter((level) => level >= lo && level <= hi);
	}

	return [];
}

/** @deprecated Prefer selectedQualificationLevels */
export function resolvedQualificationFrom(filters: FilterParams): number {
	const levels = selectedQualificationLevels(filters);
	if (levels.length) return levels[0]!;
	return filters.qualification_from ?? QUALIFICATION_LEVEL_MIN;
}

/** @deprecated Prefer selectedQualificationLevels */
export function resolvedQualificationTo(filters: FilterParams): number {
	const levels = selectedQualificationLevels(filters);
	if (levels.length) return levels[levels.length - 1]!;
	if (filters.qualification_to != null) return filters.qualification_to;
	if (filters.qualification_level != null) return filters.qualification_level;
	return QUALIFICATION_LEVEL_MAX;
}

export function isQualificationFilterActive(filters: FilterParams): boolean {
	return selectedQualificationLevels(filters).length > 0;
}

export const SALARY_FILTER_MIN = 0;

export function resolvedSalaryFrom(filters: FilterParams): number {
	return filters.salary_from ?? filters.min_salary ?? SALARY_FILTER_MIN;
}

export function resolvedSalaryTo(filters: FilterParams, salaryMax: number): number {
	return filters.salary_to ?? salaryMax;
}

/** True when salary bounds differ from the full available range. */
export function isSalaryRangeActive(filters: FilterParams, salaryMax?: number): boolean {
	const from = resolvedSalaryFrom(filters);
	if (from > SALARY_FILTER_MIN) return true;
	return filters.salary_to != null && (salaryMax == null || filters.salary_to < salaryMax);
}

/** True when salary bounds differ from the full available range, or "listed only" is on. */
export function isSalaryFilterActive(filters: FilterParams, salaryMax?: number): boolean {
	return isSalaryRangeActive(filters, salaryMax) || Boolean(filters.has_salary);
}

/** Reset all drawer-managed filters while preserving sort and other page filters. */
export function clearDrawerFilterPatch(): Partial<FilterParams> {
	return {
		age: null,
		age_from: null,
		age_to: null,
		age_max: null,
		qualification: [],
		qualification_from: null,
		qualification_to: null,
		qualification_level: null,
		degree_areas: [],
		grade: null,
		domicile: [],
		domicile_region: [],
		tag: [],
		has_salary: false,
		permanent_only: false,
		min_salary: null,
		salary_from: null,
		salary_to: null,
		page: 1
	};
}

export function drawerFilterActiveCount(filters: FilterParams): number {
	return (
		(isAgeFilterActive(filters) ? 1 : 0) +
		(isQualificationFilterActive(filters) ? 1 : 0) +
		(filters.degree_areas?.length ? 1 : 0) +
		(filters.grade ? 1 : 0) +
		(selectedDomicileRegions(filters).length ? 1 : 0) +
		(filters.permanent_only ? 1 : 0)
	);
}

function parseDrawerIntParam(
	value: string | null,
	min = 0,
	max?: number
): number | null {
	if (!value) return null;
	const n = Number.parseInt(value, 10);
	if (!Number.isFinite(n) || n < min) return null;
	if (max != null && n > max) return null;
	return n;
}

function parseDrawerAgeMaxParam(value: string | null): AgeMaxPreset | null {
	if (!value) return null;
	const key = value.trim().toLowerCase();
	if (key === '60plus' || key === '60+') return '60plus';
	const n = Number.parseInt(value, 10);
	if (n === 30 || n === 45 || n === 60) return n;
	return null;
}

/** Parse drawer-managed filters from a URL — client-safe for optimistic UI during navigation. */
export function parseDrawerFiltersFromUrl(url: URL): Partial<FilterParams> {
	const params = url.searchParams;

	return {
		keyword: params.get('keyword')?.trim() || null,
		age_max: parseDrawerAgeMaxParam(params.get('age_max')),
		age_from: null,
		age_to: null,
		age: null,
		include_no_max_age: true,
		qualification: selectedQualificationLevels({
			qualification: params.getAll('qualification').map((v) => Number.parseInt(v, 10)),
			qualification_from: parseDrawerIntParam(
				params.get('qualification_from'),
				0,
				QUALIFICATION_LEVEL_MAX
			),
			qualification_to:
				parseDrawerIntParam(params.get('qualification_to'), 0, QUALIFICATION_LEVEL_MAX) ??
				parseDrawerIntParam(params.get('qualification_level'), 0, QUALIFICATION_LEVEL_MAX)
		}),
		qualification_from: null,
		qualification_to: null,
		qualification_level: null,
		degree_areas: params
			.getAll('degree_areas')
			.map((v) => v.trim())
			.filter(Boolean),
		grade: normalizeGradeFilter(params.get('grade')),
		domicile_region: selectedDomicileRegions({
			domicile_region: params.getAll('domicile_region')
		}),
		tag: selectedTags({ tag: params.getAll('tag') }),
		salary_from:
			parseDrawerIntParam(params.get('salary_from'), 1) ??
			parseDrawerIntParam(params.get('min_salary'), 1),
		salary_to: parseDrawerIntParam(params.get('salary_to'), 1),
		min_salary: null,
		has_salary: params.get('has_salary') === '1',
		permanent_only: params.get('permanent') === '1'
	};
}

/** Prefer in-flight navigation URL, else the current page URL, for drawer filter display. */
export function effectiveDrawerFilters(
	current: FilterParams,
	targetUrl: URL | undefined,
	pathname: string
): FilterParams {
	if (!targetUrl || targetUrl.pathname !== pathname) return current;
	return { ...current, ...parseDrawerFiltersFromUrl(targetUrl) };
}

export function formatSalaryFilter(value: number): string {
	return `Rs. ${formatSalary(value) ?? '0'}`;
}

export function eligibilityFiltersActive(filters: FilterParams): boolean {
	return Boolean(
		filters.degree_areas?.length ||
			filters.education_level ||
			isQualificationFilterActive(filters) ||
			filters.grade ||
			isAgeFilterActive(filters)
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

export type JobApplyLink = {
	href: string;
	label: string;
	kind: 'url' | 'email';
};

/**
 * Prefer `application_online_address` as an http(s) link; if that is empty, use `email`.
 */
export function getJobApplyLink(
	applicationOnlineAddress: string | null | undefined,
	email: string | null | undefined
): JobApplyLink | null {
	const online = applicationOnlineAddress?.trim();
	if (online && !/^(javascript|data|vbscript):/i.test(online)) {
		const href = /^https?:\/\//i.test(online) ? online : `https://${online}`;
		return { href, label: online, kind: 'url' };
	}

	const mail = email?.trim();
	if (mail) {
		return { href: `mailto:${mail}`, label: mail, kind: 'email' };
	}

	return null;
}
