import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listJobs, parseJobFilters } from '$lib/server/jobs';
import { applyPersonalizedFilters } from '$lib/server/personalized-jobs';
import { jobQueryTrackingFromLocals } from '$lib/server/request-context';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const session = await locals.auth();
		const filters = await applyPersonalizedFilters(parseJobFilters(url), session?.user?.id);
		const tracking = jobQueryTrackingFromLocals(locals, url.pathname + url.search);
		const result = await listJobs(filters, tracking);
		return json({
			jobs: result.jobs,
			total: result.total,
			page: result.page,
			pageSize: result.pageSize,
			totalPages: result.totalPages
		});
	} catch (err) {
		console.error('GET /api/jobs failed', err);
		error(500, 'Could not load jobs');
	}
};
