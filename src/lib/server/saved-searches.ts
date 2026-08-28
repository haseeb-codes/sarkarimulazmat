import db from '$lib/server/db';
import type { Prisma } from '$lib/server/generated/prisma/client';
import type { JobFilters } from '$lib/server/jobs';
import {
	filtersToSearchParams,
	isAgeFilterActive,
	isQualificationFilterActive,
	resolvedUserAge,
	selectedQualificationLevels,
	selectedCollars,
	selectedDomiciles,
	selectedTags,
	formatQualificationLevel,
	formatGradeFilter
} from '$lib/jobs-utils';
import { getJobCategoryTagLabel } from '$lib/job-category-pages';
import { getDomicileRegionLabel, selectedDomicileRegions } from '$lib/domicile-regions';

const MAX_SAVED = 10;

export type SavedSearchRow = {
	id: string;
	label: string;
	href: string;
	created_at: Date;
};

function filtersToLabel(filters: Partial<JobFilters>): string {
	const parts: string[] = [];
	if (filters.degree_areas?.length) parts.push(filters.degree_areas.join(', '));
	if (filters.education_level) parts.push(filters.education_level);
	if (filters.grade) parts.push(formatGradeFilter(filters.grade) ?? filters.grade);
	if (isAgeFilterActive(filters)) {
		parts.push(`my age ${resolvedUserAge(filters)}`);
	}
	if (filters.place_of_posting) parts.push(filters.place_of_posting);
	const domiciles = selectedDomiciles(filters);
	if (domiciles.length) parts.push(domiciles.join(', '));
	const regions = selectedDomicileRegions(filters);
	if (regions.length) parts.push(regions.map((key) => getDomicileRegionLabel(key)).join(', '));
	const tags = selectedTags(filters);
	if (tags.length) parts.push(tags.map((slug) => getJobCategoryTagLabel(slug)).join(', '));
	if (filters.min_salary != null || filters.salary_from != null || filters.salary_to != null) {
		const from = filters.salary_from ?? filters.min_salary;
		const to = filters.salary_to;
		if (from != null && to != null) {
			parts.push(`salary ${from.toLocaleString('en-PK')}–${to.toLocaleString('en-PK')}`);
		} else if (from != null) {
			parts.push(`salary ${from.toLocaleString('en-PK')}+`);
		} else if (to != null) {
			parts.push(`salary up to ${to.toLocaleString('en-PK')}`);
		}
	} else if (filters.has_salary) parts.push('with salary');
	if (filters.permanent_only) parts.push('permanent only');
	if (filters.women_only) parts.push('women');
	if (filters.transgender_applicable) parts.push('transgender');
	if (filters.disability_quota) parts.push('disability');
	if (filters.minority_quota) parts.push('minority');
	if (isQualificationFilterActive(filters)) {
		const levels = selectedQualificationLevels(filters);
		if (levels.length) parts.push(formatQualificationLevel(levels[0]!));
	}
	if (filters.q) parts.push(`"${filters.q}"`);
	else if (filters.keyword) parts.push(`"${filters.keyword}"`);
	return parts.length ? parts.join(' · ') : 'Saved search';
}

function filtersToStored(filters: JobFilters): Prisma.InputJsonValue {
	return {
		degree_areas: filters.degree_areas,
		education_level: filters.education_level,
		qualification: filters.qualification,
		qualification_from: filters.qualification_from,
		qualification_to: filters.qualification_to,
		grade: filters.grade,
		age: filters.age,
		age_from: filters.age_from,
		age_to: filters.age_to,
		include_no_max_age: filters.include_no_max_age,
		age_max: filters.age_max,
		place_of_posting: filters.place_of_posting,
		domicile: filters.domicile,
		domicile_region: filters.domicile_region,
		tag: filters.tag,
		department: filters.department,
		collar: filters.collar,
		province: filters.province,
		has_salary: filters.has_salary,
		permanent_only: filters.permanent_only,
		women_only: filters.women_only,
		transgender_applicable: filters.transgender_applicable,
		disability_quota: filters.disability_quota,
		minority_quota: filters.minority_quota,
		min_salary: filters.min_salary,
		salary_from: filters.salary_from,
		salary_to: filters.salary_to,
		keyword: filters.keyword,
		q: filters.q,
		show_expired: filters.show_expired,
		sort: filters.sort
	};
}

export async function listSavedSearches(visitorId: string): Promise<SavedSearchRow[]> {
	const rows = await db.savedSearch.findMany({
		where: { visitor_id: visitorId },
		orderBy: { created_at: 'desc' },
		take: MAX_SAVED
	});

	return rows.map((row) => {
		const filters = row.filters as Partial<JobFilters> & {
			qualification_level?: number | null;
			collar?: string | string[] | null;
		};
		const params = filtersToSearchParams({
			degree_areas: filters.degree_areas ?? [],
			education_level: filters.education_level,
			qualification: selectedQualificationLevels({
				qualification: filters.qualification,
				qualification_from: filters.qualification_from ?? null,
				qualification_to: filters.qualification_to ?? filters.qualification_level ?? null
			}),
			qualification_from: null,
			qualification_to: null,
			grade: filters.grade,
			age: filters.age,
			age_from: filters.age_from,
			age_to: filters.age_to,
			include_no_max_age: filters.include_no_max_age,
			age_max: filters.age_max,
			place_of_posting: filters.place_of_posting,
			domicile: filters.domicile,
			domicile_region: filters.domicile_region ?? [],
			tag: filters.tag ?? [],
			department: filters.department,
			collar: selectedCollars({
				collar: Array.isArray(filters.collar)
					? filters.collar
					: filters.collar
						? [filters.collar]
						: []
			}),
			province: filters.province,
			has_salary: filters.has_salary,
			permanent_only: filters.permanent_only,
			women_only: filters.women_only,
			transgender_applicable: filters.transgender_applicable,
			disability_quota: filters.disability_quota,
			minority_quota: filters.minority_quota,
			min_salary: filters.min_salary,
			salary_from: filters.salary_from,
			salary_to: filters.salary_to,
			keyword: filters.keyword,
			q: filters.q,
			show_expired: filters.show_expired,
			sort: filters.sort
		});
		const qs = params.toString();
		return {
			id: row.id,
			label: row.label ?? filtersToLabel(filters),
			href: qs ? `/?${qs}` : '/',
			created_at: row.created_at
		};
	});
}

export async function createSavedSearch(
	visitorId: string,
	filters: JobFilters,
	label?: string
): Promise<{ ok: true } | { ok: false; reason: 'limit' | 'duplicate' }> {
	const count = await db.savedSearch.count({ where: { visitor_id: visitorId } });
	if (count >= MAX_SAVED) return { ok: false, reason: 'limit' };

	const stored = filtersToStored(filters);
	const existing = await db.savedSearch.findFirst({
		where: { visitor_id: visitorId, filters: { equals: stored } }
	});
	if (existing) return { ok: false, reason: 'duplicate' };

	await db.savedSearch.create({
		data: {
			visitor_id: visitorId,
			label: label?.trim() || filtersToLabel(filters),
			filters: stored
		}
	});

	return { ok: true };
}

export async function deleteSavedSearch(visitorId: string, id: string): Promise<boolean> {
	const result = await db.savedSearch.deleteMany({
		where: { id, visitor_id: visitorId }
	});
	return result.count > 0;
}
