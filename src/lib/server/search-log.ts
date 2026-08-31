import db from '$lib/server/db';
import { jobFiltersSnapshot } from '$lib/server/filters-snapshot';
import type { JobFilters } from '$lib/server/jobs';
import type { JobQueryTracking } from '$lib/server/request-context';

function filtersToLogPayload(filters: JobFilters) {
	const snapshot = jobFiltersSnapshot(filters);

	return {
		...snapshot,
		keyword: snapshot.keyword ? String(snapshot.keyword).slice(0, 80) : null,
		q: snapshot.q ? String(snapshot.q).slice(0, 80) : null
	};
}

/** Fire-and-forget search log — never throws to the caller. */
export function logSearch(
	filters: JobFilters,
	resultCount: number,
	tracking: JobQueryTracking
): void {
	db.searchLog
		.create({
			data: {
				visitor_id: tracking.visitorId ?? null,
				user_id: tracking.userId ?? null,
				ip_address: tracking.ipAddress ?? null,
				path: tracking.path,
				user_agent: tracking.userAgent ?? null,
				browser: tracking.browser ?? null,
				browser_version: tracking.browserVersion ?? null,
				os: tracking.os ?? null,
				device_type: tracking.deviceType ?? null,
				filters: filtersToLogPayload(filters),
				result_count: resultCount
			}
		})
		.catch((err) => {
			console.warn('SearchLog write failed', err);
		});
}
