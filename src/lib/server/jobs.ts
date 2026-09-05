import type { Prisma } from '$lib/server/generated/prisma/client';
import db from '$lib/server/db';
import { logSearch } from '$lib/server/search-log';
import type { JobQueryTracking } from '$lib/server/request-context';
import { getJobCategoryPage, getJobCategoryTags } from '$lib/job-category-pages';
import { getDomicileRegion, selectedDomicileRegions } from '$lib/domicile-regions';
import { countJobCategoryJobs, buildJobCategoryTagWhere } from '$lib/server/job-category-jobs';
import { DEGREE_SPECIALIZATIONS } from '$lib/degree-specializations';
import { PORTAL_OPTIONS } from '$lib/filter-static-options';
import {
	splitMultiValue,
	toDateKey,
	formatDateLabel,
	parseGenderFilter,
	GENDER_BROWSE_LINKS,
	isAgeFilterActive,
	isQualificationFilterActive,
	isCollarFilterActive,
	selectedQualificationLevels,
	selectedCollars,
	clampAgeFilter,
	selectedDomiciles,
	selectedTags,
	type JobSort,
	type FilterParams,
	type GenderKind,
	type AgeMaxPreset,
	expandGradeFilter,
	normalizeGradeFilter
} from '$lib/jobs-utils';

export type { JobSort };
export { splitMultiValue } from '$lib/jobs-utils';

export type JobFilters = FilterParams & {
	degree_areas: string[];
	education_level: string | null;
	ad_date: string | null;
	/** Exact match on `last_date_to_apply` (YYYY-MM-DD). */
	closing_on: string | null;
	posted_by: string | null;
	donor_name: string | null;
	portal: string | null;
	gender: GenderKind | null;
	qualification: number[];
	qualification_from: number | null;
	qualification_to: number | null;
	grade: string | null;
	/** @deprecated Legacy single-age filter */
	age: number | null;
	age_from: number | null;
	age_to: number | null;
	include_no_max_age: boolean;
	age_max: AgeMaxPreset | null;
	place_of_posting: string | null;
	domicile: string[];
	domicile_region: string[];
	tag: string[];
	department: string | null;
	/** Included White / Blue / Grey collar levels; empty = all. */
	collar: string[];
	/** Provincial posting flag (DB column is boolean). */
	province: boolean | null;
	/** Filter by project/program name */
	program: string | null;
	keyword: string | null;
	q: string | null;
	/** Only include postings that have a non-null `salary` column value */
	has_salary: boolean;
	/** Only permanent jobs (`employment_type` = Permanent). */
	permanent_only: boolean;
	/** Only women-eligible jobs (`gender` contains “Female”). */
	women_only: boolean;
	/** Only transgender-applicable jobs (`gender` contains “Transgender”). */
	transgender_applicable: boolean;
	/** Only jobs with disability quota (`disability_quota` = true). */
	disability_quota: boolean;
	/** Only jobs with minority quota (`minority_quota` = true). */
	minority_quota: boolean;
	/** @deprecated Prefer salary_from */
	min_salary: number | null;
	salary_from: number | null;
	salary_to: number | null;
	/**
	 * Include expired/inactive jobs.
	 * Off (default): `is_active = 1` and non-past deadlines.
	 * On: all `is_active` values and past deadlines.
	 */
	show_expired: boolean;
	sort: JobSort;
	page: number;
	pageSize: number;
};

export type FilterOptions = {
	degree_areas: string[];
	degrees: string[];
	/** Curated specialization labels from `src/lib/data/degree-specializations.json`. */
	specializations: string[];
	education_levels: string[];
	grades: string[];
	places: string[];
	domiciles: string[];
	portals: string[];
	salary_max: number;
};

export type BrowseEducationLink = {
	label: string;
	count: number;
};

export type BrowseAdDateLink = {
	value: string;
	label: string;
	count: number;
};

export type BrowsePostedByLink = {
	label: string;
	count: number;
};

export type BrowseDonorLink = {
	label: string;
	count: number;
};

export type BrowseGenderLink = {
	value: GenderKind;
	label: string;
	count: number;
};

export type BrowseDegreeAreaLink = {
	label: string;
	count: number;
};

export type BrowseJobInterestLeaf = {
	label: string;
	count: number;
	degree_areas?: string[];
	education_level?: string;
	q?: string;
};

export type BrowseJobInterestBranch = {
	label: string;
	count: number;
	children: BrowseJobInterestLeaf[];
};

export type BrowseByCategoryData = {
	adDates: BrowseAdDateLink[];
	postedBy: BrowsePostedByLink[];
	donors: BrowseDonorLink[];
	genders: BrowseGenderLink[];
	degreeAreas: BrowseDegreeAreaLink[];
	educationLevels: BrowseEducationLink[];
	jobInterestTree: BrowseJobInterestBranch[];
	topTags: { slug: string; label: string; count: number }[];
};

export type PortalJobCount = {
	label: string;
	count: number;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const FILTER_OPTIONS_TTL_MS = 5 * 60 * 1000;
const FILTER_OPTIONS_CAP = 50;
const BROWSE_COUNTS_TTL_MS = 5 * 60 * 1000;
/** Short TTL for the default (unfiltered) homepage job list — speeds cold first visits after warm. */
const DEFAULT_LIST_JOBS_TTL_MS = 60 * 1000;

import { toListJobs, type ListJob } from '$lib/server/job-list-dto';

type ListJobsResult = {
	jobs: ListJob[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

let defaultListJobsCache: { key: string; data: ListJobsResult; expiresAt: number } | null = null;
const defaultListJobsInflight = new Map<string, Promise<ListJobsResult>>();

/** Cache key for default browse (no user filters). Null when filters are active. */
function defaultListJobsCacheKey(filters: JobFilters): string | null {
	if (filtersAreActive(filters)) return null;
	return `page=${filters.page}|pageSize=${filters.pageSize}|sort=${filters.sort}`;
}

const JOB_INTEREST_TAXONOMY: {
	label: string;
	children: { label: string; degree_areas?: string[]; education_level?: string; q?: string }[];
}[] = [
	{
		label: 'Engineering',
		children: [
			{ label: 'Mechanical', degree_areas: ['Mechanical'] },
			{ label: 'Electrical', degree_areas: ['Electrical'] },
			{ label: 'Civil', degree_areas: ['Civil'] },
			{ label: 'Chemical', degree_areas: ['Chemical'] },
			{ label: 'Electronics', degree_areas: ['Electronics'] },
			{ label: 'Metallurgy', degree_areas: ['Metallurgy'] },
			{ label: 'Mechatronics', degree_areas: ['Mechatronics'] },
			{ label: 'Architecture', degree_areas: ['Architecture'] },
			{ label: 'Transportation', degree_areas: ['Transportation'] }
		]
	},
	{
		label: 'Medical & Allied Health',
		children: [
			{ label: 'MBBS', degree_areas: ['MBBS'] },
			{ label: 'FCPS', degree_areas: ['FCPS'] },
			{ label: 'MCPS', degree_areas: ['MCPS'] },
			{ label: 'Nursing', degree_areas: ['Nursing'] },
			{ label: 'Pharmacist', degree_areas: ['Pharmacy', 'Pharm-D', 'Pharm D', 'Pharmacist'] },
			{ label: 'BDS', degree_areas: ['BDS'] },
			{ label: 'DPT', degree_areas: ['DPT'] },
			{ label: 'Anesthesia', degree_areas: ['Anesthesia'] },
			{ label: 'Radiology', degree_areas: ['Radiology'] },
			{ label: 'Medical Lab Technology', degree_areas: ['Medical Lab Technology'] },
			{ label: 'Physiotherapy', degree_areas: ['Physiotherapy'] },
			{
				label: 'Critical Care',
				degree_areas: ['Adult Intensive Care', 'Pediatric Intensive Care', 'Critical Care Medicine']
			},
			{ label: 'Psychiatry', degree_areas: ['Psychiatry'] },
			{ label: 'Pulmonology', degree_areas: ['Pulmonology'] },
			{ label: 'Nephrology', degree_areas: ['Nephrology'] }
		]
	},
	{
		label: 'Education & Teaching',
		children: [
			{ label: 'B.Ed', degree_areas: ['B.Ed'] },
			{ label: 'M.Ed', degree_areas: ['M.Ed'] },
			{ label: 'Education', degree_areas: ['Education'] },
			{ label: 'Physical Education', degree_areas: ['Physical Education'] },
			{ label: 'Teacher', q: 'teacher' },
			{ label: 'Lecturer', q: 'lecturer' },
			{ label: 'Professor', q: 'professor' },
			{ label: 'Instructor', q: 'instructor' },
			{ label: 'Principal', q: 'principal' }
		]
	},
	{
		label: 'Accounting & Finance',
		children: [
			{ label: 'ACCA', degree_areas: ['ACCA'] },
			{ label: 'CA', degree_areas: ['CA'] },
			{ label: 'ACMA', degree_areas: ['ACMA', 'ICMA'] },
			{ label: 'FCMA', degree_areas: ['FCMA'] },
			{ label: 'CFA', degree_areas: ['CFA'] },
			{ label: 'B.Com', degree_areas: ['B.Com'] },
			{ label: 'M.Com', degree_areas: ['M.Com'] },
			{ label: 'Accounts', degree_areas: ['Accounts'] }
		]
	},
	{
		label: 'Management & Administration',
		children: [
			{ label: 'MBA', degree_areas: ['MBA'] },
			{ label: 'BBA', degree_areas: ['BBA'] },
			{ label: 'Business Administration', degree_areas: ['Business Administration'] },
			{ label: 'Public Administration', degree_areas: ['Public Administration'] },
			{ label: 'MPA', degree_areas: ['MPA'] },
			{ label: 'Project Management', degree_areas: ['Project Management'] },
			{ label: 'Economics', degree_areas: ['Economics'] },
			{ label: 'Human Resources', degree_areas: ['Human Resources', 'HR'] },
			{ label: 'Supply Chain', degree_areas: ['Supply Chain'] },
			{ label: 'Public Policy', degree_areas: ['Public Policy'] }
		]
	},
	{
		label: 'Information Technology',
		children: [
			{ label: 'Computer Science', degree_areas: ['Computer Science', 'Computer'] },
			{ label: 'Artificial Intelligence', degree_areas: ['Artificial Intelligence'] },
			{ label: 'Data Science', degree_areas: ['Data Science'] },
			{ label: 'IT', degree_areas: ['IT', 'Information Technology'] },
			{ label: 'BSCS / BCS', degree_areas: ['BSCS', 'BCS'] },
			{ label: 'BSIT / BSSE', degree_areas: ['BSIT', 'BSSE'] },
			{ label: 'B.Tech', degree_areas: ['B.Tech'] },
			{ label: 'Cyber Security', degree_areas: ['Cyber Security', 'Cybersecurity'] },
			{ label: 'Information Systems', degree_areas: ['Information Systems'] },
			{ label: 'Networking', degree_areas: ['Networking'] },
			{ label: 'Web Development', degree_areas: ['Web Development'] },
			{ label: 'Software Engineer', q: 'software engineer' }
		]
	},
	{
		label: 'Technical & Skilled',
		children: [
			{ label: 'Diploma (DAE)', education_level: 'Diploma' },
			{ label: 'Matric', degree_areas: ['Matric'] },
			{ label: 'Technician', q: 'technician' },
			{ label: 'Fitter', q: 'fitter' },
			{ label: 'Operator', q: 'operator' },
			{ label: 'Driver', q: 'driver' },
			{ label: 'Security', q: 'security' }
		]
	},
	{
		label: 'Government & Executive',
		children: [
			{ label: 'Officer', q: 'officer' },
			{ label: 'Director', q: 'director' },
			{ label: 'Manager', q: 'manager' },
			{ label: 'Deputy', q: 'deputy' },
			{ label: 'Supervisor', q: 'supervisor' }
		]
	},
	{
		label: 'Law & Legal',
		children: [
			{ label: 'LLB', degree_areas: ['LLB'] },
			{ label: 'LLM', degree_areas: ['LLM'] },
			{ label: 'Law', degree_areas: ['Law'] },
			{ label: 'Legal Advisor', q: 'legal advisor' }
		]
	},
	{
		label: 'Social Sciences & Humanities',
		children: [
			{ label: 'Political Science', degree_areas: ['Political Science'] },
			{ label: 'International Relations', degree_areas: ['International Relations'] },
			{ label: 'Psychology', degree_areas: ['Psychology'] },
			{ label: 'Sociology', degree_areas: ['Sociology'] },
			{ label: 'Statistics', degree_areas: ['Statistics'] },
			{ label: 'Mass Communication', degree_areas: ['Mass Communication'] },
			{ label: 'English', degree_areas: ['English'] },
			{ label: 'Urdu', degree_areas: ['Urdu'] },
			{ label: 'Islamic Studies', degree_areas: ['Islamic Studies'] },
			{ label: 'Social Sciences', degree_areas: ['Social Sciences'] }
		]
	},
	{
		label: 'Natural Sciences',
		children: [
			{ label: 'Physics', degree_areas: ['Physics'] },
			{ label: 'Chemistry', degree_areas: ['Chemistry'] },
			{ label: 'Mathematics', degree_areas: ['Mathematics'] },
			{ label: 'Biology', degree_areas: ['Biology', 'Molecular Biology'] },
			{ label: 'Biotechnology', degree_areas: ['Biotechnology'] },
			{ label: 'Environmental Science', degree_areas: ['Environmental Science', 'Environmental Sciences'] },
			{ label: 'Bio-Medical', degree_areas: ['Bio-Medical'] }
		]
	},
	{
		label: 'Agriculture & Veterinary',
		children: [
			{ label: 'Agriculture', degree_areas: ['Agriculture'] },
			{ label: 'Agronomy', degree_areas: ['Agronomy'] },
			{ label: 'Horticulture', degree_areas: ['Horticulture'] },
			{ label: 'Forestry', degree_areas: ['Forestry'] },
			{ label: 'Veterinary', degree_areas: ['Veterinary'] }
		]
	},
	{
		label: 'Clerical & Office',
		children: [
			{ label: 'Clerk', q: 'clerk' },
			{ label: 'Naib Qasid', q: 'naib qasid' },
			{ label: 'Stenographer', q: 'stenographer' },
			{ label: 'Data Entry', q: 'data entry' },
			{ label: 'Office Assistant', q: 'office assistant' },
			{ label: 'Admin', q: 'admin' },
			{ label: 'Assistant', q: 'assistant' }
		]
	},
	{
		label: 'Research & Academia',
		children: [
			{ label: 'Research', q: 'research' },
			{ label: 'Assistant Professor', q: 'assistant professor' },
			{ label: 'Associate Professor', q: 'associate professor' },
			{ label: 'Research Fellow', q: 'fellow' }
		]
	}
];

/** Text columns searched by the drawer keyword filter. */
const PRIMARY_KEYWORD_FIELDS = [
	'title',
	'department',
	'project_program_name'
] as const satisfies readonly (keyof Prisma.JobPostingsWhereInput)[];

/** Text columns searched by the global `q` keyword (partial substring, case-insensitive). */
const SEARCHABLE_TEXT_FIELDS = [
	'title',
	'department',
	'project_program_name',
	'posted_by',
	'employment_type',
	'grade',
	'degrees',
	'degree_area',
	'donor_name',
	'gender',
	'application_online_address',
	'application_postal_address',
	'notes'
] as const satisfies readonly (keyof Prisma.JobPostingsWhereInput)[];

let filterOptionsCache: { data: FilterOptions; expiresAt: number } | null = null;
let closingOnDatesCache: { data: string[]; expiresAt: number } | null = null;
let browseCountsCache: { data: BrowseByCategoryData; expiresAt: number } | null = null;
let portalCountsCache: { data: PortalJobCount[]; expiresAt: number } | null = null;

function parsePositiveInt(value: string | null, fallback: number, max?: number): number {
	if (!value) return fallback;
	const n = Number.parseInt(value, 10);
	if (!Number.isFinite(n) || n < 1) return fallback;
	if (max !== undefined && n > max) return max;
	return n;
}

function parseOptionalPositiveInt(value: string | null): number | null {
	if (!value) return null;
	const n = Number.parseInt(value, 10);
	if (!Number.isFinite(n) || n < 1) return null;
	return n;
}

function parseOptionalQualificationLevel(value: string | null): number | null {
	if (!value) return null;
	const n = Number.parseInt(value, 10);
	if (!Number.isFinite(n) || n < 0 || n > 7) return null;
	return n;
}

function parseOptionalBoolean(value: string | null): boolean | null {
	if (!value) return null;
	const key = value.trim().toLowerCase();
	if (key === '1' || key === 'true' || key === 'yes') return true;
	if (key === '0' || key === 'false' || key === 'no') return false;
	return null;
}

function firstParam(url: URL, key: string): string | null {
	const v = url.searchParams.get(key)?.trim();
	return v ? v : null;
}

/** Collect multi-value params from repeated keys and/or comma-separated entries. */
function parseMultiParam(url: URL, key: string): string[] {
	const all = url.searchParams.getAll(key);
	const parts: string[] = [];
	for (const entry of all) {
		parts.push(...splitMultiValue(entry));
	}
	return selectedDomiciles({ domicile: parts });
}

/** Collect multi-value degree_areas from repeated params and/or a single comma-separated param. */
function parseDegreeAreas(url: URL): string[] {
	return parseMultiParam(url, 'degree_areas');
}

function parseUserAge(url: URL): number | null {
	const value = parseOptionalPositiveInt(firstParam(url, 'age'));
	return value != null ? clampAgeFilter(value) : null;
}

function parseQualificationFrom(url: URL): number | null {
	return parseOptionalQualificationLevel(firstParam(url, 'qualification_from'));
}

function parseQualificationTo(url: URL): number | null {
	const toParam = parseOptionalQualificationLevel(firstParam(url, 'qualification_to'));
	if (toParam != null) return toParam;
	return parseOptionalQualificationLevel(firstParam(url, 'qualification_level'));
}

function parseQualificationLevels(url: URL): number[] {
	const fromParams = url.searchParams
		.getAll('qualification')
		.map((v) => parseOptionalQualificationLevel(v))
		.filter((n): n is number => n != null);

	return selectedQualificationLevels({
		qualification: fromParams,
		qualification_from: parseQualificationFrom(url),
		qualification_to: parseQualificationTo(url)
	});
}

export function parseJobFilters(url: URL): JobFilters {
	const sortParam = firstParam(url, 'sort');
	const sort: JobSort = sortParam === 'closing_soon' ? 'closing_soon' : 'newest';
	const userAge = parseUserAge(url);

	return {
		degree_areas: parseDegreeAreas(url),
		education_level: firstParam(url, 'education_level'),
		ad_date: toDateKey(firstParam(url, 'ad_date')),
		closing_on: toDateKey(firstParam(url, 'closing_on')),
		posted_by: firstParam(url, 'posted_by'),
		donor_name: firstParam(url, 'donor_name'),
		portal: firstParam(url, 'portal'),
		gender: parseGenderFilter(firstParam(url, 'gender')),
		qualification: parseQualificationLevels(url),
		qualification_from: parseQualificationFrom(url),
		qualification_to: parseQualificationTo(url),
		grade: normalizeGradeFilter(firstParam(url, 'grade')),
		age: userAge,
		age_from: null,
		age_to: null,
		include_no_max_age: true,
		age_max: null,
		place_of_posting: firstParam(url, 'place_of_posting'),
		domicile: parseMultiParam(url, 'domicile'),
		domicile_region: selectedDomicileRegions({
			domicile_region: url.searchParams.getAll('domicile_region')
		}),
		tag: selectedTags({ tag: url.searchParams.getAll('tag') }),
		department: firstParam(url, 'department'),
		collar: selectedCollars({ collar: url.searchParams.getAll('collar') }),
		province: parseOptionalBoolean(firstParam(url, 'province')),
		program: firstParam(url, 'program'),
		keyword: firstParam(url, 'keyword'),
		q: firstParam(url, 'q'),
		has_salary: url.searchParams.get('has_salary') === '1',
		permanent_only: url.searchParams.get('permanent') === '1',
		women_only: url.searchParams.get('women') === '1',
		transgender_applicable: url.searchParams.get('transgender') === '1',
		disability_quota: url.searchParams.get('disability') === '1',
		minority_quota: url.searchParams.get('minority') === '1',
		min_salary: parseOptionalPositiveInt(firstParam(url, 'min_salary')),
		salary_from:
			parseOptionalPositiveInt(firstParam(url, 'salary_from')) ??
			parseOptionalPositiveInt(firstParam(url, 'min_salary')),
		salary_to: parseOptionalPositiveInt(firstParam(url, 'salary_to')),
		show_expired: url.searchParams.get('show_expired') === '1',
		sort,
		page: parsePositiveInt(firstParam(url, 'page'), 1),
		pageSize: parsePositiveInt(firstParam(url, 'pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
	};
}

export function filtersAreActive(filters: JobFilters): boolean {
	return Boolean(
		filters.degree_areas.length ||
			filters.education_level ||
			filters.ad_date ||
			filters.closing_on ||
			filters.posted_by ||
			filters.donor_name ||
			filters.portal ||
			filters.gender ||
			isQualificationFilterActive(filters) ||
			filters.grade ||
			isAgeFilterActive(filters) ||
			filters.place_of_posting ||
			filters.domicile.length ||
			filters.domicile_region.length ||
			filters.tag.length ||
			filters.department ||
			isCollarFilterActive(filters) ||
			filters.province != null ||
			filters.keyword ||
			filters.q ||
			filters.has_salary ||
			filters.permanent_only ||
			filters.women_only ||
			filters.transgender_applicable ||
			filters.disability_quota ||
			filters.minority_quota ||
			filters.min_salary != null ||
			filters.salary_from != null ||
			filters.salary_to != null ||
			filters.show_expired
	);
}

type KeywordField =
	| (typeof SEARCHABLE_TEXT_FIELDS)[number]
	| (typeof PRIMARY_KEYWORD_FIELDS)[number];

function partialMatchInField(field: KeywordField, term: string): Prisma.JobPostingsWhereInput {
	return { [field]: { contains: term, mode: 'insensitive' as const } };
}

function buildKeywordWhereForFields(
	fields: readonly KeywordField[],
	q: string
): Prisma.JobPostingsWhereInput {
	const phrase = q.trim();
	if (!phrase) return { OR: [] };

	const or: Prisma.JobPostingsWhereInput[] = [
		{
			OR: fields.map((field) => partialMatchInField(field, phrase))
		}
	];

	const tokens = phrase
		.split(/\s+/)
		.map((token) => token.trim())
		.filter(Boolean);
	if (tokens.length > 1) {
		or.push({
			OR: fields.map((field) => ({
				AND: tokens.map((token) => partialMatchInField(field, token))
			})) as Prisma.JobPostingsWhereInput[]
		});
	}

	return { OR: or };
}

/** Match when the query appears as a contiguous substring in any searchable column. */
function partialPhraseInAnyField(phrase: string): Prisma.JobPostingsWhereInput {
	return {
		OR: SEARCHABLE_TEXT_FIELDS.map((field) => partialMatchInField(field, phrase))
	};
}

/**
 * Multi-word fallback: every token must partially match within the same column
 * (avoids cross-field token pairing that made results too broad).
 */
function partialTokensInSameField(phrase: string): Prisma.JobPostingsWhereInput | null {
	const tokens = phrase
		.split(/\s+/)
		.map((token) => token.trim())
		.filter(Boolean);
	if (tokens.length <= 1) return null;

	return {
		OR: SEARCHABLE_TEXT_FIELDS.map((field) => ({
			AND: tokens.map((token) => partialMatchInField(field, token))
		})) as Prisma.JobPostingsWhereInput[]
	};
}

function buildKeywordWhere(q: string): Prisma.JobPostingsWhereInput {
	const phrase = q.trim();
	if (!phrase) return { OR: [] };

	const or: Prisma.JobPostingsWhereInput[] = [partialPhraseInAnyField(phrase)];
	const sameField = partialTokensInSameField(phrase);
	if (sameField) or.push(sameField);

	return { OR: or };
}

/** Match a gender kind without treating "female" as "male". */
function genderMatchWhere(kind: GenderKind): Prisma.JobPostingsWhereInput {
	if (kind === 'male') {
		return {
			OR: [
				{ gender: { equals: 'male', mode: 'insensitive' } },
				{ gender: { equals: 'm', mode: 'insensitive' } },
				{ gender: { startsWith: 'male,', mode: 'insensitive' } },
				{ gender: { contains: ', male', mode: 'insensitive' } },
				{ gender: { contains: ',male', mode: 'insensitive' } }
			]
		};
	}
	if (kind === 'female') {
		return {
			OR: [
				{ gender: { contains: 'female', mode: 'insensitive' } },
				{ gender: { equals: 'f', mode: 'insensitive' } },
				{ gender: { startsWith: 'f,', mode: 'insensitive' } },
				{ gender: { contains: ', f', mode: 'insensitive' } }
			]
		};
	}
	return { gender: { contains: 'trans', mode: 'insensitive' } };
}

/** Only postings marked active in source data (`is_active = 1`). */
export const IS_ACTIVE_JOB: Prisma.JobPostingsWhereInput = { is_active: 1 };

export function buildJobWhere(filters: JobFilters): Prisma.JobPostingsWhereInput {
	const and: Prisma.JobPostingsWhereInput[] = [];

	// Active-only unless "Include Expired Job" is on (`show_expired`).
	if (!filters.show_expired) {
		and.push(IS_ACTIVE_JOB);
	}
	and.push({ row_id: { not: null } });

	// Specialization / degrees — comma-delimited strings; match any selected value
	if (filters.degree_areas.length) {
		const degreeOr: Prisma.JobPostingsWhereInput[] = [];
		for (const area of filters.degree_areas) {
			degreeOr.push(
				{ degree_area: { contains: area, mode: 'insensitive' } },
				{ degrees: { contains: area, mode: 'insensitive' } }
			);
		}
		and.push({ OR: degreeOr });
	}

	// Education level — free-text with casing variance; contains is more reliable than exact
	if (filters.education_level) {
		and.push({
			education_level: { contains: filters.education_level, mode: 'insensitive' }
		});
	}

	if (isQualificationFilterActive(filters)) {
		and.push({
			qualification_level: { in: selectedQualificationLevels(filters) }
		});
	}

	if (filters.ad_date) {
		and.push({ ad_date: new Date(`${filters.ad_date}T00:00:00.000Z`) });
	}

	if (filters.closing_on) {
		and.push({ last_date_to_apply: new Date(`${filters.closing_on}T00:00:00.000Z`) });
	}

	if (filters.posted_by) {
		and.push({ posted_by: { equals: filters.posted_by, mode: 'insensitive' } });
	}

	if (filters.donor_name) {
		and.push({ donor_name: { equals: filters.donor_name, mode: 'insensitive' } });
	}

	if (filters.portal) {
		and.push({ url_web_title: { contains: filters.portal, mode: 'insensitive' } });
	}

	if (filters.gender) {
		and.push(genderMatchWhere(filters.gender));
	}

	// Grade — group keys expand to several grade_derived values; single values match exactly
	if (filters.grade) {
		const grades = expandGradeFilter(filters.grade);
		and.push(
			grades.length === 1
				? {
						OR: [
							{ grade_derived: { equals: grades[0], mode: 'insensitive' } },
							{ grade: { equals: grades[0], mode: 'insensitive' } }
						]
					}
				: { grade_derived: { in: grades } }
		);
	}

	// Age: show jobs with no age limit, or where the user meets min/max requirements.
	if (filters.age != null) {
		const userAge = clampAgeFilter(filters.age);
		and.push({
			OR: [
				{ AND: [{ min_age: null }, { max_age: null }] },
				{
					AND: [
						{ OR: [{ min_age: null }, { min_age: { lte: userAge } }] },
						{ OR: [{ max_age: null }, { max_age: { gte: userAge } }] }
					]
				}
			]
		});
	}

	if (filters.place_of_posting) {
		and.push({
			place_of_posting: { contains: filters.place_of_posting, mode: 'insensitive' }
		});
	}

	if (filters.domicile.length) {
		and.push({
			OR: filters.domicile.map((value) => ({
				domicile: { contains: value, mode: 'insensitive' as const }
			}))
		});
	}

	if (filters.domicile_region.length) {
		const regionOr: Prisma.JobPostingsWhereInput[] = [];
		for (const key of filters.domicile_region) {
			const region = getDomicileRegion(key);
			if (region) regionOr.push({ [region.column]: 1 });
		}
		if (regionOr.length) and.push({ OR: regionOr });
	}

	if (filters.tag.length) {
		const tagOr: Prisma.JobPostingsWhereInput[] = [];
		for (const slug of filters.tag) {
			const category = getJobCategoryPage(slug);
			if (category) {
				tagOr.push(buildJobCategoryTagWhere(category));
			}
		}
		if (tagOr.length) and.push({ OR: tagOr });
	}

	if (filters.department) {
		and.push({ department: { equals: filters.department, mode: 'insensitive' } });
	}

	if (filters.program) {
		and.push({
			project_program_name: { contains: filters.program, mode: 'insensitive' }
		});
	}

	if (isCollarFilterActive(filters)) {
		const collars = selectedCollars(filters);
		and.push({
			OR: collars.map((level) => ({
				collar: { equals: level, mode: 'insensitive' as const }
			}))
		});
	}

	if (filters.province != null) {
		and.push({ province: filters.province });
	}

	if (filters.keyword) {
		and.push(buildKeywordWhereForFields(PRIMARY_KEYWORD_FIELDS, filters.keyword));
	}

	if (filters.q) {
		and.push(buildKeywordWhere(filters.q));
	}

	const salaryFrom = filters.salary_from ?? filters.min_salary;
	const salaryTo = filters.salary_to;
	if (salaryFrom != null || salaryTo != null) {
		const listed: Prisma.JobPostingsWhereInput = {
			salary_estimated: {
				...(salaryFrom != null && salaryFrom > 0 ? { gte: salaryFrom } : {}),
				...(salaryTo != null ? { lte: salaryTo } : {})
			}
		};
		if (salaryFrom == null || salaryFrom <= 0) {
			and.push({ OR: [listed, { salary_estimated: null }] });
		} else {
			and.push(listed);
		}
	} else if (filters.has_salary) {
		and.push({ salary: { not: null } });
	}

	if (filters.permanent_only) {
		and.push({ employment_type: { equals: 'Permanent', mode: 'insensitive' } });
	}

	if (filters.women_only) {
		and.push({ gender: { contains: 'Female', mode: 'insensitive' } });
	}

	if (filters.transgender_applicable) {
		and.push({ gender: { contains: 'Transgender', mode: 'insensitive' } });
	}

	if (filters.disability_quota) {
		and.push({ disability_quota: true });
	}

	if (filters.minority_quota) {
		and.push({ minority_quota: true });
	}

	// last_date_to_apply is DateTime (@db.Date) — compare with a Date, not a YYYY-MM-DD string
	if (!filters.show_expired) {
		const startOfToday = new Date();
		startOfToday.setUTCHours(0, 0, 0, 0);
		and.push({
			OR: [{ last_date_to_apply: null }, { last_date_to_apply: { gte: startOfToday } }]
		});
	}

	return { AND: and };
}

function buildOrderBy(sort: JobSort): Prisma.JobPostingsOrderByWithRelationInput[] {
	if (sort === 'closing_soon') {
		return [{ last_date_to_apply: { sort: 'asc', nulls: 'last' } }, { row_id: 'desc' }];
	}
	return [
		{ ad_date: { sort: 'desc', nulls: 'last' } },
		{ file_creation_date: { sort: 'desc', nulls: 'last' } },
		{ row_id: 'desc' }
	];
}

/** True when phrase (or all tokens) appears in a text field — mirrors keyword WHERE matching. */
function textFieldMatches(value: string | null | undefined, phrase: string): boolean {
	if (!value) return false;
	const hay = value.toLowerCase();
	const needle = phrase.trim().toLowerCase();
	if (!needle) return false;
	if (hay.includes(needle)) return true;

	const tokens = needle.split(/\s+/).filter(Boolean);
	if (tokens.length <= 1) return false;
	return tokens.every((token) => hay.includes(token));
}

/**
 * Lower is better: title → department → project/program → other searchable fields.
 * Call only for rows that already matched the keyword WHERE clause.
 */
function searchRelevanceRank(
	job: {
		title: string | null;
		department: string | null;
		project_program_name: string | null;
	},
	phrase: string
): number {
	if (textFieldMatches(job.title, phrase)) return 1;
	if (textFieldMatches(job.department, phrase)) return 2;
	if (textFieldMatches(job.project_program_name, phrase)) return 3;
	return 4;
}

function compareNullableDates(
	a: Date | null | undefined,
	b: Date | null | undefined,
	direction: 'asc' | 'desc'
): number {
	if (a == null && b == null) return 0;
	if (a == null) return 1; // nulls last
	if (b == null) return -1;
	const diff = a.getTime() - b.getTime();
	return direction === 'asc' ? diff : -diff;
}

function compareJobsBySort(
	a: {
		row_id: number | null;
		ad_date: Date | null;
		file_creation_date: Date | null;
		last_date_to_apply: Date | null;
	},
	b: {
		row_id: number | null;
		ad_date: Date | null;
		file_creation_date: Date | null;
		last_date_to_apply: Date | null;
	},
	sort: JobSort
): number {
	if (sort === 'closing_soon') {
		const byClosing = compareNullableDates(a.last_date_to_apply, b.last_date_to_apply, 'asc');
		if (byClosing !== 0) return byClosing;
	} else {
		const byAd = compareNullableDates(a.ad_date, b.ad_date, 'desc');
		if (byAd !== 0) return byAd;
		const byFile = compareNullableDates(a.file_creation_date, b.file_creation_date, 'desc');
		if (byFile !== 0) return byFile;
	}
	return (b.row_id ?? 0) - (a.row_id ?? 0);
}

/** Prefer global `q`, else drawer `keyword` — used only for ranking matched rows. */
function searchRankingPhrase(filters: JobFilters): string | null {
	const q = filters.q?.trim();
	if (q) return q;
	const keyword = filters.keyword?.trim();
	return keyword || null;
}

function maybeLogJobSearch(
	filters: JobFilters,
	result: ListJobsResult,
	tracking?: JobQueryTracking
): void {
	if (!tracking) return;
	const shouldLog = tracking.log ?? filtersAreActive(filters);
	if (!shouldLog) return;
	logSearch(filters, result.total, tracking);
}

/** Total matching jobs for the current filters — independent of pagination / row fetch. */
export async function countJobs(filters: JobFilters): Promise<number> {
	const where = buildJobWhere(filters);
	const rankingPhrase = searchRankingPhrase(filters);

	if (rankingPhrase) {
		const candidates = await db.jobPostings.findMany({
			where,
			select: {
				title: true,
				department: true,
				project_program_name: true
			}
		});
		return candidates.length;
	}

	return db.jobPostings.count({ where });
}

export async function listJobs(
	filters: JobFilters,
	tracking?: JobQueryTracking
): Promise<ListJobsResult> {
	const cacheKey = defaultListJobsCacheKey(filters);
	if (cacheKey) {
		const now = Date.now();
		if (defaultListJobsCache && defaultListJobsCache.key === cacheKey && defaultListJobsCache.expiresAt > now) {
			return defaultListJobsCache.data;
		}
		const inflight = defaultListJobsInflight.get(cacheKey);
		if (inflight) return inflight;

		const pending = queryListJobs(filters)
			.then((data) => {
				defaultListJobsCache = {
					key: cacheKey,
					data,
					expiresAt: Date.now() + DEFAULT_LIST_JOBS_TTL_MS
				};
				defaultListJobsInflight.delete(cacheKey);
				return data;
			})
			.catch((err) => {
				defaultListJobsInflight.delete(cacheKey);
				throw err;
			});
		defaultListJobsInflight.set(cacheKey, pending);
		return pending;
	}

	const result = await queryListJobs(filters);
	maybeLogJobSearch(filters, result, tracking);
	return result;
}

async function queryListJobs(filters: JobFilters): Promise<ListJobsResult> {
	const where = buildJobWhere(filters);
	const skip = (filters.page - 1) * filters.pageSize;
	const rankingPhrase = searchRankingPhrase(filters);

	// Keyword search: rank title → department → project/program → other, then apply sort.
	if (rankingPhrase) {
		const candidates = await db.jobPostings.findMany({
			where,
			select: {
				row_id: true,
				title: true,
				department: true,
				project_program_name: true,
				ad_date: true,
				file_creation_date: true,
				last_date_to_apply: true
			}
		});

		const ranked = candidates
			.filter((job): job is typeof job & { row_id: number } => job.row_id != null)
			.sort((a, b) => {
				const byRelevance =
					searchRelevanceRank(a, rankingPhrase) - searchRelevanceRank(b, rankingPhrase);
				if (byRelevance !== 0) return byRelevance;
				return compareJobsBySort(a, b, filters.sort);
			});

		const total = ranked.length;
		const pageIds = ranked.slice(skip, skip + filters.pageSize).map((job) => job.row_id);

		if (!pageIds.length) {
			return {
				jobs: [],
				total,
				page: filters.page,
				pageSize: filters.pageSize,
				totalPages: Math.max(1, Math.ceil(total / filters.pageSize))
			};
		}

		const pageJobs = await db.jobPostings.findMany({
			where: { row_id: { in: pageIds } }
		});
		const byId = new Map(
			pageJobs
				.filter((job): job is typeof job & { row_id: number } => job.row_id != null)
				.map((job) => [job.row_id, job])
		);
		const jobs = pageIds
			.map((id) => byId.get(id))
			.filter((job): job is NonNullable<typeof job> & { row_id: number } => job != null);

		return {
			jobs: toListJobs(jobs),
			total,
			page: filters.page,
			pageSize: filters.pageSize,
			totalPages: Math.max(1, Math.ceil(total / filters.pageSize))
		};
	}

	const [rawJobs, total] = await Promise.all([
		db.jobPostings.findMany({
			where,
			orderBy: buildOrderBy(filters.sort),
			skip,
			take: filters.pageSize
		}),
		db.jobPostings.count({ where })
	]);

	const jobs = rawJobs.filter(
		(job): job is (typeof rawJobs)[number] & { row_id: number } => job.row_id != null
	);

	return {
		jobs: toListJobs(jobs),
		total,
		page: filters.page,
		pageSize: filters.pageSize,
		totalPages: Math.max(1, Math.ceil(total / filters.pageSize))
	};
}

export async function getJobBySlug(slug: string) {
	const key = slug.trim();
	if (!key) return null;
	return db.jobPostings.findUnique({ where: { slug: key } });
}

export async function getJobById(rowId: number) {
	if (!Number.isInteger(rowId) || rowId < 1) return null;
	return db.jobPostings.findFirst({ where: { row_id: rowId } });
}

function frequencyRank(values: string[], cap = FILTER_OPTIONS_CAP): string[] {
	const counts = new Map<string, { label: string; count: number }>();
	for (const raw of values) {
		for (const part of splitMultiValue(raw)) {
			if (part.toUpperCase() === 'NA' || part === '-') continue;
			const key = part.toLowerCase();
			const existing = counts.get(key);
			if (existing) existing.count += 1;
			else counts.set(key, { label: part, count: 1 });
		}
	}
	return [...counts.values()]
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
		.slice(0, cap)
		.map((x) => x.label);
}

function distinctStrings(values: (string | null)[], cap = FILTER_OPTIONS_CAP): string[] {
	const counts = new Map<string, { label: string; count: number }>();
	for (const v of values) {
		const trimmed = v?.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		const existing = counts.get(key);
		if (existing) existing.count += 1;
		else counts.set(key, { label: trimmed, count: 1 });
	}
	return [...counts.values()]
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
		.slice(0, cap)
		.map((x) => x.label);
}

/** Unique grade_derived values from active postings, sorted A–Z (case-insensitive). */
function distinctGradesAlphabetical(values: (string | null)[]): string[] {
	const seen = new Map<string, string>();
	for (const value of values) {
		const trimmed = value?.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (!seen.has(key)) seen.set(key, trimmed);
	}
	return [...seen.values()].sort((a, b) =>
		a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })
	);
}

/** Unique labels from possibly comma-delimited fields, sorted A–Z. */
function distinctLabelsAlphabetical(values: (string | null)[]): string[] {
	const seen = new Map<string, string>();
	for (const value of values) {
		for (const part of splitMultiValue(value)) {
			if (part.toUpperCase() === 'NA' || part === '-') continue;
			const key = part.toLowerCase();
			if (!seen.has(key)) seen.set(key, part);
		}
	}
	return [...seen.values()].sort((a, b) =>
		a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })
	);
}

export async function getFilterOptions(): Promise<FilterOptions> {
	const now = Date.now();
	if (filterOptionsCache && filterOptionsCache.expiresAt > now) {
		return filterOptionsCache.data;
	}

	const [rows, gradeRows, domicileRows, salaryAgg] = await Promise.all([
		db.jobPostings.findMany({
			where: IS_ACTIVE_JOB,
			select: {
				degree_area: true,
				degrees: true,
				education_level: true,
				place_of_posting: true
			},
			take: 2000
		}),
		db.jobPostings.findMany({
			where: {
				AND: [IS_ACTIVE_JOB, { grade_derived: { not: null } }]
			},
			select: { grade_derived: true },
			distinct: ['grade_derived']
		}),
		db.jobPostings.findMany({
			where: {
				AND: [IS_ACTIVE_JOB, { domicile: { not: null } }]
			},
			select: { domicile: true },
			distinct: ['domicile']
		}),
		db.jobPostings.aggregate({
			where: {
				AND: [IS_ACTIVE_JOB, { salary_estimated: { not: null } }]
			},
			_max: { salary_estimated: true }
		})
	]);

	const data: FilterOptions = {
		degree_areas: frequencyRank(rows.map((r) => r.degree_area ?? '')),
		degrees: frequencyRank(rows.map((r) => r.degrees ?? '')),
		specializations: [...DEGREE_SPECIALIZATIONS],
		education_levels: frequencyRank(rows.map((r) => r.education_level ?? '')),
		grades: distinctGradesAlphabetical(gradeRows.map((r) => r.grade_derived)),
		places: frequencyRank(rows.map((r) => r.place_of_posting ?? '')),
		domiciles: distinctLabelsAlphabetical(domicileRows.map((r) => r.domicile)),
		portals: [...PORTAL_OPTIONS],
		salary_max: salaryAgg._max.salary_estimated ?? 0
	};

	filterOptionsCache = { data, expiresAt: now + FILTER_OPTIONS_TTL_MS };
	return data;
}

/**
 * Unique `last_date_to_apply` values for active, non-expired jobs (ascending).
 * Cached briefly so the Closing On filter dropdown stays cheap.
 */
export async function getClosingOnDates(): Promise<string[]> {
	const now = Date.now();
	if (closingOnDatesCache && closingOnDatesCache.expiresAt > now) {
		return closingOnDatesCache.data;
	}

	const startOfToday = new Date();
	startOfToday.setUTCHours(0, 0, 0, 0);

	const rows = await db.jobPostings.groupBy({
		by: ['last_date_to_apply'],
		where: {
			AND: [
				IS_ACTIVE_JOB,
				{
					last_date_to_apply: {
						not: null,
						gte: startOfToday
					}
				}
			]
		},
		orderBy: { last_date_to_apply: 'asc' }
	});

	const data = rows
		.map((row) => toDateKey(row.last_date_to_apply))
		.filter((key): key is string => key != null);

	closingOnDatesCache = { data, expiresAt: now + FILTER_OPTIONS_TTL_MS };
	return data;
}

/** Baseline filters for browse counts — active, non-expired postings only. */
function browseBaseFilters(partial: Partial<JobFilters> = {}): JobFilters {
	return {
		degree_areas: [],
		education_level: null,
		ad_date: null,
		closing_on: null,
		posted_by: null,
		donor_name: null,
		portal: null,
		gender: null,
		qualification: [],
		qualification_from: null,
		qualification_to: null,
		grade: null,
		age: null,
		age_from: null,
		age_to: null,
		include_no_max_age: true,
		age_max: null,
		place_of_posting: null,
		domicile: [],
		domicile_region: [],
		tag: [],
		department: null,
		collar: [],
		province: null,
		program: null,
		keyword: null,
		q: null,
		has_salary: false,
		permanent_only: false,
		women_only: false,
		transgender_applicable: false,
		disability_quota: false,
		minority_quota: false,
		min_salary: null,
		salary_from: null,
		salary_to: null,
		show_expired: false,
		sort: 'newest',
		page: 1,
		pageSize: DEFAULT_PAGE_SIZE,
		...partial
	};
}

async function countJobsMatching(partial: Partial<JobFilters>): Promise<number> {
	return db.jobPostings.count({ where: buildJobWhere(browseBaseFilters(partial)) });
}

/**
 * Education, gender, specialization, posted-by, ad-date, and donor links
 * for the browse sidebar, each with an active (non-expired) job count. Cached briefly.
 */
export async function getBrowseByCategoryData(): Promise<BrowseByCategoryData> {
	const now = Date.now();
	if (browseCountsCache && browseCountsCache.expiresAt > now) {
		return browseCountsCache.data;
	}

	const browseWhere = buildJobWhere(browseBaseFilters());

	const [options, adDateGroups, postedByGroups, donorGroups] = await Promise.all([
		getFilterOptions(),
		db.jobPostings
			.groupBy({
				by: ['ad_date'],
				where: {
					AND: [browseWhere, { ad_date: { not: null } }]
				},
				_count: { _all: true },
				orderBy: { ad_date: 'desc' }
			})
			.catch(() => [] as { ad_date: Date | null; _count: { _all: number } }[]),
		db.jobPostings
			.groupBy({
				by: ['posted_by'],
				where: {
					AND: [browseWhere, { posted_by: { not: null } }]
				},
				_count: { _all: true },
				orderBy: { _count: { posted_by: 'desc' } }
			})
			.catch(() => [] as { posted_by: string | null; _count: { _all: number } }[]),
		db.jobPostings
			.groupBy({
				by: ['donor_name'],
				where: {
					AND: [browseWhere, { donor_name: { not: null } }]
				},
				_count: { _all: true },
				orderBy: { _count: { donor_name: 'desc' } }
			})
			.catch(() => [] as { donor_name: string | null; _count: { _all: number } }[])
	]);

	const degreeAreaLabels = [
		...new Set([...options.degree_areas, ...options.degrees])
	].slice(0, FILTER_OPTIONS_CAP);

	const [educationLevels, genders, degreeAreas, jobInterestTree] = await Promise.all([
		Promise.all(
			options.education_levels.map(async (level) => ({
				label: level,
				count: await countJobsMatching({ education_level: level })
			}))
		),
		Promise.all(
			GENDER_BROWSE_LINKS.map(async (item) => ({
				value: item.value,
				label: item.label,
				count: await countJobsMatching({ gender: item.value })
			}))
		),
		Promise.all(
			degreeAreaLabels.map(async (label) => ({
				label,
				count: await countJobsMatching({ degree_areas: [label] })
			}))
		),
		Promise.all(
			JOB_INTEREST_TAXONOMY.map(async (branch) => {
				const children = await Promise.all(
					branch.children.map(async (child) => ({
						label: child.label,
						degree_areas: child.degree_areas,
						education_level: child.education_level,
						q: child.q,
						count: await countJobsMatching({
							degree_areas: child.degree_areas ?? [],
							education_level: child.education_level ?? null,
							q: child.q ?? null
						})
					}))
				);
				return {
					label: branch.label,
					count: children.reduce((sum, child) => sum + child.count, 0),
					children: children.filter((child) => child.count > 0)
				};
			})
		)
	]);

	const adDates = adDateGroups
		.map((row) => {
			const value = toDateKey(row.ad_date);
			if (!value) return null;
			return {
				value,
				label: formatDateLabel(value) ?? value,
				count: row._count._all
			};
		})
		.filter((row): row is BrowseAdDateLink => Boolean(row));

	const postedBy = postedByGroups
		.map((row) => {
			const label = row.posted_by?.trim();
			if (!label) return null;
			return { label, count: row._count._all };
		})
		.filter((row): row is BrowsePostedByLink => Boolean(row));

	const donors = donorGroups
		.map((row) => {
			const label = row.donor_name?.trim();
			if (!label || label.toUpperCase() === 'NA' || label === '-') return null;
			return { label, count: row._count._all };
		})
		.filter((row): row is BrowseDonorLink => Boolean(row));

	const allTags = getJobCategoryTags();
	const tagCounts = await Promise.all(
		allTags.map(async (tag) => ({
			slug: tag.slug,
			label: tag.label,
			count: await countJobCategoryJobs(tag)
		}))
	);
	const topTags = tagCounts
		.filter((t) => t.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 12);

	const data: BrowseByCategoryData = {
		adDates,
		postedBy,
		donors,
		genders,
		degreeAreas: degreeAreas.filter((item) => item.count > 0),
		educationLevels,
		jobInterestTree: jobInterestTree.filter((branch) => branch.children.length > 0),
		topTags
	};
	browseCountsCache = { data, expiresAt: now + BROWSE_COUNTS_TTL_MS };
	return data;
}

/** Active job counts per official portal label (matches Job Portal filter options). Cached briefly. */
export async function getPortalJobCounts(): Promise<PortalJobCount[]> {
	const now = Date.now();
	if (portalCountsCache && portalCountsCache.expiresAt > now) {
		return portalCountsCache.data;
	}

	const data = await Promise.all(
		PORTAL_OPTIONS.map(async (label) => ({
			label,
			count: await countJobsMatching({ portal: label })
		}))
	);

	portalCountsCache = { data, expiresAt: now + BROWSE_COUNTS_TTL_MS };
	return data;
}

export {
	filtersToSearchParams,
	filtersToHref,
	badgeFilterHref,
	isJobExpired,
	isClosingSoon,
	formatAgeRange
} from '$lib/jobs-utils';

export { eligibilityFiltersActive } from '$lib/jobs-utils';
