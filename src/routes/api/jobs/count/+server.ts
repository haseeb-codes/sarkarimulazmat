import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { countJobs, parseJobFilters } from '$lib/server/jobs';
import { applyPersonalizedFilters } from '$lib/server/personalized-jobs';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const session = await locals.auth();
		const filters = await applyPersonalizedFilters(parseJobFilters(url), session?.user?.id);
		const total = await countJobs(filters);
		return json({ total });
	} catch (err) {
		console.error('GET /api/jobs/count failed', err);
		error(500, 'Could not load job count');
	}
};
