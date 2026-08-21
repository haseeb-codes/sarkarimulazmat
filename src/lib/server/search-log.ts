import db from '$lib/server/db';
import type { JobFilters } from '$lib/server/jobs';

/** Fire-and-forget search log — never throws to the caller. */
export function logSearch(
	filters: JobFilters,
	resultCount: number,
	visitorId?: string,
	ipAddress?: string
): void {
	const payload = {
		degree_areas: filters.degree_areas,
		education_level: filters.education_level,
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
		keyword: filters.keyword ? filters.keyword.slice(0, 80) : null,
		q: filters.q ? filters.q.slice(0, 80) : null,
		show_expired: filters.show_expired,
		sort: filters.sort
	};

	db.searchLog
		.create({
			data: {
				visitor_id: visitorId ?? null,
				ip_address: ipAddress ?? null,
				filters: payload,
				result_count: resultCount
			}
		})
		.catch((err) => {
			console.warn('SearchLog write failed', err);
		});
}
