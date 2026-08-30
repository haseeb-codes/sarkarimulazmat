import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { countJobs, parseJobFilters } from '$lib/server/jobs';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const filters = parseJobFilters(url);
		const total = await countJobs(filters);
		return json({ total });
	} catch (err) {
		console.error('GET /api/jobs/count failed', err);
		error(500, 'Could not load job count');
	}
};
