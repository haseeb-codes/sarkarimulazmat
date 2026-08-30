import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTopTagCounts } from '$lib/server/job-category-jobs';

export const GET: RequestHandler = async () => {
	try {
		const tags = await getTopTagCounts();
		return json({ tags });
	} catch (err) {
		console.error('GET /api/tags/top failed', err);
		error(500, 'Could not load tag counts');
	}
};
