import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listJobs, parseJobFilters } from '$lib/server/jobs';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const filters = parseJobFilters(url);
		const result = await listJobs(filters);
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
