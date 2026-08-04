import db from '$lib/server/db';
import type { Prisma } from '$lib/server/generated/prisma/client';
import type { JobFilters } from '$lib/server/jobs';
import { filtersToSearchParams } from '$lib/jobs-utils';

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
	if (filters.grade) parts.push(filters.grade);
	if (filters.age) parts.push(`age ${filters.age}`);
	if (filters.place_of_posting) parts.push(filters.place_of_posting);
	if (filters.domicile) parts.push(filters.domicile);
	if (filters.q) parts.push(`"${filters.q}"`);
	return parts.length ? parts.join(' · ') : 'Saved search';
}

function filtersToStored(filters: JobFilters): Prisma.InputJsonValue {
	return {
		degree_areas: filters.degree_areas,
		education_level: filters.education_level,
		qualification_level: filters.qualification_level,
		grade: filters.grade,
		age: filters.age,
		place_of_posting: filters.place_of_posting,
		domicile: filters.domicile,
		department: filters.department,
		province: filters.province,
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
		const filters = row.filters as Partial<JobFilters>;
		const params = filtersToSearchParams({
			degree_areas: filters.degree_areas ?? [],
			education_level: filters.education_level,
			qualification_level: filters.qualification_level,
			grade: filters.grade,
			age: filters.age,
			place_of_posting: filters.place_of_posting,
			domicile: filters.domicile,
			department: filters.department,
			province: filters.province,
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
