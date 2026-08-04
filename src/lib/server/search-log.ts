import db from '$lib/server/db';
import type { JobFilters } from '$lib/server/jobs';

/** Fire-and-forget search log — never throws to the caller. */
export function logSearch(
	filters: JobFilters,
	resultCount: number,
	visitorId?: string
): void {
	const payload = {
		degree_areas: filters.degree_areas,
		education_level: filters.education_level,
		grade: filters.grade,
		age: filters.age,
		place_of_posting: filters.place_of_posting,
		domicile: filters.domicile,
		q: filters.q ? filters.q.slice(0, 80) : null,
		show_expired: filters.show_expired,
		sort: filters.sort
	};

	db.searchLog
		.create({
			data: {
				visitor_id: visitorId ?? null,
				filters: payload,
				result_count: resultCount
			}
		})
		.catch((err) => {
			console.warn('SearchLog write failed', err);
		});
}
